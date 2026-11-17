# 構成と公開 (正本)

この文書が、3D 地図を「静的な画面」と「API」に分ける仕組みの、ただ 1 つの説明です。公開するパス、API の基点、公開と切り替えの手順、API に求めることはここだけに書き、ほかの文書には写さず、ここを指します。サービス全体の構成と運用の手順は、運用側の文書が正本です。ここには、ホスト名や内部のポート、中継サービスの設定は書きません。

## 分け方

- 静的な画面: `index.html`、`_nuxt/` (JavaScript と WebAssembly)、`sw.js` (Service Worker。ホーム画面に追加して開くための部品)、`pwa/`、`settings.json`、`lang/` (翻訳)、`assets/` (小さな画像)。すべて `public/` と `app/` から機械で作ります (`nuxt generate`)。出力はコミットしません。静的なファイルの置き場 (GitHub Pages) から配ります。
- API: 地図のタイルとテクスチャ、地図ごとの設定、プレイヤーの位置とマーカー、ライブ更新 (WebSocket)、看板のデータと中継、建築データを描くためのリソース。データの唯一の情報源は地図のデータベースで、その読み手は API の実装だけです。この画面はデータベースにも、Minecraft サーバーの中の Web サーバーにも、直接はつながりません。

### 静的に置くものを決めた理由

- 画面と一体で配られる小さなファイル (`settings.json`、`lang/`、`assets/`、`pwa/`) は、地図のデータとは更新の頻度が違い、数百 KB に収まります。画面と同じ場所に置けば、API が止まっていても画面と文言が出て、利用者に原因を伝えられます。
- 地図のタイルは全体で数十 GB あり、GitHub Pages の上限 (公開するサイトは 1 GB、月の転送量は 100 GB が目安) を大きく超えます。タイルは更新もあるので、静的な置き場には載せません。
- `settings.json` の `maps` (地図の一覧) と表示の既定値は静的に持ちます。地図が増えたら、このファイルを直して公開します。API 側で一覧を返せるようになったら、API から読む形に直せます。`mapDataRoot` と `liveDataRoot` は、このファイルに書いても使われません (API の基点から決めます)。

## API の基点 (apiBase)

- 正本は `nuxt.config.ts` の `runtimeConfig.public.apiBase` です。画面のコードに URL は書きません。
- 画面は `app/bluemap/api.ts` の `apiUrl(path)`、`wsUrl()`、`staticUrl(path)` だけで通信先を決めます。`apiUrl` は API の基点からの相対、`staticUrl` は画面と同じ場所の静的ファイルです。
- ビルド時に差し替えるときは `NUXT_PUBLIC_API_BASE` を使います。自動処理ではリポジトリの変数 `API_BASE` (秘密ではありません) です。
- API の基点は、2D の地図の API (`/map/v1`) と重ならないように、`/map3d/v1` を接頭辞にします。

## API が返すもの

下の表のパスは、API の基点からの相対です。`<地図>` は地図の id (`settings.json` の `maps`) です。

| パス | 中身 | 備考 |
| --- | --- | --- |
| `maps/<地図>/settings.json` | 地図ごとの設定 | |
| `maps/<地図>/textures.json` (と `.gz`) | テクスチャの一覧 | 数 MB。あまり変わらない |
| `maps/<地図>/tiles/...` | 高精細と低精細のタイル | BlueMap の保存形式のそのまま |
| `maps/<地図>/assets/playerheads/<UUID>.png` | プレイヤーの顔 | |
| `maps/<地図>/live/players.json` | プレイヤーの位置 | キャッシュは短く |
| `maps/<地図>/live/markers.json` | マーカー | |
| `maps/<地図>/live/sse` | ライブ更新 (Server-Sent Events) | WebSocket がつながらないときの代わり。流すだけでためない |
| `ws` (WebSocket) | ライブ更新 | つながったら、`{"bluemap":"<地図>"}` で見る地図を知らせる。届くのは `{"type":"bluemap","map":"<地図>","event":"player\|tile\|marker","data":"<JSON の文字列>"}` と、状態の知らせ `{"type":"bluemap","map":"<地図>","state":"open\|error"}` |
| `marumasign/<地図>.json` | 看板のデータ | 看板の管理側が書き、1 日に数回変わる。毎回取り直す (`no-cache`) |
| `marumasign/resolve?u=<URL>[&p=<URL>...]` | 看板の URL の転送の行き先 | 看板のデータにある URL とそこからたどれるものだけを調べる |
| `marumasign/proxy?u=<URL>[&p=<URL>...]` | CORS を返さないサイトの画像・動画などの中継 | 動画は Range に対応。種類と大きさの上限、https のみ、内部のアドレスへはつながない |
| `mcassets/index.json` | 建築データを描くためのリソースの識別子 | |
| `mcassets/<識別子>/...` | リソース本体 (`assets.json`、`textures.bin`、`unifont/`) | 内容に識別子が入るので、長く持ってよい |
| `mcassets/skin?name=<名前>` または `?uuid=<UUID>` | プレイヤーの頭のスキンの URL | |

画面が別のオリジンから読むので、API の側には次が要ります。

- すべての応答に、画面のオリジンを許す `Access-Control-Allow-Origin` を付ける (読み取りだけなら `*` でもよい)。
- `marumasign/proxy` の応答の頭書き `X-MarumaSign-URL`、`X-MarumaSign-Type`、`X-MarumaSign-Kind`、動画のための `Accept-Ranges`、`Content-Range`、`Content-Length` を `Access-Control-Expose-Headers` で見せる。`Range` の頭書きを付けた要求に答えるため、事前確認 (OPTIONS) で `Access-Control-Allow-Headers: Range` を許す。
- WebSocket のオリジンの確かめで、画面のオリジンを許す。
- ブラウザには Cookie を送らせません (`credentials` なし)。API は Cookie に頼らないこと。

## 公開 (静的な画面)

- `.github/workflows/pages.yml`: `main` への反映と手動実行で、`npm ci` → `npm run build:client` → `nuxt generate` → GitHub Pages へ配備します (リポジトリの Pages の設定は Source を Actions にします)。
- カスタムドメインは、リポジトリの設定 (Settings の Pages) で設定し、HTTPS の強制を有効にします。Actions で配備するときは `public/CNAME` は使われません。
- DNS は、画面のホスト名を GitHub Pages のホスト名への CNAME にします (プロキシなし。証明書は GitHub が発行します)。DNS は Terraform のリポジトリで管理し、変更は Pull Request → マージで自動的に適用されます。
- 画面だけを変えたときは `main` へ反映するだけです。

## Tunnel のパスルールの追加 (API のホスト)

API は Cloudflare Tunnel の公開アプリケーションで受けています。3D 用の接頭辞を足すには、Cloudflare のダッシュボード (Zero Trust の Networks → Tunnels → 対象のトンネル → 公開アプリケーション) で、手作業で規則を足します。Tunnel は設定をダッシュボードで持つ方式で、Terraform の対象外です。

| 順 | ホスト名 | パス (正規表現) | 送り先 |
| --- | --- | --- | --- |
| パス指定なしの規則より前 | API のホスト | `^/map3d/` | API を受ける中継サーバー (既存の `^/map/` の規則と同じ送り先) |

- パス欄の `^` は正規表現の行頭の記号で、URL の一部ではありません。ホスト名とパスは別々の欄に入れます。実際の URL は `https://<API のホスト>/map3d/v1/...` の形です。
- `^/map/` は末尾の `/` までを含むので、`/map3d/...` には一致しません。`^/map3d/` は別の規則として足します。
- 上から順に最初に合った規則が使われます。追加した直後は末尾に入るので、パス指定なしの規則より上に並べ替えます。
- 確認 (GET だけ): `/map3d/v1/maps/<地図>/settings.json` が 200、既存の `/map/v1/configuration` が引き続き 200。
- 変更したら、トンネルのコネクタのログの `Updated to new configuration` (version が上がる) に出る規則の並びで確かめます。
- 戻すときは、追加した規則を消します (`/map3d/` は API の既定の経路に戻り、404 になります)。

## 切り替えと切り戻し

並行期間は、画面は新しい静的なサイトと従来のサイトの両方を動かします。次の順で進め、各段階で戻せるようにします。

1. API 側で、上の表のパスが返ることを確かめる (API の実装が揃う前は、画面の静的な配信だけが成立し、地図の表示は完結しません)。切り戻し: 不要 (静的なサイトだけの確認)。
2. 中継サーバーに `/map3d/` の振り分けを足す (WebSocket は 2 つの接頭辞を同時に扱えること)。切り戻し: 前のバージョンの設定へ戻す。
3. Tunnel に `^/map3d/` の規則を足す (上の手順)。切り戻し: 規則を削除。
4. 実ブラウザで、新しいサイトの地図の表示、ライブ更新、看板、モバイル、ホーム画面への追加を確かめる。基準: 地図が開き、コンソールにエラーがなく、通信の宛先がすべて API の基点または静的なサイト自身である。
5. 切り替え: 従来のサイトのホスト名から新しいサイトへ転送する。看板の画像を配る側のオリジンの許可と、看板の管理側が書く URL を、新しいサイトに更新する。切り戻し: 転送を解除する (従来のサイトは変えずに残す)。
6. 従来の画面のコードを、元のリポジトリから取り除く (本番の反映は、4 と 5 が済んでから)。切り戻し: 取り除く前のイメージのタグへ戻す。

## API の側への申し送り

API の実装 (別のリポジトリ) は、次を担います。この画面の側では実装しません。

- 地図のデータベースを読む、タイル・テクスチャ・地図の設定の配信 (上の表の `maps/<地図>/` の静的な部分)。
- ライブ関係: プレイヤーの位置とマーカー (BlueMap 本体が持つライブのデータを API が受け渡す形)、ライブ更新の WebSocket (`ws`)。従来の経路は同じ内容を `/up/ws` で返しています。
- 看板のサーバー側の処理 (`marumasign/`)、建築データのリソース (`mcassets/`)。看板の画像を配る別の窓口と、クライアント情報の経路を 3D の API に含めるかは、判断が要ります。
- ルーティング: Tunnel の規則 (上) と、中継サーバーと API の振り分け。
- 切り替え: 上の手順 5。
# 設計メモ

概要は [README.md](../README.md)、構成と公開は [deployment.md](deployment.md)、外部の部品の表示は [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) にあります。この文書は、画面の作り、看板の表示、建築データの描き方のメモです。

## 画面

3D 地図の画面は `app/bluemap/` です。BlueMap 5.29 の webapp を TypeScript にしたもので、見た目と動きは元と同じです。

| 場所 | 中身 |
| --- | --- |
| `app/app.vue` | 入口。API の基点を画面へ渡し (`configureApi`)、Service Worker を登録して、画面を出す |
| `app/bluemap/api.ts` | 通信先を決める唯一の場所 (`apiUrl`、`wsUrl`、`staticUrl`)。Nuxt に依存しない |
| `app/bluemap/BlueMapView.vue` | 元の `main.js` と `index.html` の代わり |
| `app/bluemap/js/` | 地図の描画、操作、マーカー、ライブ更新 (`BlueMapApp.ts`) |
| `app/bluemap/marumasign/` | 看板の表示 |
| `app/lib/` | 画面が使う小さな部品 (HTML の無害化、リンクの確かめ) |
| `client/sw.ts` | Service Worker。ページはいつもネットから読み、つながらないときだけ `public/pwa/offline.html` を出す。`/_nuxt/` のファイルだけをキャッシュし、地図のデータはキャッシュしない |
| `public/` | 静的に配るファイル (`settings.json`、`lang/`、`assets/`、`pwa/`) |

型は 2 か所で確かめます。`app/bluemap/tsconfig.json` は元が JavaScript なので null の確認 (strictNullChecks) までは求めず、クラスのフィールドは `useDefineForClassFields: false` の前提です (`nuxt.config.ts` の `vite.oxc`)。それ以外は Nuxt の設定で確かめ、画面は `app/types/bluemap-view.d.ts` の型として見ます。

ライブ更新は、WebSocket を先に試し、つながらないときは元の BlueMap と同じ Server-Sent Events にし、どちらもつながっていないあいだは元のとおり 1 秒 (マーカーは 10 秒) ごとに取りに行きます。

## 看板

ワールドの看板に設定された画像・動画・音声・ライブ配信・PDF・3D モデル・ガウシアンスプラッティング・建築データを、3D の空間に置きます。看板のデータ (`marumasign/<地図>.json`) は、看板の管理側が書きます。

- 看板の URL は誰でも書けるので、`overlay.ts` の先頭の決まり (innerHTML を使わない、https だけ、Cookie なし、Referer なし、転送を追わない、大きさと数の上限) を守ります。
- 外のサイトのものは、まずブラウザが直に読みます (CORS)。読めなければ API に頼みます (`fetch.ts`): 転送の行き先を `marumasign/resolve` で聞き、それでもだめなら `marumasign/proxy` で中継してもらいます。API の側は、看板のデータにある URL とそこからたどれるものだけを、決まった種類と大きさで中継します。
- 画像のほかは、その種類の看板が近くに来たときに初めて読み込みます (動画は hls.js・shaka-player・mpegts.js、PDF は pdf.js、3D モデルは three.js、ガウシアンスプラッティングは Spark、建築データは Worker で四角形にして描く、珍しい画像の形式は `decoders/`)。
- ブラウザが再生できない動画・音声の入れ物は、FFmpeg の WebAssembly で MP4 にします。そうした看板が来たときに初めて約 31 MB を読みます。
- 画像の形式は、TIFF、DDS、KTX2 (BC1 - BC7)、DPX、IFF、XWD、PGX、JPEG 2000、HEIC、JPEG XL、アニメーションの WebP などを読みます。試験の材料は `tests/fixtures/images/` です。
- 看板のある画面のサイトには、動画・音声のための `media-src 'self' https: blob:` を許す CSP (Content-Security-Policy) が要ります。GitHub Pages は応答の頭書きを付けられないので、必要なら HTML の `meta` で足します (`frame-ancestors` は `meta` では効きません)。

## 建築データ

建築データの看板 (.schem .litematic .nbt .mcstructure .schematic) は、Minecraft のクライアントのブロックのモデルとテクスチャで描きます。`structure/` は、元のゲームの処理を TypeScript に移したものです。

- 形: blockstates (variants / multipart) と models (継承、要素の回転と拡大、uvlock、cullface、tintindex)。
- 明るさ: なめらかな明るさ (環境光の遮蔽) と面の向きの明るさ。昼の屋外として計算します。
- 色: 草・葉・水の色は、建築データに書かれたバイオーム。書かれていなければ平原。
- 動くテクスチャ (水、溶岩など): `.mcmeta` のとおり 1 秒に 20 回進めます。画面に入っているときだけです。
- ミップマップ: ゲームと同じ混ぜ方で、テクスチャごとに 4 段作ります。
- ブロックエンティティとエンティティ: チェスト、シュルカーボックス、旗、看板、頭、飾り壺、鐘、絵画、額縁、防具立てなど。
- リソースは API の `mcassets/` から読みます。使えないとき (`index.json` が 503) は、地図のテクスチャで簡単にした形を描きます (`structure/mesher.ts`)。

## 試験

`npm test` で、看板の判別、画像の読み込み、建築データの読み込みと四角形にする処理、3D モデル、ガウシアンスプラッティング、HTML の無害化を確かめます。本物のクライアントのファイルで確かめるときは、環境変数 `MCJAR` にそのファイルの場所を渡します (なければ飛ばします)。
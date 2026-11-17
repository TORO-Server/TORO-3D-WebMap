# TORO-3D-WebMap

Minecraft サーバー「TORO Server」の 3D 地図を見るための、ブラウザ用の画面です。画面は静的なファイル (サーバー側の処理が要らない HTML・JavaScript・画像) だけでできていて、地図のタイル、プレイヤーの位置、看板のデータは、すべて別の場所にある API (プログラムから呼び出すための窓口) から読みます。

[BlueMap](https://bluemap.bluecolored.de/) (Minecraft 用の地図ソフト) の画面を TypeScript に書き直したもので、見た目と動きは元と同じです。ワールドに置かれた看板に設定された画像・動画・音声・PDF・3D モデル・建築データも、地図の中に表示します。Nuxt (Vue のアプリの枠組み) で作っています。

## 動かしてみる

Node.js 24 以上が必要です。

```bash
npm ci
npm run typecheck
npm test
npm run build
```

`npm run build` の出力は `.output/public` に置かれ、そのまま静的なファイルの置き場に公開できます。手元で試すときは `npm run dev` です。

API の接続先は、既定では公開されている API です。別の API を使うときは、環境変数 `NUXT_PUBLIC_API_BASE` に API の基点の URL を設定してください。設定の既定値は [nuxt.config.ts](nuxt.config.ts) にあります。

## 文書

- 構成 (静的な部分と API の分け方)、公開と切り替えの手順、API に求めること: [docs/deployment.md](docs/deployment.md)
- 画面の作り、看板の表示、建築データの描き方: [docs/design.md](docs/design.md)
- 利用している外部の部品の表示: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
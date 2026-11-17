# 外のもの (サードパーティ)

この画面が使っている、他の人が作った部品の表示です。バージョンの正本は `package.json` と `package-lock.json` です。

## 画面のもとになったもの

| 名前 | ライセンス | 元 | 使い方 |
| --- | --- | --- | --- |
| BlueMap の webapp | MIT (Copyright (c) Blue (Lukas Rieger) と貢献者) | https://github.com/BlueMap-Minecraft/BlueMap | `app/bluemap/` の画面のもと。バージョン 5.29 の画面を TypeScript にした。`public/lang/` の翻訳、`public/assets/` の画像も同梱のものそのまま |
| Quicksand (フォント) | SIL Open Font License 1.1 (Copyright 2011 The Quicksand Project Authors) | https://github.com/andrew-paglinawan/QuicksandFamily | `app/bluemap/fonts/`。ライセンス全文は同じフォルダの `OFL.txt` |
| minecraft-data | MIT | https://github.com/PrismarineJS/minecraft-data | 建築データの古い番号と統合版の表 (`app/bluemap/marumasign/structure/tables/`)。全文は同じフォルダの `LICENSE-minecraft-data.txt` |

## 看板の画像・動画のための部品

どれも、その形式の看板が近くに来たときに初めて、別のファイル (`/_nuxt/` の js と wasm) として読み込みます。
| 名前 | ライセンス | 元 | 使い方 |
| --- | --- | --- | --- |
| @ffmpeg/core (1 スレッド用のバージョン) | GPL-2.0-or-later | https://github.com/ffmpegwasm/ffmpeg.wasm (FFmpeg https://ffmpeg.org/、x264、x265 などを含む) | ブラウザーが再生できない動画・音声を MP4 にする。`ffmpeg-core.js` と `ffmpeg-core.wasm` はそのまま別のファイルとして置き、`sources/ffmpeg-worker.ts` (自前の Worker) から呼ぶ。ソースは元の置き場の v0.12.10 のタグ |
| libheif-js | LGPL-3.0 | https://github.com/catdad-experiments/libheif-js | HEIC を WebCodecs で読めないとき。中の libheif 1.23 (LGPL-3.0, https://github.com/strukturag/libheif) と libde265 (LGPL-3.0, https://github.com/strukturag/libde265) を含む。`libheif-wasm/libheif.js` と `libheif.wasm` のソースには手を加えず、ほかのコードと別のファイルとして使う (置き換えられる)。wasm はそのままのバイト列を `/_nuxt/libheif.<hash>.wasm` に置く。js はビルドで ES モジュールに包んで縮めるだけ (処理は同じ。`/_nuxt/` の別の chunk になる)。wasm は `decoders/codecs.ts` が取ってきてコンパイルし、Emscripten の `instantiateWasm` で渡す。ライセンスの全文は npm のパッケージの `LICENSE` と `libheif-wasm/LICENSE` |
| jxl-oxide-wasm | MIT または Apache-2.0 | https://github.com/tirr-c/jxl-oxide | JPEG XL をブラウザーが読めないとき |
| fzstd | MIT | https://github.com/101arrowz/fzstd | TIFF の Zstandard |
| jpeg-js | BSD-3-Clause | https://github.com/eugeneware/jpeg-js | TIFF の中の JPEG |
| pdfjs-dist の OpenJPEG | Apache-2.0 (pdf.js)、BSD-2-Clause (OpenJPEG) | https://github.com/mozilla/pdf.js | JPEG 2000 (PDF の看板と同じもの。wasm と、wasm を使わないバージョン `openjpeg_nowasm_fallback.js`) |
| bcdec (書き直したもの) | MIT (Copyright (c) 2022 Sergii Kudlai) | https://github.com/iOrange/bcdec | `decoders/bcn.ts` の BC6H と BC7 (MarumaSign 本体の Bptc.java と同じ) |

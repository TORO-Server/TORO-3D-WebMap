// app/: 3D 地図の画面 (BlueMap の webapp を TypeScript にしたもの)。サーバーで描かず、ブラウザで描く (nuxt generate で静的なファイルにする)
// 地図のデータ・ライブ情報・看板は、ここで決める API の基点 (runtimeConfig.public.apiBase) から読む。docs/deployment.md
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: false,
  pages: false,
  devtools: { enabled: false },
  telemetry: false,
  // 公開するファイルにソースマップを入れない
  sourcemap: { server: false, client: false },
  app: {
    // ブラウザで描く前の HTML にも入るので、日本語のページとして扱われる。アイコンなどは画面 (app/bluemap/BlueMapView.vue) が足す
    head: {
      title: 'TORO Server 3D 地図',
      htmlAttrs: { lang: 'ja' },
      meta: [
        { name: 'description', content: 'TORO Server (Minecraft) のワールドの 3D 地図' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1' },
      ],
    },
  },
  typescript: {
    // 3D 地図の画面は別に確かめる (app/types/bluemap-view.d.ts)
    appTsConfig: {
      compilerOptions: {
        paths: { '~/bluemap/BlueMapView.vue': ['../app/types/bluemap-view.d.ts'] },
      },
      exclude: ['../app/bluemap/**'],
    },
  },
  vite: {
    // 宣言だけのクラスのフィールドで、親のクラスが入れた値を消さない (tsconfig の useDefineForClassFields: false と同じ)。
    // 画面は元が JavaScript なので、この前提で書かれている (three.js の Object3D の position なども消えない)
    oxc: {
      typescript: { removeClassFieldsWithoutInitializer: true },
      assumptions: { setPublicClassFields: true },
    },
    plugins: [{
      // three.js の DRACOLoader が既定で指す、使わない Draco の展開のプログラム (draco_decoder.js など、合わせて 1 MB) をビルドに入れない。
      // 3D モデルの看板は glTF 用の小さいもの (DRACO_GLTF_CONFIG) だけを使う (app/bluemap/marumasign/model-load.ts)
      name: 'drop-draco-defaults',
      enforce: 'pre',
      transform(code: string, id: string) {
        if (!/three[\\/]examples[\\/]jsm[\\/]loaders[\\/]DRACOLoader\.js$/.test(id.split('?')[0]!)) return null
        const out = code.replace(/new URL\(\s*'\.\.\/libs\/draco\/draco_[a-z_]+\.(?:js|wasm)',\s*import\.meta\.url\s*\)\.toString\(\)/g, '\'\'')
        if ((code.match(/draco_[a-z_]+\.(?:js|wasm)'/g) ?? []).length - (out.match(/draco_[a-z_]+\.(?:js|wasm)'/g) ?? []).length !== 3) {
          throw new Error('drop-draco-defaults: DRACOLoader.js changed; check the default decoder URLs')
        }
        return { code: out, map: null }
      },
    }],
    // 画面の vue-i18n (BlueMap の vite.config.js と同じ)
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
    },
  },
  runtimeConfig: {
    public: {
      // 画面が読む API の基点。この文字列の正本はここ 1 か所 (画面は app/bluemap/api.ts の apiUrl() と wsUrl() だけで API に触る)。
      // ビルド時に NUXT_PUBLIC_API_BASE を設定すると差し替えられる (自動処理ではリポジトリの変数 API_BASE)。docs/deployment.md
      apiBase: 'https://api.torosaba.net/map3d/v1',
    },
  },
  // npm run dev では、手元の画面が API の基点 (既定は本番) から読む。別の API を使うときは NUXT_PUBLIC_API_BASE を設定する
})
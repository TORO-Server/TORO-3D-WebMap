// 3D 地図の画面が行う通信の宛先は、すべてここで決める。ほかの場所に URL や相対パスを書かない。
//  - API (地図のタイル・ライブ情報・看板のデータなど): apiUrl() / wsUrl()。基点 (apiBase) の正本は nuxt.config.ts の runtimeConfig.public.apiBase
//  - 画面と一緒に配る小さな静的ファイル (settings.json, lang/, assets/, pwa/): staticUrl()
// Nuxt に依存しないよう、基点は app/app.vue が起動時に configureApi() で渡す (試験や型の確認でも読み込める)。
let base = ''

/** 起動時に 1 度だけ、API の基点を設定する。末尾の / は取り除く */
export function configureApi(apiBase: string): void {
  base = String(apiBase).replace(/\/+$/, '')
}

/** 末尾の / なしの API の基点 */
export function apiBase(): string {
  if (!base) throw new Error('API の基点が設定されていません (configureApi)')
  return base
}

/** API の URL。path は基点からの相対 (例: 'maps/overworld/settings.json')。先頭の / は付けても付けなくてもよい */
export function apiUrl(path: string): string {
  return `${apiBase()}/${path.replace(/^\/+/, '')}`
}

/** API の WebSocket の URL (基点の https は wss、http は ws。基点が相対パスなら、いまのページのオリジンから) */
export function wsUrl(): string {
  const url = new URL(apiUrl('ws'), window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/** 画面と一緒に配る静的ファイルの URL (このページと同じ場所。path はサイトの最上位からの相対) */
export function staticUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ''), new URL(import.meta.env.BASE_URL ?? '/', window.location.origin)).toString()
}

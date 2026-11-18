// 基点 (末尾の / なし) とパスをつなぐ。パスの先頭の / は取り除く。api.ts の apiUrl() と tileUrl() が使う (Vite の型に依存しないので、試験でも読み込める)

export function joinBase(base: string, path: string): string {
  return `${base}/${path.replace(/^\/+/, '')}`
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { joinBase } from '../app/bluemap/base-url.ts'

const read = (p: string): string => readFileSync(new URL(p, import.meta.url), 'utf8')

const API = 'https://api.torosaba.net/map3d/v1'
const TILE = 'https://assets.torosaba.net/map3d/v1'

test('joinBase: タイルの URL は assets のホスト、パスは API と同じ', () => {
  assert.equal(joinBase(TILE, 'maps/world/tiles/0/x0/z0.prbm'), `${TILE}/maps/world/tiles/0/x0/z0.prbm`)
  assert.equal(joinBase(TILE, '/maps/world/tiles/1/x0/z0.png'), `${TILE}/maps/world/tiles/1/x0/z0.png`)
  assert.equal(joinBase(API, 'maps/world/settings.json'), `${API}/maps/world/settings.json`)
  assert.equal(joinBase(TILE, 'maps/w/tiles/0/a').replace(TILE, ''), joinBase(API, 'maps/w/tiles/0/a').replace(API, ''))
})

test('api.ts: tileUrl は tileBase を使い、apiUrl は apiBase を使う', () => {
  const api = read('../app/bluemap/api.ts')
  assert.match(api, /tileUrl\(path: string\)[^}]*joinBase\(tileBase\(\), path\)/)
  assert.match(api, /apiUrl\(path: string\)[^}]*joinBase\(apiBase\(\), path\)/)
})

test('nuxt.config.ts: tileBase は assets、apiBase は api で、パスは同じ', () => {
  const conf = read('../nuxt.config.ts')
  const api = /apiBase:\s*'([^']+)'/.exec(conf)?.[1]
  const tile = /tileBase:\s*'([^']+)'/.exec(conf)?.[1]
  assert.equal(api, API)
  assert.equal(tile, TILE)
  assert.equal(new URL(tile!).pathname, new URL(api!).pathname)
})

test('タイルの取得 (Map.ts) だけが tileDataRoot を使い、settings.json と textures.json は mapDataRoot のまま', () => {
  const map = read('../app/bluemap/js/map/Map.ts')
  assert.match(map, /\$\{this\.data\.tileDataRoot\}\/tiles\/0\//)
  assert.match(map, /\$\{this\.data\.tileDataRoot\}\/tiles\//)
  assert.doesNotMatch(map, /\$\{this\.data\.mapDataRoot\}\/tiles/)
  assert.match(map, /settingsUrl: mapDataRoot \+ "\/settings\.json"/)
  assert.match(map, /texturesUrl: mapDataRoot \+/)
})

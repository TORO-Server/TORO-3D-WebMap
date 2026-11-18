<script setup lang="ts">
// 3D 地図の入口。API の基点 (runtimeConfig.public.apiBase) とタイルの基点 (同 tileBase。どちらも nuxt.config.ts) を画面に渡し、画面 (app/bluemap/BlueMapView.vue) を出す。
// 画面のコードは Nuxt に依存しないので、基点はここで 1 度だけ渡す (app/bluemap/api.ts)
import { defineAsyncComponent, type Component } from 'vue'
import { configureApi } from '~/bluemap/api'

configureApi(String(useRuntimeConfig().public.apiBase), String(useRuntimeConfig().public.tileBase))

const View = defineAsyncComponent<Component>(() => import('~/bluemap/BlueMapView.vue'))

// ホーム画面に追加して開けるようにする (client/sw.ts)。手元の npm run dev では使わない
if (!import.meta.dev && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(e => console.warn('Service Worker を登録できませんでした', e))
}
</script>

<template>
  <View />
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import Globe3d from '../visualization/Globe3d.vue'

onMounted(() => {
  document.documentElement.classList.add('globe-page')
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('globe-page')
})
</script>

<template>
  <main class="earth-view">
    <header class="earth-view__header">
      <span>3D 地球</span>
      <h1>中国区域高亮</h1>
    </header>

    <section class="earth-view__stage">
      <Globe3d />
    </section>

    <p class="earth-view__hint">拖动旋转 · 滚轮缩放</p>
  </main>
</template>

<style scoped>
.earth-view {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  color: #e8f4ff;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  background: #010309;
}

.earth-view__header {
  position: absolute;
  z-index: 4;
  top: clamp(24px, 4vh, 48px);
  left: clamp(24px, 4vw, 56px);
  pointer-events: none;
}

.earth-view__header span {
  display: block;
  margin-bottom: 8px;
  color: #6ec8ff;
  font-size: 13px;
  letter-spacing: 0.18em;
}

.earth-view__header h1 {
  margin: 0;
  font-size: clamp(28px, 3.2vw, 44px);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.earth-view__stage {
  position: absolute;
  inset: 0;
}

.earth-view__hint {
  position: absolute;
  z-index: 4;
  right: clamp(24px, 4vw, 56px);
  bottom: 28px;
  margin: 0;
  color: rgba(150, 190, 220, 0.45);
  font-size: 12px;
  letter-spacing: 0.12em;
  pointer-events: none;
}
</style>

<style>
html.globe-page,
html.globe-page body {
  overflow: hidden;
  background: #010309;
}

html.globe-page #app {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0;
  border: 0;
}
</style>

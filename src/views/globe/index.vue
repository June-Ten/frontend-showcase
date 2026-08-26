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
  color: #9fd4ee;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  background: #02010c;
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
  color: rgba(122, 170, 233, 0.55);
  font-size: 12px;
  letter-spacing: 0.12em;
  pointer-events: none;
}
</style>

<style>
html.globe-page,
html.globe-page body {
  overflow: hidden;
  background: #02010c;
}

html.globe-page #app {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0;
  border: 0;
}
</style>

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
      <span class="earth-view__eyebrow">3D 地球</span>
      <h1>中国，在世界之中。</h1>
      <p>转动地球，从不同角度观察这片土地。</p>
    </header>

    <section class="earth-view__stage">
      <Globe3d />
    </section>

    <footer class="earth-view__footer">
      拖动旋转 · 滚轮缩放
    </footer>
  </main>
</template>

<style scoped>
.earth-view {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 28px;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 560px;
  overflow: hidden;
  padding: clamp(28px, 4vw, 64px) clamp(24px, 6vw, 96px) 26px;
  color: #f5f5f7;
  font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
  background: #000;
}

.earth-view__header {
  position: relative;
  z-index: 3;
  width: min(520px, 70vw);
}

.earth-view__eyebrow {
  display: block;
  margin-bottom: 12px;
  color: #ff6b49;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.earth-view h1 {
  margin: 0;
  font-size: clamp(34px, 4.4vw, 68px);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.earth-view__header p {
  margin: 18px 0 0;
  color: #86868b;
  font-size: clamp(14px, 1.3vw, 18px);
  line-height: 1.6;
}

.earth-view__stage {
  position: relative;
  min-height: 0;
  margin: clamp(-82px, -7vh, -36px) calc(clamp(24px, 6vw, 96px) * -0.7) 0;
}

.earth-view__footer {
  position: relative;
  z-index: 3;
  color: #555;
  font-size: 11px;
  letter-spacing: 0.04em;
}

@media (max-width: 720px) {
  .earth-view {
    padding: 28px 22px 18px;
  }

  .earth-view__header {
    width: 100%;
  }

  .earth-view__stage {
    margin: -34px -22px 0;
  }
}
</style>

<style>
html.globe-page,
html.globe-page body {
  overflow: hidden;
  background: #000;
}

html.globe-page #app {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0;
  border: 0;
}
</style>

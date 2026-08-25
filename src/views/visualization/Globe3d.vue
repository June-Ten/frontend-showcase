<script setup lang="ts">
import type { FeatureCollection } from 'geojson'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import chinaMap from '../../assets/map/100000_full.json'
import { createGlobe3d, type Globe3dController } from './createGlobe3d'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let controller: Globe3dController | null = null
let animationFrame = 0
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  controller = createGlobe3d(canvas, chinaMap as unknown as FeatureCollection)
  const animate = () => {
    animationFrame = window.requestAnimationFrame(animate)
    controller?.render()
  }
  animate()

  resizeObserver = new ResizeObserver(() => controller?.resize())
  if (canvas.parentElement) resizeObserver.observe(canvas.parentElement)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  controller?.dispose()
  controller = null
})
</script>

<template>
  <div class="globe-stage">
    <canvas
      ref="canvasRef"
      class="globe-stage__canvas"
      aria-label="三维地球，中国区域高亮"
    />
  </div>
</template>

<style scoped>
.globe-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: radial-gradient(circle at 50% 48%, #101012 0%, #050505 45%, #000 74%);
}

.globe-stage__canvas {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.globe-stage__canvas:active {
  cursor: grabbing;
}
</style>

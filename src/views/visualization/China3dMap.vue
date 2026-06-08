<script setup lang="ts">
import type { FeatureCollection } from 'geojson'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import chinaMap from '../../assets/map/100000_full.json'
import { createChina3dMap, type China3dMapController } from './createChina3dMap'

const props = withDefaults(
  defineProps<{
    geojson?: FeatureCollection
  }>(),
  {
    geojson: () => chinaMap as unknown as FeatureCollection,
  },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)

let mapController: China3dMapController | null = null
let animationFrame = 0
let resizeObserver: ResizeObserver | null = null

const resize = () => {
  mapController?.resize()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  mapController = createChina3dMap(canvas, props.geojson)

  const animate = () => {
    animationFrame = window.requestAnimationFrame(animate)
    mapController?.render()
  }
  animate()

  resizeObserver = new ResizeObserver(() => resize())
  const container = canvas.parentElement
  if (container) {
    resizeObserver.observe(container)
  }
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  mapController?.dispose()
  mapController = null
})

defineExpose({ resize })
</script>

<template>
  <div class="map-stage">
    <canvas ref="canvasRef" class="map-stage__canvas" aria-label="中国三维地图" />

    <div class="map-stage__grid" aria-hidden="true" />

    <span class="map-stage__corner map-stage__corner--tl" aria-hidden="true" />
    <span class="map-stage__corner map-stage__corner--tr" aria-hidden="true" />
    <span class="map-stage__corner map-stage__corner--bl" aria-hidden="true" />
    <span class="map-stage__corner map-stage__corner--br" aria-hidden="true" />

    <div class="map-stage__hud map-stage__hud--top" aria-hidden="true">
      <span class="dot" />
      <span class="label">GEO·MAPPING ONLINE</span>
    </div>

    <div class="map-stage__hud map-stage__hud--bottom" aria-hidden="true">
      <span class="label">LAT 35.86 · LNG 104.19</span>
      <span class="bar"><i /></span>
      <span class="label">SCAN 100%</span>
    </div>
  </div>
</template>

<style scoped>
.map-stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-stage__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.map-stage__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(42, 167, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(42, 167, 255, 0.06) 1px, transparent 1px);
  background-size: 38px 38px;
  mask-image: radial-gradient(circle at 50% 55%, rgba(0, 0, 0, 0.6) 0%, transparent 72%);
}

.map-stage__corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: rgba(64, 214, 255, 0.85);
  border-style: solid;
  filter: drop-shadow(0 0 6px rgba(42, 167, 255, 0.7));
  pointer-events: none;
}

.map-stage__corner--tl {
  top: 10px;
  left: 10px;
  border-width: 2px 0 0 2px;
}

.map-stage__corner--tr {
  top: 10px;
  right: 10px;
  border-width: 2px 2px 0 0;
}

.map-stage__corner--bl {
  bottom: 10px;
  left: 10px;
  border-width: 0 0 2px 2px;
}

.map-stage__corner--br {
  bottom: 10px;
  right: 10px;
  border-width: 0 2px 2px 0;
}

.map-stage__hud {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(174, 246, 255, 0.78);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-shadow: 0 0 8px rgba(42, 167, 255, 0.6);
  pointer-events: none;
}

.map-stage__hud--top {
  top: 14px;
  left: 44px;
}

.map-stage__hud--bottom {
  bottom: 14px;
  right: 44px;
}

.map-stage__hud .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3df0ff;
  box-shadow: 0 0 10px #3df0ff;
  animation: pulse 1.6s ease-in-out infinite;
}

.map-stage__hud .bar {
  position: relative;
  display: block;
  width: 70px;
  height: 4px;
  border-radius: 2px;
  background: rgba(42, 167, 255, 0.18);
  overflow: hidden;
}

.map-stage__hud .bar i {
  position: absolute;
  inset: 0;
  display: block;
  width: 40%;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, #3df0ff, transparent);
  animation: sweep 2.4s linear infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.7);
  }
}

@keyframes sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}
</style>

<template>
  <div class="mindmap-page">
    <header class="mindmap-toolbar">
      <RouterLink to="/" class="mindmap-toolbar__back">← 返回</RouterLink>
      <h1 class="mindmap-toolbar__title">合规分析思维导图</h1>
      <div class="mindmap-toolbar__actions">
        <button
          type="button"
          class="mindmap-toolbar__action mindmap-toolbar__action--primary"
          :disabled="isPlaying"
          @click="handlePlay"
        >
          {{ isPlaying ? '生成中…' : '播放生成' }}
        </button>
        <button
          type="button"
          class="mindmap-toolbar__action"
          :disabled="isPlaying"
          @click="handleReset"
        >
          重置
        </button>
        <button type="button" class="mindmap-toolbar__action" @click="handleFitView">适应画布</button>
      </div>
    </header>

    <section class="mindmap-body">
      <div ref="chartRef" class="mindmap-chart" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Graph } from '@antv/g6'
import { createComplianceMindmapGraph } from './createComplianceMindmapGraph'
import {
  fitComplianceMindmapView,
  playComplianceGraphGeneration,
  resetComplianceGraphPlayback,
} from './graphPlayback'

const chartRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null

async function initChart() {
  if (!chartRef.value) return
  graph = await createComplianceMindmapGraph(chartRef.value)
}

async function handlePlay() {
  if (!graph || isPlaying.value) return
  isPlaying.value = true
  try {
    await playComplianceGraphGeneration(graph, chartRef.value!)
  } finally {
    isPlaying.value = false
  }
}

async function handleReset() {
  if (!graph || isPlaying.value) return
  await resetComplianceGraphPlayback(graph)
}

function handleFitView() {
  if (!graph) return
  void fitComplianceMindmapView(graph)
}

function handleResize() {
  if (!graph || !chartRef.value) return
  graph.resize(chartRef.value.clientWidth, chartRef.value.clientHeight)
}

onMounted(async () => {
  await nextTick()
  await initChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  graph?.destroy()
  graph = null
})
</script>

<style scoped lang="scss">
.mindmap-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background:
    radial-gradient(ellipse 80% 50% at 15% 0%, rgba(147, 197, 253, 0.35), transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 100%, rgba(186, 230, 253, 0.3), transparent 55%),
    linear-gradient(180deg, #e8f2ff 0%, #f3f8ff 48%, #f8fbff 100%);
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(147, 197, 253, 0.35);
  backdrop-filter: blur(10px);
  flex-shrink: 0;

  &__back {
    font-size: 14px;
    color: #5f7f9d;
    text-decoration: none;

    &:hover {
      color: #3b8cff;
    }
  }

  &__title {
    flex: 1;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1a3b66;
    letter-spacing: 0.02em;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__action {
    padding: 6px 14px;
    font-size: 13px;
    color: #3b8cff;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(147, 197, 253, 0.65);
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover:not(:disabled) {
      background: #f0f7ff;
      border-color: #93c5fd;
      box-shadow: 0 4px 12px rgba(59, 140, 255, 0.12);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    &--primary {
      color: #fff;
      background: linear-gradient(135deg, #3b8cff 0%, #5ba3ff 100%);
      border-color: transparent;
      box-shadow: 0 6px 16px rgba(59, 140, 255, 0.28);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #2f7ef0 0%, #4d98ff 100%);
        box-shadow: 0 8px 20px rgba(59, 140, 255, 0.34);
      }
    }
  }
}

.mindmap-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.mindmap-chart {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background:
    radial-gradient(ellipse 70% 45% at 25% 15%, rgba(198, 225, 255, 0.5), transparent 58%),
    radial-gradient(ellipse 55% 40% at 85% 85%, rgba(186, 218, 255, 0.38), transparent 52%),
    linear-gradient(180deg, #eef5ff 0%, #f8fbff 62%, #ffffff 100%);
  border: 1px solid rgba(168, 206, 245, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 12px 32px rgba(26, 59, 102, 0.08);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: auto -8% -18% -8%;
    height: 42%;
    background: radial-gradient(ellipse at center, rgba(147, 197, 253, 0.22), transparent 68%);
    pointer-events: none;
  }
}
</style>

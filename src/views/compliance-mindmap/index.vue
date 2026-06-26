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
    await playComplianceGraphGeneration(graph)
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
  background: #f1f5f9;
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;

  &__back {
    font-size: 14px;
    color: #64748b;
    text-decoration: none;

    &:hover {
      color: #1677ff;
    }
  }

  &__title {
    flex: 1;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__action {
    padding: 6px 14px;
    font-size: 13px;
    color: #1677ff;
    background: #e6f4ff;
    border: 1px solid #91caff;
    border-radius: 6px;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #bae0ff;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    &--primary {
      color: #fff;
      background: #1677ff;
      border-color: #1677ff;

      &:hover:not(:disabled) {
        background: #4096ff;
      }
    }
  }
}

.mindmap-body {
  flex: 1;
  min-height: 0;
  padding: 12px;
}

.mindmap-chart {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
</style>

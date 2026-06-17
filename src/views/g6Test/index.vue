<template>
  <div class="page">
    <header class="page__bar">
      <RouterLink to="/" class="page__back">← 返回</RouterLink>
        <p class="page__title">G6 · CompactBox</p>
        <p class="page__hint">蓝=投资方（上） · 紫=某科技公司 · 绿=被投资方（下） · 点击 ± 懒加载展开</p>
      <button type="button" class="page__btn" @click="handleFitView">适应画布</button>
    </header>
    <div ref="chartRef" class="page__chart" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Graph } from '@antv/g6'
import { createG6TestGraph } from './createG6TestGraph'

const chartRef = ref<HTMLElement | null>(null)
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null

async function initChart() {
  if (!chartRef.value) return
  graph = await createG6TestGraph(chartRef.value)
}

function handleFitView() {
  graph?.fitView()
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

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f1f3f5;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #212529;
}

.page__bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  padding: 12px 20px;
  background: #212529;
  color: #f8f9fa;
}

.page__back {
  font-size: 14px;
  color: #adb5bd;
  text-decoration: none;
}

.page__back:hover {
  color: #f8f9fa;
}

.page__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.page__hint {
  flex: 1;
  margin: 0;
  font-size: 12px;
  color: #868e96;
}

.page__btn {
  padding: 6px 14px;
  font-size: 13px;
  color: #212529;
  background: #51cf66;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.page__btn:hover {
  background: #40c057;
}

.page__chart {
  flex: 1;
  min-height: 0;
  margin: 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>

<template>
  <div class="penetration-page">
    <header class="penetration-toolbar">
      <div class="penetration-toolbar__left">
        <RouterLink to="/" class="penetration-toolbar__back">← 返回</RouterLink>
        <h1 class="penetration-toolbar__title">股权穿透图</h1>
      </div>
      <div class="penetration-toolbar__search">
        <input
          class="penetration-search"
          type="text"
          placeholder="请输入企业名、人名、产品名等"
          disabled
        />
      </div>
      <div class="penetration-toolbar__actions">
        <button type="button" class="penetration-action" @click="handleFitView">适应画布</button>
      </div>
    </header>

    <section class="penetration-body">
      <div ref="chartRef" class="penetration-chart">
        <div class="penetration-watermark" aria-hidden="true">穿透图</div>
        <div v-if="isLazyLoading" class="penetration-loading" role="status" aria-live="polite">
          <span class="penetration-loading__spinner" />
          <p class="penetration-loading__text">加载中...</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Graph } from '@antv/g6'
import { createG6TestGraph } from './createG6TestGraph'

const chartRef = ref<HTMLElement | null>(null)
const isLazyLoading = ref(false)
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null

async function initChart() {
  if (!chartRef.value) return
  graph = await createG6TestGraph(chartRef.value, undefined, {
    onLazyLoadingChange: (loading) => {
      isLazyLoading.value = loading
    },
  })
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
  isLazyLoading.value = false
  graph?.destroy()
  graph = null
})
</script>

<style scoped>
.penetration-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif;
  color: #333333;
}

.penetration-toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  padding: 16px 24px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.penetration-toolbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.penetration-toolbar__back {
  font-size: 13px;
  color: #999999;
  text-decoration: none;
  white-space: nowrap;
}

.penetration-toolbar__back:hover {
  color: #1890ff;
}

.penetration-toolbar__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  white-space: nowrap;
}

.penetration-toolbar__search {
  flex: 1;
  max-width: 420px;
}

.penetration-search {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  color: #333333;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
}

.penetration-search::placeholder {
  color: #bfbfbf;
}

.penetration-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.penetration-action {
  padding: 0;
  font-size: 13px;
  color: #1890ff;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.penetration-action:hover {
  color: #096dd9;
}

.penetration-body {
  flex: 1;
  min-height: 0;
  padding: 8px 16px 16px;
}

.penetration-chart {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.penetration-watermark {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.penetration-watermark::before {
  content: '穿透图  穿透图  穿透图  穿透图  穿透图  穿透图  穿透图  穿透图';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 140%;
  font-size: 28px;
  font-weight: 600;
  line-height: 72px;
  color: rgba(0, 0, 0, 0.03);
  transform: rotate(-24deg);
  white-space: nowrap;
  user-select: none;
}

.penetration-loading {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.88);
  pointer-events: all;
}

.penetration-loading__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e6f4ff;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: penetration-spin 0.8s linear infinite;
}

.penetration-loading__text {
  margin: 0;
  font-size: 14px;
  color: #666666;
}

@keyframes penetration-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

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

        <ul class="penetration-legend" aria-label="节点类型说明">
          <li class="penetration-legend__item">
            <span class="penetration-legend__dot penetration-legend__dot--target" />
            目标主体
          </li>
          <li class="penetration-legend__item">
            <span class="penetration-legend__dot penetration-legend__dot--company" />
            企业
          </li>
          <li class="penetration-legend__item">
            <span class="penetration-legend__dot penetration-legend__dot--person" />
            自然人
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Graph } from '@antv/g6'
import { createCompactBoxEquityGraph } from './createCompactBoxEquityGraph'

const chartRef = ref<HTMLElement | null>(null)
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null

async function initChart() {
  if (!chartRef.value) return
  graph = await createCompactBoxEquityGraph(chartRef.value)
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
.penetration-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #eef2f8;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif;
  color: #1f2733;
}

.penetration-toolbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  padding: 14px 24px;
  background: #ffffff;
  border-bottom: 1px solid #eaeef4;
  box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
}

.penetration-toolbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.penetration-toolbar__back {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  font-size: 13px;
  color: #5a6577;
  text-decoration: none;
  white-space: nowrap;
  background: #f3f6fb;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}

.penetration-toolbar__back:hover {
  color: #1890ff;
  background: #e6f4ff;
}

.penetration-toolbar__title {
  position: relative;
  margin: 0;
  padding-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2733;
  white-space: nowrap;
}

.penetration-toolbar__title::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #3aa0ff, #1677ff);
  border-radius: 2px;
  transform: translateY(-50%);
}

.penetration-toolbar__search {
  flex: 1;
  max-width: 420px;
}

.penetration-search {
  width: 100%;
  height: 34px;
  padding: 0 14px;
  font-size: 13px;
  color: #1f2733;
  background: #f3f6fb;
  border: 1px solid #e3e9f2;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.penetration-search:not(:disabled):hover {
  border-color: #a3d0ff;
}

.penetration-search:not(:disabled):focus {
  background: #ffffff;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12);
}

.penetration-search::placeholder {
  color: #aab3c2;
}

.penetration-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.penetration-action {
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(180deg, #3aa0ff, #1677ff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(22, 119, 255, 0.28);
  transition: transform 0.15s, box-shadow 0.2s, filter 0.2s;
}

.penetration-action:hover {
  filter: brightness(1.04);
  box-shadow: 0 6px 14px rgba(22, 119, 255, 0.34);
}

.penetration-action:active {
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(22, 119, 255, 0.28);
}

.penetration-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.penetration-chart {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f4f7fc;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(31, 71, 153, 0.08) 1px, transparent 0);
  background-size: 22px 22px;
  border: 1px solid #e3e9f2;
  border-radius: 12px;
  box-shadow: inset 0 1px 3px rgba(31, 45, 61, 0.04);
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
  color: rgba(31, 71, 153, 0.035);
  transform: rotate(-24deg);
  white-space: nowrap;
  user-select: none;
}

.penetration-legend {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 5;
  display: flex;
  gap: 16px;
  margin: 0;
  padding: 10px 16px;
  list-style: none;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e3e9f2;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(31, 45, 61, 0.08);
  backdrop-filter: blur(6px);
  user-select: none;
}

.penetration-legend__item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #5a6577;
}

.penetration-legend__dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.penetration-legend__dot--target {
  background: linear-gradient(180deg, #3aa0ff, #1677ff);
}

.penetration-legend__dot--company {
  background: #ffffff;
  border: 1.5px solid #a3d0ff;
}

.penetration-legend__dot--person {
  background: #fffaf3;
  border: 1.5px solid #ffd591;
}
</style>

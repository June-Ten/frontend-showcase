<template>
  <div class="equity-page">
    <header class="equity-header">
      <RouterLink to="/" class="equity-header__back">
        <AppIcon name="arrow-right-sm" :size="16" class="equity-header__back-icon" />
        返回首页
      </RouterLink>
      <div class="equity-header__title-wrap">
        <h1 class="equity-header__title">股权穿透图</h1>
        <p class="equity-header__subtitle">基于 AntV G6 的企业股权结构穿透可视化</p>
      </div>
    </header>

    <section class="equity-info">
      <div class="equity-info__main">
        <h2 class="equity-info__name">{{ companyInfo.name }}</h2>
        <span class="equity-info__status">{{ companyInfo.status }}</span>
      </div>
      <dl class="equity-info__meta">
        <div v-for="item in metaItems" :key="item.label" class="equity-info__item">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="equity-chart-panel">
      <div class="equity-chart-panel__toolbar">
        <div class="equity-chart-panel__legend">
          <span v-for="item in legendItems" :key="item.label" class="legend-item">
            <i
              class="legend-item__mark"
              :class="{ 'legend-item__mark--line': item.line }"
              :style="{ background: item.color, borderColor: item.border }"
            />
            {{ item.label }}
          </span>
        </div>
        <div class="equity-chart-panel__actions">
          <button type="button" class="action-btn action-btn--primary" @click="handleReset">重置视图</button>
        </div>
      </div>
      <div ref="chartRef" class="equity-chart" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { createEquityGraph, resetEquityGraph } from './createEquityGraph'
import { companyInfo, equityGraphData } from './equityData'
import type { Graph } from '@antv/g6'

const chartRef = ref<HTMLElement | null>(null)
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null

const metaItems = computed(() => [
  { label: '统一社会信用代码', value: companyInfo.creditCode },
  { label: '法定代表人', value: companyInfo.legalPerson },
  { label: '注册资本', value: companyInfo.registeredCapital },
  { label: '成立日期', value: companyInfo.establishDate },
])

const legendItems = [
  { label: '目标企业', color: '#312e81', border: '#6366f1' },
  { label: '股东持股（被投资）', color: '#6366f1', border: '#6366f1', line: true },
  { label: '对外投资', color: '#2dd4bf', border: '#2dd4bf', line: true },
  { label: '企业股东', color: '#1e293b', border: '#475569' },
  { label: '自然人', color: '#134e4a', border: '#2dd4bf' },
]

function initChart() {
  if (!chartRef.value) return
  graph = createEquityGraph(chartRef.value, equityGraphData)
}

async function handleReset() {
  if (!graph) return
  await resetEquityGraph(graph, equityGraphData)
}

function handleResize() {
  if (!graph || !chartRef.value) return
  graph.resize(chartRef.value.clientWidth, chartRef.value.clientHeight)
}

onMounted(async () => {
  await nextTick()
  initChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(chartRef.value)
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', handleResize)
  graph?.destroy()
  graph = null
})
</script>

<style lang="scss" scoped>
$bg: #050505;
$card-bg: #121212;
$text: #ffffff;
$text-muted: #9ca3af;
$accent: #6366f1;
$accent-end: #a855f7;
$gradient: linear-gradient(90deg, $accent 0%, $accent-end 100%);

.equity-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: $bg;
  color: $text;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  padding: 16px 24px 20px;
}

.equity-header {
  flex-shrink: 0;
  margin: 0 0 12px;
}

.equity-header__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  color: $text-muted;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $text;
  }
}

.equity-header__back-icon {
  transform: rotate(180deg);
}

.equity-header__title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: $gradient;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.equity-header__subtitle {
  margin: 0;
  font-size: 15px;
  color: $text-muted;
}

.equity-info {
  flex-shrink: 0;
  margin: 0 0 12px;
  padding: 14px 18px;
  background: $card-bg;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.equity-info__main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.equity-info__name {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.equity-info__status {
  padding: 3px 10px;
  font-size: 12px;
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.25);
  border-radius: 999px;
}

.equity-info__meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
  margin: 0;
}

.equity-info__item {
  dt {
    margin: 0 0 4px;
    font-size: 12px;
    color: $text-muted;
  }

  dd {
    margin: 0;
    font-size: 14px;
    color: $text;
  }
}

.equity-chart-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 14px 16px 16px;
  background: $card-bg;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.equity-chart-panel__toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.equity-chart-panel__legend {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $text-muted;

  &__mark {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid;

    &--line {
      width: 20px;
      height: 0;
      border-radius: 0;
      border-width: 0 0 2px;
      background: transparent !important;
    }
  }
}

.equity-chart-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  padding: 7px 14px;
  font-size: 13px;
  color: $text-muted;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;

  &:hover {
    color: $text;
    border-color: rgba(255, 255, 255, 0.2);
  }

  &--primary {
    color: $text;
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.35);

    &:hover {
      background: rgba(99, 102, 241, 0.25);
    }
  }
}

.equity-chart {
  flex: 1;
  width: 100%;
  min-height: 0;
}

@media (max-width: 960px) {
  .equity-page {
    padding: 12px 16px 16px;
  }

  .equity-info__meta {
    grid-template-columns: repeat(2, 1fr);
  }

  .equity-chart-panel__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .equity-info__meta {
    grid-template-columns: 1fr;
  }
}
</style>

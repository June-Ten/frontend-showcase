<template>
  <div class="equity-page">
    <header class="equity-header">
      <RouterLink to="/" class="equity-header__back">
        <AppIcon name="arrow-right-sm" :size="16" class="equity-header__back-icon" />
        返回首页
      </RouterLink>
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
        <button type="button" class="action-btn" @click="handleReset">重置视图</button>
      </div>
      <div ref="chartRef" class="equity-chart" />
      <footer class="equity-chart-panel__footer">
        <p class="equity-chart-panel__note">
          注：穿透范围：直接或间接持股比例 ≥ 5% 的自然人股东
        </p>
        <div class="equity-chart-panel__legend">
          <span v-for="item in legendItems" :key="item.label" class="legend-item">
            <i
              class="legend-item__mark"
              :class="{ 'legend-item__mark--solid': item.solid }"
              :style="{
                background: item.solid ? item.color : item.bg,
                borderColor: item.border,
              }"
            />
            {{ item.label }}
          </span>
        </div>
      </footer>
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
  { label: '境外主体', color: '#7eb2dd', bg: '#f5f9fd', border: '#7eb2dd', solid: false },
  { label: '境内主体', color: '#1a5fb4', bg: '#1a5fb4', border: '#1a5fb4', solid: true },
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
$bg: #f3f4f6;
$card-bg: #ffffff;
$text: #111827;
$text-muted: #6b7280;
$border: #e5e7eb;
$accent: #1a5fb4;

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
    'PingFang SC',
    'Microsoft YaHei',
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

.equity-info {
  flex-shrink: 0;
  margin: 0 0 12px;
  padding: 14px 18px;
  background: $card-bg;
  border: 1px solid $border;
  border-radius: 8px;
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
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
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
  padding: 16px 20px 14px;
  background: $card-bg;
  border: 1px solid $border;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.equity-chart-panel__toolbar {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.equity-chart {
  flex: 1;
  width: 100%;
  min-height: 0;
  background: #ffffff;
  border-radius: 4px;
}

.equity-chart-panel__footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid $border;
  flex-wrap: wrap;
}

.equity-chart-panel__note {
  margin: 0;
  font-size: 12px;
  color: $text-muted;
}

.equity-chart-panel__legend {
  display: flex;
  align-items: center;
  gap: 20px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $text-muted;

  &__mark {
    width: 28px;
    height: 16px;
    border-radius: 3px;
    border: 1px solid;
    box-sizing: border-box;

    &--solid {
      border-color: transparent;
    }
  }
}

.action-btn {
  padding: 6px 12px;
  font-size: 13px;
  color: $text-muted;
  background: #ffffff;
  border: 1px solid $border;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;

  &:hover {
    color: $text;
    border-color: #d1d5db;
  }
}

@media (max-width: 960px) {
  .equity-page {
    padding: 12px 16px 16px;
  }

  .equity-info__meta {
    grid-template-columns: repeat(2, 1fr);
  }

  .equity-chart-panel__footer {
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

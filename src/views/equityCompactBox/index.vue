<template>
  <div class="equity-compact-page">
    <header class="equity-compact-header">
      <RouterLink to="/" class="equity-compact-header__back">
        <AppIcon name="arrow-right-sm" :size="16" class="equity-compact-header__back-icon" />
        返回首页
      </RouterLink>
    </header>

    <section class="equity-compact-info">
      <div class="equity-compact-info__main">
        <h2 class="equity-compact-info__name">{{ compactCompanyInfo.name }}</h2>
        <span class="equity-compact-info__status">{{ compactCompanyInfo.status }}</span>
      </div>
      <dl class="equity-compact-info__meta">
        <div v-for="item in metaItems" :key="item.label" class="equity-compact-info__item">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="equity-compact-chart-panel">
      <div class="equity-compact-chart-panel__toolbar">
        <button type="button" class="compact-action-btn" @click="handleExpandAll">全部展开</button>
        <button type="button" class="compact-action-btn" @click="handleCollapseAll">全部收起</button>
        <button type="button" class="compact-action-btn" @click="handleReset">重置视图</button>
      </div>
      <div ref="chartRef" class="equity-compact-chart" />
      <footer class="equity-compact-chart-panel__footer">
        <p class="equity-compact-chart-panel__note">
          布局：compactBox（上下方向）；单击有子节点的节点可折叠/展开
        </p>
        <div class="equity-compact-chart-panel__legend">
          <span v-for="item in legendItems" :key="item.label" class="compact-legend-item">
            <i
              class="compact-legend-item__mark"
              :class="{ 'compact-legend-item__mark--solid': item.solid }"
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
import type { Graph } from '@antv/g6'
import AppIcon from '../../components/AppIcon.vue'
import { compactCompanyInfo, compactEquityGraphData } from './compactEquityData'
import {
  collapseAllCompactBoxNodes,
  createCompactBoxEquityGraph,
  expandAllCompactBoxNodes,
  resetCompactBoxEquityGraph,
} from './createCompactBoxEquityGraph'

const chartRef = ref<HTMLElement | null>(null)
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null

const metaItems = computed(() => [
  { label: '统一社会信用代码', value: compactCompanyInfo.creditCode },
  { label: '法定代表人', value: compactCompanyInfo.legalPerson },
  { label: '注册资本', value: compactCompanyInfo.registeredCapital },
  { label: '成立日期', value: compactCompanyInfo.establishDate },
])

const legendItems = [
  { label: '境外主体', color: '#7eb2dd', bg: '#f5f9fd', border: '#7eb2dd', solid: false },
  { label: '境内主体', color: '#1a5fb4', bg: '#1a5fb4', border: '#1a5fb4', solid: true },
]

function initChart() {
  if (!chartRef.value) return
  graph = createCompactBoxEquityGraph(chartRef.value, compactEquityGraphData)
}

async function handleReset() {
  if (!graph) return
  await resetCompactBoxEquityGraph(graph, compactEquityGraphData)
}

async function handleExpandAll() {
  if (!graph) return
  await expandAllCompactBoxNodes(graph)
}

async function handleCollapseAll() {
  if (!graph) return
  await collapseAllCompactBoxNodes(graph)
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

.equity-compact-page {
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

.equity-compact-header {
  flex-shrink: 0;
  margin: 0 0 12px;
}

.equity-compact-header__back {
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

.equity-compact-header__back-icon {
  transform: rotate(180deg);
}

.equity-compact-info {
  flex-shrink: 0;
  margin: 0 0 12px;
  padding: 14px 18px;
  background: $card-bg;
  border: 1px solid $border;
  border-radius: 8px;
}

.equity-compact-info__main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.equity-compact-info__name {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.equity-compact-info__status {
  padding: 3px 10px;
  font-size: 12px;
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 999px;
}

.equity-compact-info__meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
  margin: 0;
}

.equity-compact-info__item {
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

.equity-compact-chart-panel {
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

.equity-compact-chart-panel__toolbar {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.equity-compact-chart {
  flex: 1;
  width: 100%;
  min-height: 0;
  background: #ffffff;
  border-radius: 4px;
}

.equity-compact-chart-panel__footer {
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

.equity-compact-chart-panel__note {
  margin: 0;
  font-size: 12px;
  color: $text-muted;
}

.equity-compact-chart-panel__legend {
  display: flex;
  align-items: center;
  gap: 20px;
}

.compact-legend-item {
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

.compact-action-btn {
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
  .equity-compact-page {
    padding: 12px 16px 16px;
  }

  .equity-compact-info__meta {
    grid-template-columns: repeat(2, 1fr);
  }

  .equity-compact-chart-panel__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .equity-compact-info__meta {
    grid-template-columns: 1fr;
  }
}
</style>

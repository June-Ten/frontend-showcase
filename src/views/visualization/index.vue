<template>
  <main class="viz-screen" :style="{ '--bg-image': `url(${backgroundImg})` }">
    <header class="viz-header">
      <div class="viz-header__title-wrap">
        <span class="viz-header__wing viz-header__wing--left" aria-hidden="true" />
        <h1 class="viz-header__title">全国综合态势感知大屏</h1>
        <span class="viz-header__wing viz-header__wing--right" aria-hidden="true" />
      </div>
    </header>

    <section class="viz-layout">
      <aside class="viz-column viz-column--left">
        <PanelCard title="数据概览" class="panel--overview">
          <ul class="overview">
            <li
              v-for="(item, index) in overviewItems"
              :key="item.label"
              class="overview__item"
            >
              <span class="overview__icon" :class="`overview__icon--${item.icon}`" aria-hidden="true">
                <svg v-if="item.icon === 'db'" viewBox="0 0 32 32" fill="none">
                  <ellipse cx="16" cy="8" rx="10" ry="4" />
                  <path d="M6 8v6c0 2.2 4.5 4 10 4s10-1.8 10-4V8" />
                  <path d="M6 14v6c0 2.2 4.5 4 10 4s10-1.8 10-4v-6" />
                </svg>
                <svg v-else-if="item.icon === 'net'" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="8" r="3" />
                  <circle cx="7" cy="22" r="3" />
                  <circle cx="25" cy="22" r="3" />
                  <path d="M14 10.5 9 19.2M18 10.5l5 8.7M10 22h12" />
                </svg>
                <svg v-else-if="item.icon === 'chart'" viewBox="0 0 32 32" fill="none">
                  <path d="M5 24V8M5 24h22" />
                  <path d="M9 18l5-6 4 3 7-9" />
                  <circle cx="25" cy="6" r="1.6" fill="currentColor" stroke="none" />
                </svg>
                <svg v-else viewBox="0 0 32 32" fill="none">
                  <path d="M8 11a10 10 0 0 1 16.5-1" />
                  <path d="M24.5 6v5h-5" />
                  <path d="M24 21a10 10 0 0 1-16.5 1" />
                  <path d="M7.5 26v-5h5" />
                </svg>
              </span>
              <div class="overview__meta">
                <span class="overview__label">{{ item.label }} ({{ item.unit }})</span>
                <strong class="overview__value">
                  {{ formatKpiValue(overviewDisplayValues[index] ?? 0, item.decimals) }}
                </strong>
              </div>
            </li>
          </ul>
        </PanelCard>

        <PanelCard title="业务分类占比" class="panel--category">
          <div class="split-chart">
            <div ref="categoryChartRef" class="chart chart--donut" />
            <ul class="chart-legend">
              <li
                v-for="item in businessCategories"
                :key="item.name"
                class="chart-legend__item"
              >
                <span class="chart-legend__dot" :style="{ '--dot-color': item.color }" />
                <span class="chart-legend__name">{{ item.name }}</span>
                <span class="chart-legend__value">{{ item.percent }}</span>
              </li>
            </ul>
          </div>
        </PanelCard>

        <PanelCard title="数据趋势分析" class="panel--trend">
          <div ref="trendChartRef" class="chart chart--trend" />
        </PanelCard>
      </aside>

      <section class="viz-center">
        <div class="kpi-strip">
          <div v-for="(item, index) in kpiItems" :key="item.label" class="kpi-card">
            <span class="kpi-card__label">{{ item.label }}</span>
            <span class="kpi-card__value">
              {{ formatKpiValue(kpiDisplayValues[index] ?? 0, item.decimals) }}
              <i class="kpi-card__unit">{{ item.unit }}</i>
            </span>
          </div>
        </div>
        <div class="map-shell">
          <China3dMap />
        </div>
      </section>

      <aside class="viz-column viz-column--right">
        <PanelCard title="实时监测" class="panel--monitor">
          <div class="monitor">
            <div ref="monitorChartRef" class="chart chart--monitor" />
            <ul class="monitor-stats">
              <li
                v-for="item in monitorStats"
                :key="item.label"
                class="monitor-stats__item"
                :class="{ 'monitor-stats__item--alert': item.alert }"
              >
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}<i>{{ item.unit }}</i></strong>
              </li>
            </ul>
          </div>
        </PanelCard>

        <PanelCard title="预警统计" class="panel--alert">
          <div class="split-chart">
            <div ref="alertChartRef" class="chart chart--donut" />
            <ul class="chart-legend">
              <li
                v-for="item in alertLevels"
                :key="item.name"
                class="chart-legend__item"
              >
                <span class="chart-legend__dot" :style="{ '--dot-color': item.color }" />
                <span class="chart-legend__name">{{ item.name }}</span>
                <span class="chart-legend__value">{{ item.value }}</span>
              </li>
            </ul>
          </div>
        </PanelCard>

        <PanelCard title="资源使用情况" class="panel--resource">
          <div ref="resourceChartRef" class="chart chart--resource" />
        </PanelCard>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import backgroundImg from '../../assets/img/bigscreen/bigscreen_bg.webp'
import nanjingMap from '../../assets/map/320100_full.json'
import China3dMap from './China3dMap.vue'

type ChartElement = HTMLElement | null

const PanelCard = defineComponent({
  name: 'PanelCard',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    showMore: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h('section', { class: 'panel-card' }, [
        h('div', { class: 'panel-card__header' }, [
          h('h2', props.title),
          props.showMore
            ? h('button', { type: 'button', class: 'panel-card__more' }, '更多 >')
            : props.subtitle
              ? h('span', props.subtitle)
              : null,
        ]),
        h('div', { class: 'panel-card__body' }, slots.default?.()),
      ])
  },
})

const kpiItems = [
  { label: '国内生产总值', value: 1260582, unit: '亿元', decimals: 0 },
  { label: 'GDP 同比增速', value: 5.2, unit: '%', decimals: 1 },
  { label: '风险点总数', value: 8254, unit: '个', decimals: 0 },
  { label: '监测覆盖率', value: 98.6, unit: '%', decimals: 1 },
] as const

const overviewItems = [
  { label: '数据总量', unit: 'TB', value: 12345.67, decimals: 2, icon: 'db' },
  { label: '数据源', unit: '个', value: 1234, decimals: 0, icon: 'net' },
  { label: '今日新增', unit: 'GB', value: 456.78, decimals: 2, icon: 'chart' },
  { label: '累计调用', unit: '次', value: 9876543, decimals: 0, icon: 'sync' },
] as const

const KPI_COUNT_DURATION = 1400
const kpiDisplayValues = ref<number[]>(kpiItems.map(() => 0))
const overviewDisplayValues = ref<number[]>(overviewItems.map(() => 0))
let kpiAnimationFrame = 0

const formatKpiValue = (value: number, decimals: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

const startKpiCountUp = () => {
  const startTime = performance.now()

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / KPI_COUNT_DURATION, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    kpiDisplayValues.value = kpiItems.map((item) => item.value * eased)
    overviewDisplayValues.value = overviewItems.map((item) => item.value * eased)

    if (progress < 1) {
      kpiAnimationFrame = window.requestAnimationFrame(step)
    }
  }

  kpiAnimationFrame = window.requestAnimationFrame(step)
}

const stopKpiCountUp = () => {
  window.cancelAnimationFrame(kpiAnimationFrame)
}

const businessCategories = [
  { name: '公共服务', value: 4321, percent: '35%', color: '#1b8cff' },
  { name: '城市管理', value: 3086, percent: '25%', color: '#00d4c8' },
  { name: '交通出行', value: 2469, percent: '20%', color: '#3dff8a' },
  { name: '生态环境', value: 1235, percent: '10%', color: '#ffd23d' },
  { name: '产业经济', value: 1234, percent: '10%', color: '#ff5a7a' },
] as const

const categoryTotal = businessCategories.reduce((sum, item) => sum + item.value, 0)

const alertLevels = [
  { name: '一级告警', value: 8, color: '#ff3e6c' },
  { name: '二级告警', value: 18, color: '#ff8a22' },
  { name: '三级告警', value: 20, color: '#ffd23d' },
  { name: '四级告警', value: 10, color: '#4cc9ff' },
] as const

const alertTotal = alertLevels.reduce((sum, item) => sum + item.value, 0)

const monitorStats = [
  { label: '监测点', value: '1,234', unit: '个', alert: false },
  { label: '在线率', value: '98.6', unit: '%', alert: false },
  { label: '告警数', value: '56', unit: '条', alert: true },
] as const

const monitorPoints = [
  { name: '鼓楼', value: [118.760828, 32.082331, 88] },
  { name: '玄武', value: [118.842824, 32.065088, 82] },
  { name: '秦淮', value: [118.816938, 32.01241, 80] },
  { name: '建邺', value: [118.710435, 32.009393, 76] },
  { name: '栖霞', value: [118.958759, 32.159333, 70] },
  { name: '雨花台', value: [118.694503, 31.938238, 68] },
  { name: '江宁', value: [118.830792, 31.85463, 74] },
  { name: '浦口', value: [118.563239, 32.053249, 66] },
]

const monitorLines = [
  ['鼓楼', '玄武'],
  ['玄武', '秦淮'],
  ['秦淮', '建邺'],
  ['建邺', '鼓楼'],
  ['鼓楼', '浦口'],
  ['玄武', '栖霞'],
  ['秦淮', '雨花台'],
  ['雨花台', '江宁'],
  ['建邺', '江宁'],
] as const

const resourceUsage = [
  { name: 'CPU使用率', value: 68, from: '#0a4a9e', to: '#28c5ff' },
  { name: '内存使用率', value: 72, from: '#0a6b52', to: '#3dff8a' },
  { name: '存储使用率', value: 65, from: '#8a5a12', to: '#ffd23d' },
  { name: '网络使用率', value: 48, from: '#6a1b9e', to: '#c77dff' },
]

const trendMonths = ['1月', '2月', '3月', '4月', '5月', '6月']
const trendValues = [480, 720, 560, 980, 1180, 1420]

const categoryChartRef = ref<ChartElement>(null)
const trendChartRef = ref<ChartElement>(null)
const monitorChartRef = ref<ChartElement>(null)
const alertChartRef = ref<ChartElement>(null)
const resourceChartRef = ref<ChartElement>(null)

const chartInstances: echarts.ECharts[] = []

const createChart = (el: ChartElement) => {
  if (!el) return null
  const chart = echarts.init(el)
  chartInstances.push(chart)
  return chart
}

const tooltipTheme = {
  backgroundColor: 'rgba(3, 14, 36, 0.92)',
  borderColor: '#1b8cff',
  borderWidth: 1,
  textStyle: { color: '#d9ecff' },
}

const getDonutOption = (
  data: readonly { name: string; value: number; color: string }[],
  centerTitle: string,
  centerValue: string,
  valueOnTop: boolean,
): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'item',
    ...tooltipTheme,
    formatter: (params) => {
      const item = params as { name: string; value: number; percent?: number }
      return `${item.name}<br/>${item.value.toLocaleString()} (${item.percent?.toFixed(1)}%)`
    },
  },
  series: [
    {
      type: 'pie',
      radius: ['58%', '78%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      padAngle: 2,
      label: {
        show: true,
        position: 'center',
        formatter: () =>
          valueOnTop
            ? `{total|${centerValue}}\n{unit|${centerTitle}}`
            : `{unit|${centerTitle}}\n{total|${centerValue}}`,
        rich: {
          total: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 22,
          },
          unit: {
            color: 'rgba(186, 214, 240, 0.85)',
            fontSize: 10,
            lineHeight: 16,
          },
        },
      },
      labelLine: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 4,
      },
      data: data.map((item) => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: item.color,
        },
      })),
    },
  ],
})

const getTrendOption = (): echarts.EChartsOption => {
  const lineColor = '#00e4ff'
  return {
    grid: { top: 16, right: 52, bottom: 22, left: 52 },
    tooltip: {
      trigger: 'axis',
      ...tooltipTheme,
      borderColor: lineColor,
      formatter: (params: unknown) => {
        const items = params as { axisValue: string; value: number }[]
        const point = items[0]
        if (!point) return ''
        return `${point.axisValue}<br/><span style="color:#fff;font-size:14px;font-weight:700">${point.value.toLocaleString()}</span>`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: trendMonths,
      axisLine: { lineStyle: { color: 'rgba(120, 155, 200, 0.25)' } },
      axisLabel: { color: 'rgba(186, 214, 240, 0.75)', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1500,
      interval: 300,
      axisLine: { show: false },
      axisLabel: { color: 'rgba(186, 214, 240, 0.75)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(80, 130, 190, 0.12)' } },
    },
    series: [
      {
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        data: trendValues,
        lineStyle: {
          color: lineColor,
          width: 2,
          shadowColor: 'rgba(0, 228, 255, 0.85)',
          shadowBlur: 12,
        },
        itemStyle: { color: '#a8f4ff', borderColor: '#ffffff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 228, 255, 0.48)' },
            { offset: 1, color: 'rgba(0, 228, 255, 0)' },
          ]),
        },
      },
    ],
  }
}

const getMonitorOption = (): echarts.EChartsOption => {
  const pointMap = new Map(monitorPoints.map((item) => [item.name, item.value] as const))
  const lineData = monitorLines.flatMap(([from, to]) => {
    const start = pointMap.get(from)
    const end = pointMap.get(to)
    if (!start || !end) return []
    return [{ coords: [[start[0], start[1]], [end[0], end[1]]] }]
  })

  return {
    geo: {
      map: 'nanjing-monitor',
      roam: false,
      zoom: 1.06,
      aspectScale: 0.92,
      layoutCenter: ['50%', '50%'],
      layoutSize: '108%',
      silent: true,
      label: { show: false },
      itemStyle: {
        areaColor: 'rgba(8, 58, 150, 0.62)',
        borderColor: '#20d8ff',
        borderWidth: 1,
        shadowColor: '#0aa6ff',
        shadowBlur: 14,
      },
      emphasis: {
        itemStyle: { areaColor: 'rgba(8, 58, 150, 0.62)' },
      },
    },
    series: [
      {
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 1,
        silent: true,
        polyline: false,
        effect: {
          show: true,
          period: 4,
          trailLength: 0.35,
          symbol: 'arrow',
          symbolSize: 5,
        },
        lineStyle: {
          color: '#7af0ff',
          width: 1.2,
          opacity: 0.72,
          curveness: 0.18,
        },
        data: lineData,
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 2,
        rippleEffect: { brushType: 'stroke', scale: 3.4, period: 3.6 },
        symbolSize: (value: number[]) => Math.max(value[2] / 10, 7),
        itemStyle: {
          color: '#7af0ff',
          shadowColor: '#7af0ff',
          shadowBlur: 12,
        },
        data: monitorPoints,
      },
    ],
  }
}

const getResourceOption = (): echarts.EChartsOption => ({
  grid: { top: 10, right: 46, bottom: 6, left: 78 },
  xAxis: {
    type: 'value',
    min: 0,
    max: 100,
    show: false,
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: resourceUsage.map((item) => item.name),
    axisLabel: { color: '#d5eaff', fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [
    {
      type: 'bar',
      barWidth: 10,
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(12, 50, 110, 0.5)',
        borderRadius: 4,
      },
      data: resourceUsage.map((item) => ({
        value: item.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: item.from },
            { offset: 1, color: item.to },
          ]),
          borderRadius: 4,
        },
      })),
      label: {
        show: true,
        position: 'right',
        color: '#b9d9ff',
        fontSize: 12,
        formatter: '{c}%',
      },
    },
  ],
})

const initCharts = () => {
  echarts.registerMap('nanjing-monitor', nanjingMap as Parameters<typeof echarts.registerMap>[1])
  createChart(categoryChartRef.value)?.setOption(
    getDonutOption(businessCategories, '总数', categoryTotal.toLocaleString('zh-CN'), false),
  )
  createChart(trendChartRef.value)?.setOption(getTrendOption())
  createChart(monitorChartRef.value)?.setOption(getMonitorOption())
  createChart(alertChartRef.value)?.setOption(
    getDonutOption(alertLevels, '总告警', String(alertTotal), true),
  )
  createChart(resourceChartRef.value)?.setOption(getResourceOption())
}

const handleResize = () => {
  chartInstances.forEach((chart) => chart.resize())
}

onMounted(async () => {
  document.documentElement.classList.add('viz-page')

  await nextTick()
  initCharts()
  startKpiCountUp()
  window.addEventListener('resize', handleResize)
  window.requestAnimationFrame(() => handleResize())
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('viz-page')

  window.removeEventListener('resize', handleResize)
  stopKpiCountUp()
  chartInstances.forEach((chart) => chart.dispose())
})
</script>

<style lang="scss" scoped>
$panel-border: rgba(30, 140, 255, 0.36);
$panel-bg: rgba(4, 18, 50, 0.76);
$text-main: #e7f4ff;
$text-muted: #80a8d8;

.viz-screen {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  min-width: 1366px;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  padding: 12px 16px 14px;
  color: $text-main;
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
  background-color: #020817;
  background-image: var(--bg-image);
  background-position: center center;
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.viz-header,
.viz-layout {
  position: relative;
  z-index: 1;
}

.viz-header {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  height: 52px;
  margin-bottom: 8px;
}

.viz-header__title-wrap {
  display: flex;
  align-items: center;
  gap: 20px;
}

.viz-header__title {
  margin: 0;
  color: #eaf6ff;
  font-size: clamp(24px, 2vw, 36px);
  font-weight: 700;
  letter-spacing: 0.12em;
  white-space: nowrap;
  text-shadow:
    0 0 12px rgba(69, 178, 255, 0.8),
    0 0 28px rgba(49, 111, 255, 0.55);
}

.viz-header__wing {
  width: clamp(140px, 16vw, 240px);
  height: 28px;
  border-top: 2px solid rgba(42, 167, 255, 0.65);
  border-bottom: 1px solid rgba(42, 167, 255, 0.24);
  filter: drop-shadow(0 0 10px rgba(30, 151, 255, 0.8));
}

.viz-header__wing--left {
  clip-path: polygon(0 0, 76% 0, 88% 50%, 100% 50%, 88% 100%, 20% 100%);
}

.viz-header__wing--right {
  clip-path: polygon(0 50%, 12% 50%, 24% 0, 100% 0, 80% 100%, 12% 100%);
}

.viz-layout {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(300px, 24vw) 1fr minmax(300px, 24vw);
  gap: 10px;
  min-height: 0;
}

.viz-column {
  display: grid;
  gap: 8px;
  min-height: 0;
}

.viz-column--left {
  grid-template-rows: 1.32fr 1fr 1fr;
}

.viz-column--right {
  grid-template-rows: 1.32fr 1fr 1fr;
}

.viz-center {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}

.kpi-strip {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  height: 64px;
  overflow: hidden;
  padding: 0 16px;
  border: 1px solid rgba(42, 167, 255, 0.22);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(32, 110, 224, 0.18), rgba(6, 25, 66, 0.55));

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(69, 199, 255, 0.85), transparent);
  }

  &::after {
    content: '';
    position: absolute;
    right: -30%;
    bottom: -70%;
    width: 70%;
    height: 140%;
    background: radial-gradient(ellipse at center, rgba(40, 197, 255, 0.14), transparent 70%);
    pointer-events: none;
  }
}

.kpi-card__label {
  color: $text-muted;
  font-size: 12px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.kpi-card__value {
  color: #ffffff;
  font-family: DIN Alternate, Arial, 'Microsoft YaHei', sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 0 14px rgba(69, 178, 255, 0.55);
}

.kpi-card__unit {
  margin-left: 2px;
  color: rgba(186, 214, 240, 0.78);
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
}

:deep(.panel-card) {
  position: relative;
  overflow: hidden;
  min-height: 0;
}

:deep(.panel-card__header) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 14px 0 16px;
  background: linear-gradient(90deg, rgba(32, 110, 224, 0.28), rgba(32, 110, 224, 0.04) 62%, transparent);

  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(69, 198, 255, 0.9),
      rgba(48, 140, 255, 0.35) 38%,
      transparent 92%
    );
  }

  h2 {
    position: relative;
    margin: 0;
    padding-left: 12px;
    color: #f2fbff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.06em;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 4px;
      height: 16px;
      border-radius: 2px;
      background: linear-gradient(180deg, #45d7ff, #1b6dff);
      box-shadow: 0 0 8px rgba(69, 199, 255, 0.7);
      transform: translateY(-50%);
    }
  }
}

:deep(.panel-card__more) {
  border: none;
  background: none;
  color: #6689b5;
  font-size: 11px;
  cursor: pointer;

  &:hover {
    color: #28c5ff;
  }
}

:deep(.panel-card__body) {
  height: calc(100% - 38px);
  min-height: 0;
  padding: 8px 10px;
}

.overview {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 14px;
  height: 100%;
  margin: 0;
  padding: 8px 6px 10px;
  list-style: none;
}

.overview__item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 0;
  padding: 2px 0;
}

.overview__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(69, 199, 255, 0.35);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 40%, rgba(69, 199, 255, 0.28), rgba(8, 32, 82, 0.9));
  box-shadow: 0 0 12px rgba(40, 197, 255, 0.28);
  color: #7ae7ff;

  svg {
    width: 22px;
    height: 22px;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.overview__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.overview__label {
  color: $text-muted;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.overview__value {
  color: #ffffff;
  font-family: DIN Alternate, Arial, 'Microsoft YaHei', sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 12px rgba(69, 178, 255, 0.55);
}

.split-chart,
.monitor {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.chart--donut,
.chart--monitor {
  flex: 0 0 52%;
  min-width: 0;
  height: 100%;
}

.chart-legend,
.monitor-stats {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.chart-legend__item {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 8px;
}

.chart-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot-color);
  box-shadow: 0 0 8px color-mix(in srgb, var(--dot-color) 70%, transparent);
}

.chart-legend__name {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-legend__value {
  color: rgba(186, 214, 240, 0.92);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  white-space: nowrap;
}

.monitor-stats__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 2px;

  span {
    color: $text-muted;
    font-size: 11px;
  }

  strong {
    color: #ffffff;
    font-family: DIN Alternate, Arial, 'Microsoft YaHei', sans-serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    text-shadow: 0 0 10px rgba(69, 178, 255, 0.45);

    i {
      margin-left: 3px;
      color: rgba(186, 214, 240, 0.78);
      font-size: 11px;
      font-style: normal;
      font-weight: 400;
    }
  }
}

.monitor-stats__item--alert {
  strong {
    color: #ffd23d;
    text-shadow: 0 0 10px rgba(255, 210, 61, 0.45);
  }
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.map-shell {
  position: relative;
  height: 100%;
  min-height: 0;
}

@media (max-width: 1180px) {
  .viz-header__wing {
    display: none;
  }

  .viz-header__title {
    font-size: clamp(22px, 2vw, 32px);
  }
}
</style>

<style lang="scss">
html.viz-page {
  overflow-x: auto;
  overflow-y: hidden;
}

html.viz-page body {
  min-width: 1366px;
}

html.viz-page #app {
  width: auto;
  min-width: 1366px;
  max-width: none;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  text-align: initial;
  border-inline: none;
}
</style>

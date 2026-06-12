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
        <PanelCard title="风险点排行榜" class="panel--risk-rank">
          <div class="risk-rank">
            <div
              ref="riskRankViewportRef"
              class="risk-rank__viewport"
              @wheel.prevent="handleRiskRankWheel"
            >
              <div class="risk-rank__list" :style="{ transform: riskRankTransform }">
                <div
                  v-for="(province, index) in provinceRiskRanks"
                  :key="province.name"
                  class="risk-rank__item"
                  :class="{ 'risk-rank__item--top': index < 3 }"
                >
                  <span class="risk-rank__index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="risk-rank__name">{{ province.name }}</span>
                  <strong class="risk-rank__value">{{ province.value }}</strong>
                </div>
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard title="经济运行趋势" class="panel--trend">
          <div class="tab-bar">
            <button
              v-for="tab in trendTabs"
              :key="tab.key"
              type="button"
              class="tab-bar__item"
              :class="{ 'tab-bar__item--active': activeTrendTab === tab.key }"
              @click="switchTrendTab(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>
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
        <PanelCard title="区域发展对比" class="panel--ranking">
          <div class="tab-bar tab-bar--compact">
            <button
              v-for="tab in rankTabs"
              :key="tab.key"
              type="button"
              class="tab-bar__item"
              :class="{ 'tab-bar__item--active': activeRankTab === tab.key }"
              @click="switchRankTab(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>
          <div ref="rankChartRef" class="chart chart--rank" />
        </PanelCard>

        <PanelCard title="产业结构分析" class="panel--industry">
          <div class="industry-chart">
            <div ref="industryChartRef" class="chart chart--industry" />
            <ul class="industry-legend">
              <li
                v-for="item in industryStructure"
                :key="item.name"
                class="industry-legend__item"
              >
                <span
                  class="industry-legend__dot"
                  :style="{ '--dot-color': item.legendColor }"
                />
                <span class="industry-legend__name">{{ item.name }}</span>
                <span class="industry-legend__percent">{{ item.percent }}</span>
                <span class="industry-legend__value">{{ item.value.toLocaleString() }} 亿元</span>
              </li>
            </ul>
          </div>
        </PanelCard>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import backgroundImg from '../../assets/img/bigscreen/bigscreen_bg.png'
import China3dMap from './China3dMap.vue'

type ChartElement = HTMLElement | null
type TrendTabKey = 'gdp' | 'industry' | 'investment' | 'retail'
type RankTabKey = 'gdp' | 'growth'

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

const KPI_COUNT_DURATION = 1400
const kpiDisplayValues = ref<number[]>(kpiItems.map(() => 0))
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

    if (progress < 1) {
      kpiAnimationFrame = window.requestAnimationFrame(step)
    }
  }

  kpiAnimationFrame = window.requestAnimationFrame(step)
}

const stopKpiCountUp = () => {
  window.cancelAnimationFrame(kpiAnimationFrame)
}

const trendChartRef = ref<ChartElement>(null)
const rankChartRef = ref<ChartElement>(null)
const industryChartRef = ref<ChartElement>(null)

const activeTrendTab = ref<TrendTabKey>('gdp')
const activeRankTab = ref<RankTabKey>('gdp')

const chartInstances: echarts.ECharts[] = []

const provinceRiskPointValues = [
  { name: '广东省', value: 482 },
  { name: '江苏省', value: 456 },
  { name: '山东省', value: 431 },
  { name: '浙江省', value: 418 },
  { name: '河南省', value: 396 },
  { name: '四川省', value: 382 },
  { name: '河北省', value: 365 },
  { name: '湖北省', value: 348 },
  { name: '湖南省', value: 333 },
  { name: '安徽省', value: 318 },
  { name: '福建省', value: 304 },
  { name: '辽宁省', value: 286 },
  { name: '江西省', value: 271 },
  { name: '陕西省', value: 256 },
  { name: '云南省', value: 243 },
  { name: '广西壮族自治区', value: 231 },
  { name: '贵州省', value: 219 },
  { name: '山西省', value: 207 },
  { name: '重庆市', value: 196 },
  { name: '黑龙江省', value: 184 },
  { name: '内蒙古自治区', value: 173 },
  { name: '吉林省', value: 161 },
  { name: '新疆维吾尔自治区', value: 152 },
  { name: '甘肃省', value: 141 },
  { name: '海南省', value: 126 },
  { name: '上海市', value: 118 },
  { name: '北京市', value: 109 },
  { name: '天津市', value: 96 },
  { name: '宁夏回族自治区', value: 84 },
  { name: '青海省', value: 72 },
  { name: '西藏自治区', value: 58 },
  { name: '台湾省', value: 44 },
  { name: '香港特别行政区', value: 31 },
  { name: '澳门特别行政区', value: 18 },
]

const RISK_RANK_ITEM_STEP = 36
const RISK_RANK_AUTO_INTERVAL = 2200
const provinceRiskRanks = provinceRiskPointValues
const riskRankListHeight = provinceRiskRanks.length * RISK_RANK_ITEM_STEP - 6
const riskRankViewportRef = ref<HTMLElement | null>(null)
const riskRankOffset = ref(0)

let riskRankTargetOffset = 0
let riskRankAnimationFrame = 0
let riskRankTimer = 0
let riskRankAutoPausedUntil = 0

const getMaxRiskRankOffset = () => {
  const viewportHeight = riskRankViewportRef.value?.clientHeight ?? 0
  return Math.max(riskRankListHeight - viewportHeight, 0)
}

const riskRankTransform = computed(
  () => `translateY(-${Math.round(riskRankOffset.value)}px)`,
)

const nudgeRiskRank = (direction: 1 | -1) => {
  const next = riskRankTargetOffset + direction * RISK_RANK_ITEM_STEP
  riskRankTargetOffset = Math.min(Math.max(next, 0), getMaxRiskRankOffset())
}

const handleRiskRankWheel = (event: WheelEvent) => {
  riskRankAutoPausedUntil = performance.now() + 1200
  nudgeRiskRank(event.deltaY >= 0 ? 1 : -1)
}

const animateRiskRank = () => {
  const distance = riskRankTargetOffset - riskRankOffset.value
  riskRankOffset.value += distance * 0.16

  if (Math.abs(distance) < 0.04) {
    riskRankOffset.value = riskRankTargetOffset
  }

  riskRankAnimationFrame = window.requestAnimationFrame(animateRiskRank)
}

const startRiskRankScroll = () => {
  animateRiskRank()
  riskRankTimer = window.setInterval(() => {
    if (performance.now() < riskRankAutoPausedUntil) return
    if (riskRankTargetOffset >= getMaxRiskRankOffset()) {
      riskRankTargetOffset = 0
      return
    }
    nudgeRiskRank(1)
  }, RISK_RANK_AUTO_INTERVAL)
}

const stopRiskRankScroll = () => {
  window.cancelAnimationFrame(riskRankAnimationFrame)
  window.clearInterval(riskRankTimer)
}

const trendTabs = [
  { key: 'gdp' as const, label: 'GDP' },
  { key: 'industry' as const, label: '工业增加值' },
  { key: 'investment' as const, label: '固定资产投资' },
  { key: 'retail' as const, label: '社会消费品零售总额' },
]

const trendData: Record<TrendTabKey, { months: string[]; values: number[]; unit: string }> = {
  gdp: {
    months: ['2023-05', '2023-07', '2023-09', '2023-11', '2024-01', '2024-03', '2024-05'],
    values: [108420, 112680, 116350, 119870, 121560, 124210, 126058],
    unit: '亿元',
  },
  industry: {
    months: ['2023-05', '2023-07', '2023-09', '2023-11', '2024-01', '2024-03', '2024-05'],
    values: [26840, 27680, 28420, 29150, 29860, 30540, 312890],
    unit: '亿元',
  },
  investment: {
    months: ['2023-05', '2023-07', '2023-09', '2023-11', '2024-01', '2024-03', '2024-05'],
    values: [43820, 45260, 46890, 48120, 49380, 50460, 512305],
    unit: '亿元',
  },
  retail: {
    months: ['2023-05', '2023-07', '2023-09', '2023-11', '2024-01', '2024-03', '2024-05'],
    values: [41280, 42860, 44120, 45680, 46240, 47120, 478306],
    unit: '亿元',
  },
}

const rankTabs = [
  { key: 'gdp' as const, label: 'GDP(亿元)' },
  { key: 'growth' as const, label: '增速(%)' },
]

const regionRankData = [
  { name: '广东省', gdp: 126058, growth: 5.8 },
  { name: '江苏省', gdp: 122875, growth: 5.5 },
  { name: '山东省', gdp: 90210, growth: 5.2 },
  { name: '浙江省', gdp: 82530, growth: 5.0 },
  { name: '河南省', gdp: 59126, growth: 4.8 },
  { name: '四川省', gdp: 56749, growth: 5.1 },
  { name: '湖北省', gdp: 55803, growth: 5.3 },
  { name: '福建省', gdp: 54355, growth: 4.9 },
  { name: '湖南省', gdp: 50048, growth: 4.6 },
  { name: '安徽省', gdp: 47051, growth: 5.4 },
  { name: '上海市', gdp: 47219, growth: 4.7 },
  { name: '河北省', gdp: 43944, growth: 4.4 },
  { name: '北京市', gdp: 43761, growth: 5.0 },
  { name: '陕西省', gdp: 33786, growth: 4.3 },
  { name: '江西省', gdp: 32200, growth: 4.5 },
  { name: '重庆市', gdp: 30146, growth: 5.7 },
  { name: '辽宁省', gdp: 30209, growth: 4.1 },
  { name: '云南省', gdp: 30021, growth: 3.9 },
  { name: '广西壮族自治区', gdp: 27202, growth: 3.8 },
  { name: '山西省', gdp: 25698, growth: 3.4 },
  { name: '内蒙古自治区', gdp: 24627, growth: 6.1 },
  { name: '贵州省', gdp: 20913, growth: 4.2 },
  { name: '新疆维吾尔自治区', gdp: 19126, growth: 6.4 },
  { name: '天津市', gdp: 16737, growth: 4.0 },
  { name: '黑龙江省', gdp: 15884, growth: 3.2 },
  { name: '吉林省', gdp: 13531, growth: 5.9 },
  { name: '甘肃省', gdp: 11864, growth: 6.0 },
  { name: '海南省', gdp: 7551, growth: 6.3 },
  { name: '宁夏回族自治区', gdp: 5315, growth: 5.6 },
  { name: '青海省', gdp: 3799, growth: 4.8 },
  { name: '西藏自治区', gdp: 2393, growth: 8.2 },
]

const RANK_WINDOW_SIZE = 8
const RANK_CAROUSEL_INTERVAL = 2400

let rankCarouselStart = 0
let rankCarouselTimer = 0

const getSortedRankData = (key: RankTabKey) =>
  [...regionRankData].sort((a, b) => (key === 'gdp' ? b.gdp - a.gdp : b.growth - a.growth))

const industryStructure = [
  {
    name: '第一产业',
    value: 89463,
    percent: '7.1%',
    legendColor: '#00f28f',
    gradient: [
      { offset: 0, color: '#00f28f' },
      { offset: 1, color: '#00c9a7' },
    ],
    glow: 'rgba(0, 242, 143, 0.55)',
  },
  {
    name: '第二产业',
    value: 470072,
    percent: '37.3%',
    legendColor: '#6a11cb',
    gradient: [
      { offset: 0, color: '#3a47d5' },
      { offset: 1, color: '#6a11cb' },
    ],
    glow: 'rgba(106, 17, 203, 0.55)',
  },
  {
    name: '第三产业',
    value: 701047,
    percent: '55.6%',
    legendColor: '#6dd5ed',
    gradient: [
      { offset: 0, color: '#2193b0' },
      { offset: 1, color: '#6dd5ed' },
    ],
    glow: 'rgba(33, 147, 176, 0.55)',
  },
] as const

const industryTotal = industryStructure.reduce((sum, item) => sum + item.value, 0)

const createChart = (el: ChartElement) => {
  if (!el) return null
  const chart = echarts.init(el)
  chartInstances.push(chart)
  return chart
}

const getTrendOption = (key: TrendTabKey): echarts.EChartsOption => {
  const data = trendData[key]
  const lineColor = '#1890ff'
  return {
    grid: { top: 12, right: 16, bottom: 24, left: 48 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(3, 14, 36, 0.92)',
      borderColor: lineColor,
      borderWidth: 1,
      textStyle: { color: '#d9ecff' },
      formatter: (params: unknown) => {
        const items = params as { axisValue: string; value: number }[]
        const point = items[0]
        if (!point) return ''
        return `${point.axisValue}<br/><span style="color:#fff;font-size:14px;font-weight:700">${point.value.toLocaleString()}</span>`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.months,
      axisLine: { lineStyle: { color: 'rgba(120, 155, 200, 0.25)' } },
      axisLabel: { color: 'rgba(186, 214, 240, 0.75)', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: 'rgba(186, 214, 240, 0.75)',
        fontSize: 10,
        formatter: (value: number) => (value >= 10000 ? `${Math.round(value / 1000)}k` : String(value)),
      },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.values,
        lineStyle: { color: lineColor, width: 2 },
        itemStyle: { color: '#a0d9ff', borderColor: '#ffffff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.45)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0)' },
          ]),
        },
        emphasis: {
          scale: true,
          itemStyle: {
            color: '#ffffff',
            borderColor: lineColor,
            borderWidth: 2,
            shadowColor: 'rgba(24, 144, 255, 0.85)',
            shadowBlur: 12,
          },
        },
      },
    ],
  }
}

const getRankOption = (key: RankTabKey): echarts.EChartsOption => {
  const isGdp = key === 'gdp'
  const sorted = getSortedRankData(key)
  const values = sorted.map((item) => (isGdp ? item.gdp : item.growth))
  const max = Math.max(...values) * 1.08

  return {
    grid: { top: 4, right: 76, bottom: 8, left: 58 },
    xAxis: {
      type: 'value',
      max,
      show: false,
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: sorted.map((item) => item.name),
      axisLabel: {
        color: '#d5eaff',
        fontSize: 11,
        formatter: (name: string) => (name.length > 5 ? `${name.slice(0, 5)}…` : name),
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    // 轮播窗口：只显示 RANK_WINDOW_SIZE 行，由定时器平移 startValue/endValue
    dataZoom: [
      {
        type: 'inside',
        yAxisIndex: 0,
        startValue: rankCarouselStart,
        endValue: rankCarouselStart + RANK_WINDOW_SIZE - 1,
        zoomLock: true,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: false,
        moveOnMouseMove: false,
      },
    ],
    series: [
      {
        type: 'bar',
        barWidth: 10,
        data: sorted.map((item, index) => ({
          value: isGdp ? item.gdp : item.growth,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#0a4a9e' },
              { offset: 1, color: index < 3 ? '#28c5ff' : '#1a7fd4' },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          color: '#b9d9ff',
          fontSize: 10,
          formatter: (params: echarts.DefaultLabelFormatterCallbackParams) => {
            const dataIndex = params.dataIndex ?? 0
            const value = typeof params.value === 'number' ? params.value : 0
            const item = sorted[dataIndex]
            if (!item) return ''
            return isGdp
              ? `${value.toLocaleString()}  +${item.growth}%`
              : `${value}%  ${item.gdp.toLocaleString()}`
          },
        },
      },
    ],
  }
}

const getIndustryOption = (): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(3, 14, 36, 0.92)',
    borderColor: '#1890ff',
    borderWidth: 1,
    textStyle: { color: '#d9ecff' },
    formatter: (params) => {
      const item = params as { name: string; value: number; percent?: number }
      return `${item.name}<br/>${item.value.toLocaleString()} 亿元 (${item.percent?.toFixed(1)}%)`
    },
  },
  series: [
    {
      type: 'pie',
      radius: ['58%', '78%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      padAngle: 1.5,
      itemStyle: {
        borderColor: '#050c17',
        borderWidth: 2,
        borderRadius: 4,
      },
      label: {
        show: true,
        position: 'center',
        formatter: () => `{total|${industryTotal.toLocaleString()}}\n{unit|GDP (亿元)}`,
        rich: {
          total: {
            color: '#ffffff',
            fontSize: 15,
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
        scaleSize: 6,
        itemStyle: {
          shadowBlur: 18,
        },
      },
      data: industryStructure.map((item) => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [...item.gradient]),
          shadowColor: item.glow,
          shadowBlur: 14,
        },
      })),
    },
  ],
})

const initIndustryChart = () => {
  createChart(industryChartRef.value)?.setOption(getIndustryOption())
}

const initCharts = () => {
  createChart(trendChartRef.value)?.setOption(getTrendOption(activeTrendTab.value))
  createChart(rankChartRef.value)?.setOption(getRankOption(activeRankTab.value))
  initIndustryChart()
}

const switchTrendTab = (key: TrendTabKey) => {
  activeTrendTab.value = key
  const chart = chartInstances.find((instance) => instance.getDom() === trendChartRef.value)
  chart?.setOption(getTrendOption(key), true)
}

const switchRankTab = (key: RankTabKey) => {
  activeRankTab.value = key
  rankCarouselStart = 0
  const chart = chartInstances.find((instance) => instance.getDom() === rankChartRef.value)
  chart?.setOption(getRankOption(key), true)
}

const startRankCarousel = () => {
  rankCarouselTimer = window.setInterval(() => {
    const chart = chartInstances.find((instance) => instance.getDom() === rankChartRef.value)
    if (!chart) return

    rankCarouselStart =
      rankCarouselStart + RANK_WINDOW_SIZE >= regionRankData.length ? 0 : rankCarouselStart + 1

    chart.setOption({
      dataZoom: [
        {
          startValue: rankCarouselStart,
          endValue: rankCarouselStart + RANK_WINDOW_SIZE - 1,
        },
      ],
    })
  }, RANK_CAROUSEL_INTERVAL)
}

const stopRankCarousel = () => {
  window.clearInterval(rankCarouselTimer)
}

const handleResize = () => {
  chartInstances.forEach((chart) => chart.resize())
}

onMounted(async () => {
  document.documentElement.classList.add('viz-page')

  await nextTick()
  initCharts()
  startKpiCountUp()
  startRiskRankScroll()
  startRankCarousel()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('viz-page')

  window.removeEventListener('resize', handleResize)
  stopKpiCountUp()
  stopRiskRankScroll()
  stopRankCarousel()
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
  grid-template-rows: 1.2fr 1fr;
}

.viz-column--right {
  grid-template-rows: 1.2fr 1fr;
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

  // 顶部高亮线
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(69, 199, 255, 0.85), transparent);
  }

  // 左下角斜向流光
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

  // 底部渐隐分隔线：靠左一段更亮，向右淡出
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

    // 左侧发光竖条
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

.panel--trend :deep(.panel-card__body),
.panel--ranking :deep(.panel-card__body) {
  display: grid;
  grid-template-rows: 28px 1fr;
  gap: 4px;
}

.panel--industry :deep(.panel-card__body) {
  min-height: 0;
}

.industry-chart {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.chart--industry {
  flex: 0 0 48%;
  min-width: 0;
  height: 100%;
}

.industry-legend {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.industry-legend__item {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  column-gap: 6px;
  row-gap: 2px;
  align-items: center;
}

.industry-legend__dot {
  grid-row: 1 / span 2;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot-color);
  box-shadow: 0 0 8px color-mix(in srgb, var(--dot-color) 70%, transparent);
}

.industry-legend__name {
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
}

.industry-legend__percent {
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
}

.industry-legend__value {
  grid-column: 2 / span 2;
  color: rgba(186, 214, 240, 0.78);
  font-size: 10px;
  line-height: 1.3;
  white-space: nowrap;
}

.tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tab-bar--compact {
  gap: 4px;
}

.tab-bar__item {
  padding: 3px 10px;
  border: 1px solid rgba(42, 167, 255, 0.2);
  border-radius: 3px;
  background: rgba(6, 25, 66, 0.6);
  color: #779bc8;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;

  &--active {
    border-color: rgba(40, 197, 255, 0.6);
    background: rgba(40, 197, 255, 0.15);
    color: #28c5ff;
    box-shadow: 0 0 10px rgba(40, 197, 255, 0.25);
  }
}

.risk-rank {
  height: 100%;
  min-height: 0;
}

.risk-rank__viewport {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  cursor: ns-resize;
  mask-image: linear-gradient(transparent 0%, #000 8%, #000 92%, transparent 100%);
}

.risk-rank__list {
  display: grid;
  gap: 6px;
}

.risk-rank__item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 56px;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(42, 167, 255, 0.1);
  border-radius: 5px;
  background: rgba(6, 25, 66, 0.46);
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricprecision;
}

.risk-rank__item--top {
  border-color: rgba(255, 156, 74, 0.26);
  background:
    linear-gradient(90deg, rgba(255, 126, 58, 0.16), rgba(6, 25, 66, 0.46) 58%),
    rgba(6, 25, 66, 0.58);
}

.risk-rank__index {
  color: rgba(128, 168, 216, 0.78);
  font-family: DIN Alternate, Impact, sans-serif;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.risk-rank__item--top .risk-rank__index {
  color: #ffcf8a;
  text-shadow: 0 0 4px rgba(255, 156, 74, 0.28);
}

.risk-rank__name {
  min-width: 0;
  overflow: hidden;
  color: rgba(232, 246, 255, 0.92);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-rank__value {
  color: #fff1d7;
  font-family: Arial, 'Microsoft YaHei', sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 15px;
  font-weight: 700;
  text-align: right;
  letter-spacing: 0;
  text-shadow: none;
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

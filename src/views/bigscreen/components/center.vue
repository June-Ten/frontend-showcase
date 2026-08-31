<script setup lang="ts">
import * as echarts from 'echarts'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import borderImg from '../../../assets/img/chinaScreen/border.png'
import dottedLineImg from '../../../assets/img/chinaScreen/dotted_line.png'
import titleBg from '../../../assets/img/chinaScreen/title_bg.png'
import type { AiViolation, ScreenData } from '../type'
import { getFontSize } from '../utils'
import MapPanel from './map.vue'

const props = defineProps<{
  aiViolationListAll: AiViolation[]
  aiViolationList: AiViolation[]
}>()

const titleBgUrl = `url(${titleBg})`
const mapbox = ref<{ initMapData: (data: ScreenData) => void } | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
const barChartRef = ref<HTMLElement | null>(null)

const colorList = [
  { standardId: 100, name: '市场准入和退出标准', color: '#F2B933', colorName: 'orange' },
  { standardId: 101, name: '商品和要素自由流动标准', color: '#A9F5FF', colorName: 'blue' },
  { standardId: 102, name: '影响生产经营成本标准', color: '#67C23A', colorName: 'green' },
  { standardId: 103, name: '影响生产经营行为标准', color: '#F56C6C', colorName: 'red' },
] as const

let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let zoomTimer: number | null = null
const dataZoomMove = { start: 0, end: 2 }
const pieChartData = ref<{ name: string; value: number; standardId?: number }[]>([])
const barChartData = ref<{ name: string; value: number }[]>([])
const pieTitle = ref('总计')
const total = ref(0)

const stopZoom = () => {
  if (zoomTimer == null) return
  window.clearInterval(zoomTimer)
  zoomTimer = null
}

const startZoom = () => {
  stopZoom()
  if (barChartData.value.length <= 3) return
  zoomTimer = window.setInterval(() => {
    dataZoomMove.start += 1
    dataZoomMove.end += 1
    if (dataZoomMove.end > barChartData.value.length - 1) {
      dataZoomMove.start = 0
      dataZoomMove.end = 2
    }
    barChart?.setOption({
      dataZoom: [{ type: 'slider', startValue: dataZoomMove.start, endValue: dataZoomMove.end }],
    })
  }, 3500)
}

const getPieOption = (): echarts.EChartsOption => {
  const colors = colorList.map((item) => item.color)
  const data: echarts.PieSeriesOption['data'] = []
  pieChartData.value.forEach((item) => {
    data.push(
      {
        value: item.value,
        name: item.name,
        itemStyle: {
          borderWidth: 1,
          borderColor: colorList.find((color) => color.standardId === item.standardId)?.color,
        },
      },
      {
        value: 2,
        name: '',
        itemStyle: {
          color: 'rgba(0, 0, 0, 0)',
          borderColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 0,
        },
        label: { show: false },
        labelLine: { show: false },
      },
    )
  })

  return {
    color: [...colors],
    title: {
      text: `{a|${pieTitle.value}}`,
      top: 'center',
      left: 'center',
      textStyle: {
        rich: {
          a: {
            width: getFontSize(0.7),
            padding: [0, getFontSize(0.1), 0, getFontSize(0.1)],
            fontSize: getFontSize(0.12),
            fontWeight: 800,
            color: '#fff',
            align: 'center',
          },
        },
      },
    },
    legend: { show: false },
    graphic: {
      elements: [
        {
          type: 'image',
          z: 3,
          style: {
            image: dottedLineImg,
            width: getFontSize(0.65),
            height: getFontSize(0.65),
          },
          left: 'center',
          top: 'center',
        },
      ],
    },
    series: [
      {
        type: 'pie',
        padAngle: 2,
        avoidLabelOverlap: true,
        clockwise: true,
        radius: ['50%', '55%'],
        label: {
          show: true,
          position: 'outside',
          color: '#ddd',
          fontSize: getFontSize(0.12),
          formatter: (params) => {
            if (!params.name) return ''
            const percent = total.value ? ((Number(params.value) / total.value) * 100).toFixed(1) : '0.0'
            const colorName = colorList.find((color) => color.name === params.name)?.colorName ?? 'blue'
            return `{name${colorName}|${params.name}}\n{value${colorName}|${params.value}}{percent${colorName}|${percent}%}`
          },
          rich: {
            nameorange: { color: '#F2B933', fontSize: getFontSize(0.1), fontWeight: 800, width: getFontSize(1) },
            nameblue: { color: '#A9F5FF', fontSize: getFontSize(0.1), fontWeight: 800, width: getFontSize(1) },
            namegreen: { color: '#67C23A', fontSize: getFontSize(0.1), fontWeight: 800, width: getFontSize(1) },
            namered: { color: '#F56C6C', fontSize: getFontSize(0.1), fontWeight: 800, width: getFontSize(1) },
            valueorange: { color: '#fff', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, 0] },
            valueblue: { color: '#fff', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, 0] },
            valuegreen: { color: '#fff', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, 0] },
            valuered: { color: '#fff', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, 0] },
            percentorange: { color: '#F2B933', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, getFontSize(0.05)] },
            percentblue: { color: '#A9F5FF', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, getFontSize(0.05)] },
            percentgreen: { color: '#67C23A', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, getFontSize(0.05)] },
            percentred: { color: '#F56C6C', fontSize: getFontSize(0.1), padding: [getFontSize(0.05), 0, 0, getFontSize(0.05)] },
          },
        },
        labelLine: {
          length: getFontSize(0.15),
          length2: getFontSize(0.25),
          show: true,
        },
        data,
      },
    ],
  }
}

const wrapLabel = (value: string) => {
  if (value.length < 30) {
    return [
      `{spacedot|●} {a|${''.padEnd(30, '　')}}`,
      `{dot|●} {firstA|${value.slice(0, 30).padEnd(30, '　')}}`,
      `{spacedot|●} {a|${''.padEnd(30, '　')}}`,
    ].join('\n')
  }
  if (value.length < 60) {
    return [
      `{spacedot|●} {a|${''.padEnd(30, '　')}}`,
      `{dot|●} {firstA|${value.slice(0, 30).padEnd(30, '　')}}`,
      `{spacedot|●} {a|${value.slice(30, 60).padEnd(30, '　')}}`,
    ].join('\n')
  }
  return [
    `{spacedot|●} {firstA|${value.slice(0, 30).padEnd(30, '　')}}`,
    `{dot|●} {a|${value.slice(30, 60).padEnd(30, '　')}}`,
    `{spacedot|●} {a|${value.slice(60, 90).padEnd(30, '　')}}`,
  ].join('\n')
}

const getBarOption = (): echarts.EChartsOption => {
  const points = barChartData.value
  const maxValue = Math.max(1, ...points.map((item) => item.value))
  return {
    grid: { left: 0, right: getFontSize(0.1), bottom: 0, top: 0, containLabel: true },
    tooltip: { show: false },
    xAxis: { show: false, type: 'value', max: maxValue },
    yAxis: [
      {
        type: 'category',
        inverse: true,
        axisLabel: {
          show: true,
          fontSize: getFontSize(0.1),
          align: 'right',
          margin: getFontSize(0.1),
          width: getFontSize(3),
          formatter: (value: string) => wrapLabel(value),
          rich: {
            dot: { color: 'rgba(242, 185, 51, 1)', fontSize: getFontSize(0.1) },
            spacedot: { color: 'rgba(242, 185, 51, 0)', fontSize: getFontSize(0.1) },
            firstA: {
              color: '#ffffff',
              padding: [getFontSize(0.01), 0, getFontSize(0.01), -getFontSize(0.05)],
              align: 'left',
              width: getFontSize(3),
              fontWeight: 800,
              fontSize: getFontSize(0.1),
            },
            a: {
              color: '#ffffff',
              padding: [getFontSize(0.01), 0, getFontSize(0.01), 0],
              align: 'left',
              width: getFontSize(3),
              fontWeight: 800,
              fontSize: getFontSize(0.1),
            },
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
        data: points.map((item) => item.name),
      },
      {
        type: 'category',
        inverse: true,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          color: '#ffffff',
          fontSize: getFontSize(0.12),
          fontWeight: 800,
        },
        data: points.map((item) => String(item.value)),
      },
    ],
    series: [
      {
        name: '值',
        type: 'bar',
        zlevel: 1,
        itemStyle: {
          borderRadius: 2,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: 'rgba(255,255,255,0)' },
            { offset: 0.5, color: '#68E2F7' },
            { offset: 1, color: '#01CCEF' },
          ]),
        },
        barMaxWidth: getFontSize(0.08),
        data: points.map((item) => item.value),
        showBackground: true,
        backgroundStyle: { color: 'rgba(15, 0, 90, 1)' },
      },
    ],
    dataZoom: [
      {
        show: false,
        startValue: dataZoomMove.start,
        endValue: dataZoomMove.end,
        yAxisIndex: [0, 1],
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      },
    ],
  }
}

const drawPie = async () => {
  await nextTick()
  if (!pieChartRef.value) return
  if (!pieChart) pieChart = echarts.init(pieChartRef.value, undefined, { renderer: 'svg' })
  pieChart.setOption(getPieOption(), true)
  pieChart.resize()
}

const drawBar = async () => {
  await nextTick()
  if (!barChartRef.value) return
  if (!barChart) {
    barChart = echarts.init(barChartRef.value, undefined, { renderer: 'svg' })
    const dom = barChart.getDom()
    dom.addEventListener('mouseenter', stopZoom)
    dom.addEventListener('mouseleave', startZoom)
  }
  barChart.setOption(getBarOption(), true)
  barChart.resize()
  startZoom()
}

watch(
  () => props.aiViolationListAll,
  (list) => {
    pieChartData.value = [...list]
      .map((item) => ({
        ...item,
        name: item.standardName ?? item.violationName ?? '',
        value: item.violationCount ?? 0,
      }))
      .sort((a, b) => (a.standardId ?? 0) - (b.standardId ?? 0))
    total.value = pieChartData.value.reduce((sum, item) => sum + item.value, 0)
    pieTitle.value = `总计${total.value}`
    void drawPie()
  },
  { deep: true, immediate: true },
)

watch(
  () => props.aiViolationList,
  (list) => {
    barChartData.value = [...list]
      .map((item) => ({
        value: item.violationCount ?? 0,
        name: item.standardName ?? item.violationName ?? '',
      }))
      .sort((a, b) => b.value - a.value)
    void drawBar()
  },
  { deep: true, immediate: true },
)

const handleResize = () => {
  pieChart?.setOption(getPieOption())
  pieChart?.resize()
  barChart?.setOption(getBarOption())
  barChart?.resize()
}

window.addEventListener('resize', handleResize)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopZoom()
  pieChart?.dispose()
  barChart?.dispose()
})

const initMapData = (data: ScreenData) => {
  mapbox.value?.initMapData(data)
}

defineExpose({ initMapData })
</script>

<template>
  <div class="center-box">
    <div class="center-box-item center-top">
      <div class="border-img-box">
        <img class="border-img" :src="borderImg" alt="" />
      </div>
      <MapPanel ref="mapbox" />
    </div>
    <div class="center-box-item center-bottom">
      <div class="border-img-box">
        <img class="border-img" :src="borderImg" alt="" />
      </div>
      <div class="center-bottom-item-title-box">
        <div class="center-bottom-item-title">AI审查提示风险点分类</div>
      </div>
      <div class="container">
        <div class="left-chart-container">
          <div ref="pieChartRef" class="left-chart" />
        </div>
        <div class="right-chart-container">
          <div class="right-chart">
            <div ref="barChartRef" class="right-chart-self" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.center-box {
  width: 56%;
  height: 100%;
}

.center-box-item {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #b8edf6;
}

.border-img-box {
  position: absolute;
  top: -7px;
  left: -1px;
  z-index: 2;
  display: flex;
  width: 153px;
  height: 7px;
}

.border-img {
  width: 100%;
  height: 100%;
}

.center-top {
  width: 100%;
  height: 72%;
}

.center-bottom {
  width: 100%;
  height: calc(28% - 16px);
  margin-top: 16px;
}

.center-bottom-item-title-box {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 400px;
  height: 24px;
  margin: 16px 16px 0;
  font-family: YouSheBiaoTiHei, 'Microsoft YaHei', sans-serif;
  background: v-bind(titleBgUrl);
  background-size: 100% 100%;
}

.center-bottom-item-title {
  position: absolute;
  bottom: 5px;
  left: 37px;
  color: #fff;
  font-size: 16px;
}

.container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: calc(100% - 50px);
}

.left-chart-container {
  width: 47%;
  height: 100%;
  margin-top: 20px;
  padding-bottom: 10px;
  transform: translateY(-10px);
}

.left-chart,
.right-chart,
.right-chart-self {
  width: 100%;
  height: 100%;
}

.right-chart-container {
  width: 53%;
  height: 100%;
  padding-right: 10px;
}
</style>

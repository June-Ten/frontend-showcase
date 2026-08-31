<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import borderImg from '../../../assets/img/chinaScreen/border.png'
import btnActived from '../../../assets/img/chinaScreen/btn_actived.png'
import btnDefault from '../../../assets/img/chinaScreen/btn_default.png'
import titleBg from '../../../assets/img/chinaScreen/title_bg.png'
import type { AiFileCount } from '../type'
import { getFontSize } from '../utils'
import RankScroll from './RankScroll.vue'

const props = defineProps<{
  aiFileCountList: AiFileCount[]
}>()

const filedList = ['jingViolateNum', 'laoViolateNum', 'jingViolateDelNum'] as const
const activeBtnList = ['AI判定数', '用户添加数', '不采纳数']
const activeInx = ref(0)
const refreshKey = ref(0)
const riskPointBarBox = ref<HTMLElement | null>(null)

const titleBgUrl = `url(${titleBg})`
const btnDefaultUrl = `url(${btnDefault})`
const btnActivedUrl = `url(${btnActived})`

const tableData = computed(() =>
  [...props.aiFileCountList]
    .map((item) => ({
      ...item,
      aiReview: item.aiReview ?? 0,
      toLib: item.toLib ?? 0,
    }))
    .sort((a, b) => b.aiReview - a.aiReview),
)

const riskPoints = computed(() =>
  [...props.aiFileCountList]
    .map((item) => ({
      name: item.provinceName,
      value: item[filedList[activeInx.value]] ?? 0,
    }))
    .sort((a, b) => b.value - a.value),
)

let chart: echarts.ECharts | null = null
let zoomTimer: number | null = null
const dataZoomMove = { start: 0, end: 10 }

const stopZoom = () => {
  if (zoomTimer != null) {
    window.clearInterval(zoomTimer)
    zoomTimer = null
  }
}

const startZoom = () => {
  stopZoom()
  if (riskPoints.value.length <= 11) return
  zoomTimer = window.setInterval(() => {
    dataZoomMove.start += 1
    dataZoomMove.end += 1
    if (dataZoomMove.end > riskPoints.value.length - 1) {
      dataZoomMove.start = 0
      dataZoomMove.end = 10
    }
    chart?.setOption({
      dataZoom: [{ type: 'slider', startValue: dataZoomMove.start, endValue: dataZoomMove.end }],
    })
  }, 2000)
}

const getBarOption = (): echarts.EChartsOption => {
  const points = riskPoints.value
  const maxValue = Math.max(1, ...points.map((item) => item.value))
  return {
    grid: { left: '2%', right: '2%', bottom: 0, top: 0, containLabel: true },
    tooltip: { show: false },
    xAxis: { show: false, type: 'value', max: maxValue },
    yAxis: [
      {
        type: 'category',
        inverse: true,
        axisLabel: {
          show: true,
          overflow: 'truncate',
          fontSize: getFontSize(0.12),
          color: '#fff',
          formatter: (value: string) => `{dot|●} {a|${value.padEnd(8, '　')}}`,
          rich: {
            dot: {
              color: 'rgba(242, 185, 51, 1)',
              fontSize: getFontSize(0.1),
            },
            a: {
              color: '#ffffff',
              align: 'left',
              width: getFontSize(1),
              fontWeight: 800,
              fontSize: getFontSize(0.12),
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
          borderRadius: getFontSize(0.02),
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: 'rgba(255,255,255,0)' },
            { offset: 0.5, color: '#68E2F7' },
            { offset: 1, color: '#01CCEF' },
          ]),
        },
        barWidth: getFontSize(0.08),
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

const disposeChart = () => {
  stopZoom()
  chart?.dispose()
  chart = null
  dataZoomMove.start = 0
  dataZoomMove.end = 10
}

const drawChart = async () => {
  await nextTick()
  if (!riskPointBarBox.value) return
  if (!chart) {
    chart = echarts.init(riskPointBarBox.value, undefined, { renderer: 'svg' })
    const dom = chart.getDom()
    dom.addEventListener('mouseenter', stopZoom)
    dom.addEventListener('mouseleave', startZoom)
  }
  chart.setOption(getBarOption(), true)
  chart.resize()
  startZoom()
}

const handleResize = () => {
  chart?.setOption(getBarOption())
  chart?.resize()
}

const changeActiveBtn = (index: number) => {
  activeInx.value = index
  dataZoomMove.start = 0
  dataZoomMove.end = 10
  void drawChart()
}

const refreshTable = () => {
  refreshKey.value += 1
}

watch(
  () => props.aiFileCountList,
  () => {
    void drawChart()
  },
  { deep: true, immediate: true },
)

window.addEventListener('resize', handleResize)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  disposeChart()
})

defineExpose({ refreshTable })
</script>

<template>
  <div class="left-box">
    <div class="left-box-item left-top" :key="refreshKey">
      <div class="border-img-box">
        <img class="border-img" :src="borderImg" alt="" />
      </div>
      <div class="left-item-title-box">
        <div class="left-item-title">AI审查文件总数</div>
      </div>
      <div class="left-top-table-box">
        <div class="data-table">
          <div class="table-header">
            <div class="table-row">
              <div class="table-cell">省份</div>
              <div class="table-cell">上传文件数</div>
              <div class="table-cell">转文件库数</div>
            </div>
          </div>
          <RankScroll v-if="tableData.length > 0" class="table-body">
            <div v-for="(item, index) in tableData" :key="`${item.provinceCode}-${index}`" class="table-row">
              <div class="table-cell">{{ item.provinceName }}</div>
              <div class="table-cell">{{ item.aiReview }}</div>
              <div class="table-cell">{{ item.toLib }}</div>
            </div>
          </RankScroll>
        </div>
      </div>
    </div>

    <div class="left-box-item left-bottom">
      <div class="border-img-box">
        <img class="border-img" :src="borderImg" alt="" />
      </div>
      <div class="left-item-title-box">
        <div class="left-item-title">AI审查提示风险点</div>
      </div>
      <div class="left-item-btn-group">
        <div
          v-for="(item, index) in activeBtnList"
          :key="item"
          class="left-item-btn"
          :class="{ actived: activeInx === index }"
          @click="changeActiveBtn(index)"
        >
          <div class="left-item-btn-text">{{ item }}</div>
        </div>
      </div>
      <div class="bar-chart-box">
        <div class="bar-box">
          <div ref="riskPointBarBox" class="bar-self" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.left-box {
  display: flex;
  flex-direction: column;
  width: 22%;
  height: 100%;
}

.left-box-item {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  height: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #b8edf6;
}

.border-img-box {
  position: absolute;
  top: -7px;
  left: -2px;
  display: flex;
  width: 153px;
  height: 7px;
}

.border-img {
  width: 100%;
  height: 100%;
}

.left-item-title-box {
  position: relative;
  display: flex;
  align-items: center;
  width: calc(100% - 32px);
  height: 24px;
  margin: 25px 16px 0;
  font-family: YouSheBiaoTiHei, 'Microsoft YaHei', sans-serif;
  background: v-bind(titleBgUrl);
  background-size: 100% 100%;
}

.left-item-title {
  position: absolute;
  bottom: 5px;
  left: 32px;
  color: #fff;
  font-size: 16px;
}

.left-top-table-box {
  height: calc(100% - 80px);
  margin: 20px 16px 16px;
}

.data-table {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.table-header .table-row,
.table-body .table-row {
  display: flex;
  align-items: center;
  height: 40px;
  background: linear-gradient(90deg, rgba(3, 34, 144, 0) 0%, #032290 10%, #1a4ea8 100%);
}

.table-body .table-row {
  height: 38px;
  margin-top: 6px;
  box-sizing: border-box;

  &:hover {
    background: linear-gradient(90deg, rgba(1, 12, 104, 0) 0%, #009dff 50%, rgba(1, 12, 104, 0) 100%);
  }
}

.table-cell {
  flex: 1;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

.table-body {
  width: 100%;
  height: calc(100% - 44px);

  .table-cell {
    font-size: 14px;
  }
}

.left-bottom {
  display: flex;
  flex-direction: column;
  height: calc(50% - 16px);
  margin-top: 16px;
}

.left-item-btn-group {
  display: flex;
  justify-content: space-between;
  margin: 16px;
}

.left-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 26px;
  cursor: pointer;
  background-image: v-bind(btnDefaultUrl);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;

  &.actived {
    background-image: v-bind(btnActivedUrl);
  }
}

.left-item-btn-text {
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.bar-chart-box {
  width: 100%;
  height: calc(100% - 120px);
  overflow: hidden;
}

.bar-box,
.bar-self {
  width: 100%;
  height: 100%;
}

.bar-box {
  padding: 0 10px;
}
</style>

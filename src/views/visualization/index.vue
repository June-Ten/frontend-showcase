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
        <PanelCard title="核心指标概览" class="panel--metrics">
          <div class="metric-grid">
            <div v-for="metric in coreMetrics" :key="metric.label" class="metric-card">
              <span class="metric-card__icon" :style="{ color: metric.color }">
                <AppIcon :name="metric.icon" :size="28" />
              </span>
              <p class="metric-card__label">{{ metric.label }}</p>
              <strong class="metric-card__value">{{ metric.value }}</strong>
              <span class="metric-card__delta">同比 <em>+{{ metric.yoy }}</em></span>
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

        <PanelCard title="产业结构分析" class="panel--industry">
          <div ref="industryChartRef" class="chart chart--industry" />
        </PanelCard>
      </aside>

      <section class="viz-center">
        <div class="center-stats">
          <div v-for="item in adminStats" :key="item.label" class="center-stat">
            <span class="center-stat__icon">{{ item.icon }}</span>
            <div>
              <strong>{{ item.value }}<small>{{ item.unit }}</small></strong>
              <p>{{ item.label }}</p>
            </div>
          </div>
        </div>

        <div class="map-shell">
          <div class="map-shell__title">中国地图三维态势</div>
          <canvas ref="threeMapCanvasRef" class="three-map" aria-label="中国地图三维态势" />
          <div class="map-shell__halo" aria-hidden="true" />
          <div class="map-inset">
            <div class="map-inset__dots" aria-hidden="true">
              <i
                v-for="dot in insetDots"
                :key="`${dot.left}-${dot.top}`"
                :style="{ left: dot.left, top: dot.top }"
              />
            </div>
            <span>南海诸岛</span>
          </div>
        </div>

        <div class="category-nav">
          <button
            v-for="cat in mapCategories"
            :key="cat.key"
            type="button"
            class="category-nav__item"
            :class="{ 'category-nav__item--active': activeMapCategory === cat.key }"
            @click="activeMapCategory = cat.key"
          >
            <span class="category-nav__icon">{{ cat.icon }}</span>
            <span>{{ cat.label }}</span>
          </button>
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

        <PanelCard title="民生保障" class="panel--livelihood">
          <div class="livelihood-grid">
            <div v-for="item in livelihoodMetrics" :key="item.label" class="livelihood-card">
              <div class="livelihood-card__ring" :style="{ '--progress': item.progress }">
                <span class="livelihood-card__icon">{{ item.icon }}</span>
              </div>
              <p class="livelihood-card__label">{{ item.label }}</p>
              <strong>{{ item.value }}</strong>
              <span class="livelihood-card__delta">同比 ↑ {{ item.yoy }}</span>
            </div>
          </div>
        </PanelCard>

        <PanelCard title="预警提示" show-more class="panel--alerts">
          <div class="alert-list">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="alert-item"
              :class="`alert-item--${alert.level}`"
            >
              <span class="alert-item__icon">▲</span>
              <div class="alert-item__body">
                <strong>{{ alert.title }}</strong>
                <span>{{ alert.region }}</span>
              </div>
              <time>{{ alert.time }}</time>
            </div>
          </div>
        </PanelCard>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import * as THREE from 'three'
import chinaMap from '../../assets/map/100000_full.json'
import backgroundImg from '../../assets/img/bigscreen/background.png'
import AppIcon from '../../components/AppIcon.vue'
import { mapData } from './echartsChinaMap'

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

type Coordinate = [number, number]
type PolygonCoordinates = Coordinate[][]
type MultiPolygonCoordinates = PolygonCoordinates[]
type ChinaFeature = {
  properties?: {
    name?: string
    center?: Coordinate
    centroid?: Coordinate
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: PolygonCoordinates | MultiPolygonCoordinates
  }
}
type ChinaGeoJson = { features: ChinaFeature[] }

const threeMapCanvasRef = ref<HTMLCanvasElement | null>(null)
const trendChartRef = ref<ChartElement>(null)
const rankChartRef = ref<ChartElement>(null)
const industryChartRef = ref<ChartElement>(null)

const activeTrendTab = ref<TrendTabKey>('gdp')
const activeRankTab = ref<RankTabKey>('gdp')
const activeMapCategory = ref('population')

let mapRenderer: THREE.WebGLRenderer | null = null
let mapScene: THREE.Scene | null = null
let mapCamera: THREE.PerspectiveCamera | null = null
let chinaMapGroup: THREE.Group | null = null
const barMeshes: THREE.Mesh[] = []
let animationFrame = 0
const chartInstances: echarts.ECharts[] = []
const chinaGeoJson = chinaMap as unknown as ChinaGeoJson
const mapDataByName = new Map(mapData.map((item) => [item.name, item.value]))
const mapCenter: Coordinate = [104.2, 36.2]
const mapScale = 8.2

const coreMetrics = [
  { label: '常住人口(万人)', value: '140,967', yoy: '0.8%', icon: 'multiple-user', color: '#28c5ff' },
  { label: 'GDP(亿元)', value: '1,260,582', yoy: '5.2%', icon: 'money', color: '#36e68f' },
  { label: '工业增加值(亿元)', value: '312,890', yoy: '4.6%', icon: 'company', color: '#a978ff' },
  { label: '社会消费品零售总额(亿元)', value: '478,306', yoy: '8.1%', icon: 'car', color: '#ff9d26' },
  { label: '固定资产投资(亿元)', value: '512,305', yoy: '3.4%', icon: 'funds', color: '#ffd33c' },
  { label: '一般公共预算收入(亿元)', value: '116,254', yoy: '6.8%', icon: 'money-ball', color: '#5b8cff' },
]

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

const adminStats = [
  { label: '省级行政区', value: '34', unit: '个', icon: '♟' },
  { label: '地级行政区', value: '333', unit: '个', icon: '▣' },
  { label: '区县行政区', value: '2,852', unit: '个', icon: '▲' },
  { label: '乡镇街道', value: '41,293', unit: '个', icon: '◆' },
]

const mapCategories = [
  { key: 'population', label: '人口分布', icon: '👥' },
  { key: 'economy', label: '经济总量', icon: '◈' },
  { key: 'industry', label: '产业分布', icon: '⚙' },
  { key: 'transport', label: '交通网络', icon: '🚄' },
  { key: 'environment', label: '生态环境', icon: '🌿' },
  { key: 'education', label: '科教资源', icon: '📚' },
]

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
]

const livelihoodMetrics = [
  { label: '城镇就业(万人)', value: '7,512', yoy: '2.1%', icon: '💼', progress: 0.72 },
  { label: '居民收入(元)', value: '31,890', yoy: '5.8%', icon: '💵', progress: 0.68 },
  { label: '养老保险(万人)', value: '109,873', yoy: '3.2%', icon: '🏥', progress: 0.85 },
  { label: '医疗保险(万人)', value: '135,892', yoy: '2.8%', icon: '❤', progress: 0.91 },
]

const alerts = [
  { id: 1, level: 'red', title: '森林火险预警', region: '内蒙古', time: '2分钟前' },
  { id: 2, level: 'orange', title: '暴雨预警', region: '广东', time: '15分钟前' },
  { id: 3, level: 'yellow', title: '高温预警', region: '四川', time: '32分钟前' },
  { id: 4, level: 'blue', title: '大风预警', region: '渤海', time: '1小时前' },
]

const insetDots = [
  { left: '26%', top: '18%' },
  { left: '42%', top: '14%' },
  { left: '58%', top: '22%' },
  { left: '72%', top: '31%' },
  { left: '34%', top: '38%' },
  { left: '50%', top: '46%' },
  { left: '66%', top: '52%' },
  { left: '24%', top: '62%' },
  { left: '43%', top: '70%' },
  { left: '60%', top: '76%' },
  { left: '78%', top: '68%' },
]

const createChart = (el: ChartElement) => {
  if (!el) return null
  const chart = echarts.init(el)
  chartInstances.push(chart)
  return chart
}

const getTrendOption = (key: TrendTabKey): echarts.EChartsOption => {
  const data = trendData[key]
  return {
    grid: { top: 12, right: 16, bottom: 24, left: 48 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(3, 14, 36, 0.92)',
      borderColor: '#1b6dff',
      textStyle: { color: '#d9ecff' },
      formatter: (params: unknown) => {
        const items = params as { axisValue: string; value: number }[]
        const point = items[0]
        if (!point) return ''
        return `${point.axisValue}<br/>${point.value.toLocaleString()} ${data.unit}`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.months,
      axisLine: { lineStyle: { color: '#1c4a7a' } },
      axisLabel: { color: '#779bc8', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#779bc8',
        fontSize: 10,
        formatter: (value: number) => (value >= 10000 ? `${Math.round(value / 1000)}k` : String(value)),
      },
      splitLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.12)' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.values,
        lineStyle: { color: '#28c5ff', width: 2, shadowColor: '#28c5ff', shadowBlur: 8 },
        itemStyle: { color: '#28c5ff', borderColor: '#fff', borderWidth: 1 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(40, 197, 255, 0.45)' },
            { offset: 1, color: 'rgba(40, 197, 255, 0.02)' },
          ]),
        },
      },
    ],
  }
}

const getRankOption = (key: RankTabKey): echarts.EChartsOption => {
  const isGdp = key === 'gdp'
  const values = regionRankData.map((item) => (isGdp ? item.gdp : item.growth))
  const max = Math.max(...values) * 1.08

  return {
    grid: { top: 4, right: 72, bottom: 8, left: 58 },
    xAxis: {
      type: 'value',
      max,
      show: false,
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: regionRankData.map((item) => item.name),
      axisLabel: { color: '#d5eaff', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 10,
        data: regionRankData.map((item, index) => ({
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
            const item = regionRankData[dataIndex]
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

const initIndustryChart = () => {
  createChart(industryChartRef.value)?.setOption({
    color: ['#28c5ff', '#1a7fd4', '#0a4a9e'],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(3, 14, 36, 0.92)',
      borderColor: '#1b6dff',
      textStyle: { color: '#d9ecff' },
      formatter: '{b}<br/>{c} 亿元 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#a9c7f5', fontSize: 11 },
      formatter: (name: string) => {
        const map: Record<string, string> = {
          第一产业: '第一产业  7.1%  89,463 亿元',
          第二产业: '第二产业  37.3%  470,072 亿元',
          第三产业: '第三产业  55.6%  701,047 亿元',
        }
        return map[name] ?? name
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['36%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { name: '第一产业', value: 89463 },
          { name: '第二产业', value: 470072 },
          { name: '第三产业', value: 701047 },
        ],
      },
    ],
    graphic: [
      {
        type: 'text',
        left: '28%',
        top: '42%',
        style: {
          text: '1,260,582',
          fill: '#f2fbff',
          fontSize: 18,
          fontWeight: 700,
          textAlign: 'center',
        },
      },
      {
        type: 'text',
        left: '30%',
        top: '54%',
        style: {
          text: '亿元',
          fill: '#80a8d8',
          fontSize: 11,
          textAlign: 'center',
        },
      },
    ],
  })
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
  const chart = chartInstances.find((instance) => instance.getDom() === rankChartRef.value)
  chart?.setOption(getRankOption(key), true)
}

const projectLngLat = ([lng, lat]: Coordinate, z = 0) =>
  new THREE.Vector3((lng - mapCenter[0]) * mapScale, (lat - mapCenter[1]) * mapScale, z)

const getFeaturePolygons = (feature: ChinaFeature): PolygonCoordinates[] => {
  if (feature.geometry.type === 'Polygon') {
    return [feature.geometry.coordinates as PolygonCoordinates]
  }
  return feature.geometry.coordinates as MultiPolygonCoordinates
}

const createShapeFromPolygon = (polygon: PolygonCoordinates) => {
  const [outerRing, ...holes] = polygon
  if (!outerRing || outerRing.length < 3) return null

  const shape = new THREE.Shape()
  outerRing.forEach((coordinate, index) => {
    const point = projectLngLat(coordinate)
    if (index === 0) shape.moveTo(point.x, point.y)
    else shape.lineTo(point.x, point.y)
  })

  holes.forEach((holeRing) => {
    if (holeRing.length < 3) return
    const path = new THREE.Path()
    holeRing.forEach((coordinate, index) => {
      const point = projectLngLat(coordinate)
      if (index === 0) path.moveTo(point.x, point.y)
      else path.lineTo(point.x, point.y)
    })
    shape.holes.push(path)
  })

  return shape
}

const addBorderLine = (ring: Coordinate[], target: THREE.Group) => {
  const points = ring.map((coordinate) => projectLngLat(coordinate, 7))
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: '#25d9ff',
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
  })
  target.add(new THREE.Line(geometry, material))
}

const getFeatureCenter = (feature: ChinaFeature): Coordinate | null => {
  if (feature.properties?.centroid) return feature.properties.centroid
  if (feature.properties?.center) return feature.properties.center

  const firstPolygon = getFeaturePolygons(feature)[0]
  const outerRing = firstPolygon?.[0]
  if (!outerRing?.length) return null

  const sum = outerRing.reduce(
    (total, coordinate) => [total[0] + coordinate[0], total[1] + coordinate[1]] as Coordinate,
    [0, 0],
  )
  return [sum[0] / outerRing.length, sum[1] / outerRing.length]
}

const createTextSprite = (text: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 160
  canvas.height = 52
  const context = canvas.getContext('2d')

  if (context) {
    context.font = '22px Microsoft YaHei, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.shadowColor = '#18cfff'
    context.shadowBlur = 10
    context.fillStyle = '#d9f2ff'
    context.fillText(text.replace(/省|市|自治区|壮族|回族|维吾尔/g, ''), 80, 26)
  }

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(36, 11, 1)
  return sprite
}

const buildThreeProvince = (feature: ChinaFeature) => {
  if (!chinaMapGroup) return

  const name = feature.properties?.name ?? ''
  const material = new THREE.MeshPhongMaterial({
    color: '#0a3d7a',
    emissive: '#0a5a9e',
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.92,
    shininess: 80,
  })

  getFeaturePolygons(feature).forEach((polygon) => {
    const shape = createShapeFromPolygon(polygon)
    if (!shape) return

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false })
    geometry.computeVertexNormals()

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = -2
    chinaMapGroup!.add(mesh)
    polygon.forEach((ring) => addBorderLine(ring, chinaMapGroup!))
  })

  const center = getFeatureCenter(feature)
  const value = mapDataByName.get(name) ?? 0
  if (center && name && value > 0) {
    const label = createTextSprite(name)
    label.position.copy(projectLngLat(center, 16))
    chinaMapGroup!.add(label)

    const barHeight = Math.max(8, Math.log10(value + 1) * 14)
    const barGeometry = new THREE.BoxGeometry(3.2, 3.2, barHeight)
    const barMaterial = new THREE.MeshPhongMaterial({
      color: '#28c5ff',
      emissive: '#28c5ff',
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.88,
    })
    const bar = new THREE.Mesh(barGeometry, barMaterial)
    bar.position.copy(projectLngLat(center, barHeight / 2 + 6))
    chinaMapGroup!.add(bar)
    barMeshes.push(bar)

    const glowGeometry = new THREE.BoxGeometry(4, 4, 1.2)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: '#28c5ff',
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.copy(projectLngLat(center, 6))
    chinaMapGroup!.add(glow)
  }
}

const initThreeChinaMap = () => {
  const canvas = threeMapCanvasRef.value
  if (!canvas) return

  mapRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  mapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  mapScene = new THREE.Scene()
  mapCamera = new THREE.PerspectiveCamera(36, 1, 1, 1400)
  mapCamera.position.set(0, -42, 560)
  mapCamera.lookAt(0, 0, 0)

  mapScene.add(new THREE.AmbientLight('#6fdcff', 1.85))
  const pointLight = new THREE.PointLight('#2aa7ff', 2.4, 900)
  pointLight.position.set(-120, -160, 240)
  mapScene.add(pointLight)

  chinaMapGroup = new THREE.Group()
  chinaMapGroup.rotation.x = -0.12
  mapScene.add(chinaMapGroup)

  chinaGeoJson.features.forEach(buildThreeProvince)
  resizeThreeChinaMap()
}

const resizeThreeChinaMap = () => {
  const canvas = threeMapCanvasRef.value
  if (!canvas || !mapRenderer || !mapCamera) return

  const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect()
  const width = Math.max(rect.width, 1)
  const height = Math.max(rect.height, 1)
  mapRenderer.setSize(width, height, false)
  mapCamera.aspect = width / height
  mapCamera.position.z = width < height ? 670 : 560
  mapCamera.updateProjectionMatrix()
}

const updateThreeChinaMap = () => {
  if (!mapRenderer || !mapScene || !mapCamera) return

  const elapsed = performance.now() / 1000
  if (chinaMapGroup) {
    chinaMapGroup.rotation.z = Math.sin(elapsed * 0.42) * 0.008
  }

  barMeshes.forEach((bar, index) => {
    const pulse = 1 + Math.sin(elapsed * 1.6 + index * 0.4) * 0.04
    bar.scale.set(1, 1, pulse)
  })

  mapRenderer.render(mapScene, mapCamera)
}

const startMapAnimation = () => {
  const animate = () => {
    animationFrame = window.requestAnimationFrame(animate)
    updateThreeChinaMap()
  }
  animate()
}

const handleResize = () => {
  resizeThreeChinaMap()
  chartInstances.forEach((chart) => chart.resize())
}

onMounted(async () => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  const app = document.getElementById('app')
  if (app) app.style.overflow = 'hidden'

  await nextTick()
  initThreeChinaMap()
  startMapAnimation()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  const app = document.getElementById('app')
  if (app) app.style.overflow = ''

  window.removeEventListener('resize', handleResize)
  window.cancelAnimationFrame(animationFrame)
  chartInstances.forEach((chart) => chart.dispose())
  mapRenderer?.dispose()
  mapScene?.clear()
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
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  padding: 12px 16px 14px;
  color: $text-main;
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
  background-color: #020817;
  background-image: var(--bg-image);
  background-position: center center;
  background-size: cover;
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
  grid-template-columns: minmax(240px, 24vw) 1fr minmax(240px, 24vw);
  gap: 10px;
  min-height: 0;
}

.viz-column {
  display: grid;
  gap: 8px;
  min-height: 0;
}

.viz-column--left {
  grid-template-rows: 1.15fr 0.95fr 1fr;
}

.viz-column--right {
  grid-template-rows: 1fr 0.95fr 0.85fr;
}

.viz-center {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 0;
  gap: 6px;
}

:deep(.panel-card) {
  position: relative;
  overflow: hidden;
  min-height: 0;
  border: 1px solid $panel-border;
  border-radius: 6px;
  background:
    linear-gradient(135deg, rgba(35, 123, 255, 0.14), transparent 42%),
    $panel-bg;
  box-shadow:
    inset 0 0 22px rgba(12, 114, 255, 0.1),
    0 0 18px rgba(4, 37, 95, 0.34);
  backdrop-filter: blur(8px);

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: #2cc8ff;
    border-style: solid;
    pointer-events: none;
  }

  &::before {
    top: -1px;
    left: -1px;
    border-width: 2px 0 0 2px;
  }

  &::after {
    right: -1px;
    bottom: -1px;
    border-width: 0 2px 2px 0;
  }
}

:deep(.panel-card__header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(42, 167, 255, 0.16);
  background: linear-gradient(90deg, rgba(20, 80, 180, 0.22), transparent);

  h2 {
    position: relative;
    margin: 0;
    padding-left: 14px;
    color: #e5f4ff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;

    &::before {
      content: '◆';
      position: absolute;
      left: 0;
      color: #28c5ff;
      font-size: 10px;
      text-shadow: 0 0 8px #28c5ff;
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
  height: calc(100% - 34px);
  min-height: 0;
  padding: 8px 10px;
}

.panel--trend :deep(.panel-card__body),
.panel--ranking :deep(.panel-card__body) {
  display: grid;
  grid-template-rows: 28px 1fr;
  gap: 4px;
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;
  height: 100%;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 10px 6px;
  border: 1px solid rgba(42, 167, 255, 0.22);
  border-radius: 4px;
  background: rgba(6, 25, 66, 0.72);
  text-align: center;
}

.metric-card__icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  filter: drop-shadow(0 0 12px currentColor);

  :deep(path) {
    fill: currentColor;
  }
}

.metric-card__label {
  margin: 0;
  color: rgba(186, 214, 240, 0.88);
  font-size: 11px;
  line-height: 1.35;
}

.metric-card__value {
  margin: 2px 0;
  color: #ffffff;
  font-size: clamp(17px, 1.35vw, 22px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.02em;
}

.metric-card__delta {
  color: rgba(186, 214, 240, 0.75);
  font-size: 11px;
  line-height: 1.2;

  em {
    color: #66dfb1;
    font-style: normal;
    font-weight: 500;
  }
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.center-stats {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 0 6px;
}

.center-stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid rgba(42, 167, 255, 0.18);
  border-radius: 6px;
  background: rgba(4, 18, 50, 0.55);
}

.center-stat__icon {
  color: #28c5ff;
  font-size: 22px;
  text-shadow: 0 0 14px #28c5ff;
}

.center-stat strong {
  color: #f1fbff;
  font-size: clamp(20px, 1.8vw, 28px);
  line-height: 1.1;

  small {
    margin-left: 2px;
    color: $text-muted;
    font-size: 12px;
    font-weight: 400;
  }
}

.center-stat p {
  margin: 2px 0 0;
  color: $text-muted;
  font-size: 11px;
}

.map-shell {
  position: relative;
  min-height: 0;
  border: 1px solid rgba(42, 167, 255, 0.22);
  border-radius: 6px;
  background: rgba(2, 12, 36, 0.45);
}

.map-shell__title {
  position: absolute;
  top: 10px;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  color: #c5dcff;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(40, 197, 255, 0.5);
}

.three-map {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
}

.map-shell__halo {
  position: absolute;
  inset: 10% 10% 8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 138, 255, 0.28), transparent 58%);
  filter: blur(8px);
  pointer-events: none;
}

.map-inset {
  position: absolute;
  right: 3%;
  bottom: 6%;
  z-index: 2;
  width: 108px;
  height: 88px;
  padding: 6px;
  border: 1px solid rgba(42, 167, 255, 0.42);
  border-radius: 4px;
  background: rgba(3, 18, 48, 0.72);
  color: $text-muted;
  font-size: 10px;
  text-align: center;
}

.map-inset__dots {
  position: relative;
  height: 60px;
}

.map-inset__dots i {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #26cfff;
  box-shadow: 0 0 8px #26cfff;
}

.category-nav {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 6px;
}

.category-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 64px;
  padding: 4px 8px;
  border: none;
  background: none;
  color: #779bc8;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.2s;

  &--active,
  &:hover {
    color: #28c5ff;
  }

  &--active .category-nav__icon {
    border-color: rgba(40, 197, 255, 0.6);
    box-shadow: 0 0 14px rgba(40, 197, 255, 0.35);
  }
}

.category-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(42, 167, 255, 0.25);
  border-radius: 50%;
  background: rgba(6, 25, 66, 0.6);
  font-size: 16px;
}

.livelihood-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  height: 100%;
}

.livelihood-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  border: 1px solid rgba(42, 167, 255, 0.1);
  border-radius: 6px;
  background: rgba(6, 25, 66, 0.5);
}

.livelihood-card__ring {
  --progress: 0.7;
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: conic-gradient(#28c5ff calc(var(--progress) * 360deg), rgba(42, 167, 255, 0.12) 0);
  box-shadow: 0 0 16px rgba(40, 197, 255, 0.2);

  &::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    background: rgba(4, 18, 50, 0.92);
  }
}

.livelihood-card__icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  font-size: 18px;
  pointer-events: none;
}

.livelihood-card__label {
  margin: 0;
  color: $text-muted;
  font-size: 10px;
  text-align: center;
}

.livelihood-card strong {
  color: #f2fbff;
  font-size: 15px;
}

.livelihood-card__delta {
  color: #66dfb1;
  font-size: 10px;
}

.alert-list {
  display: grid;
  gap: 6px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.alert-item {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(6, 25, 66, 0.55);
  font-size: 12px;

  &--red {
    border-left: 3px solid #ff3d62;
    .alert-item__icon { color: #ff3d62; }
  }

  &--orange {
    border-left: 3px solid #ff9c26;
    .alert-item__icon { color: #ff9c26; }
  }

  &--yellow {
    border-left: 3px solid #ffd33c;
    .alert-item__icon { color: #ffd33c; }
  }

  &--blue {
    border-left: 3px solid #28c5ff;
    .alert-item__icon { color: #28c5ff; }
  }
}

.alert-item__icon {
  font-size: 10px;
  text-shadow: 0 0 8px currentColor;
}

.alert-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    color: #e5f4ff;
    font-size: 12px;
    font-weight: 600;
  }

  span {
    color: $text-muted;
    font-size: 10px;
  }
}

.alert-item time {
  color: #6689b5;
  font-size: 10px;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .viz-header__wing {
    display: none;
  }

  .viz-header__title {
    font-size: clamp(22px, 2vw, 32px);
  }

  .metric-card__value {
    font-size: clamp(14px, 1.05vw, 18px);
  }
}
</style>

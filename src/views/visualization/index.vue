<template>
  <main class="viz-screen">
    <canvas ref="threeCanvasRef" class="viz-screen__stars" aria-hidden="true" />
    <div class="viz-screen__glow viz-screen__glow--left" aria-hidden="true" />
    <div class="viz-screen__glow viz-screen__glow--right" aria-hidden="true" />

    <header class="viz-header">
      <div class="viz-header__meta">
        <span class="viz-header__cube" aria-hidden="true" />
        <span>2026-05-26</span>
        <span>16:40:25</span>
        <span>星期二</span>
      </div>
      <div class="viz-header__title-wrap">
        <span class="viz-header__wing viz-header__wing--left" aria-hidden="true" />
        <h1 class="viz-header__title">数据可视化大屏</h1>
        <span class="viz-header__wing viz-header__wing--right" aria-hidden="true" />
      </div>
      <div class="viz-header__weather">
        <span class="viz-header__weather-icon">☁</span>
        <span>多云 22℃</span>
      </div>
    </header>

    <section class="viz-layout">
      <aside class="viz-column viz-column--left">
        <PanelCard title="核心指标" class="panel--metrics">
          <div class="metric-grid">
            <div v-for="metric in metrics" :key="metric.label" class="metric-card">
              <span class="metric-card__icon" :style="{ color: metric.color }">{{ metric.icon }}</span>
              <div>
                <p class="metric-card__label">{{ metric.label }}</p>
                <strong>{{ metric.value }}</strong>
                <span class="metric-card__delta">较昨日 ↑ {{ metric.delta }}</span>
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard title="趋势分析" class="panel--trend">
          <div ref="trendChartRef" class="chart chart--trend" />
        </PanelCard>

        <PanelCard title="业务指标概览" class="panel--business">
          <div class="business-list">
            <div v-for="item in businessMetrics" :key="item.label" class="business-item">
              <span class="business-item__icon" :style="{ color: item.color }">{{ item.icon }}</span>
              <div class="business-item__content">
                <p>{{ item.label }}</p>
                <strong :style="{ color: item.color }">{{ item.value }}</strong>
                <span>较昨日 ↑ {{ item.delta }}</span>
              </div>
              <div :ref="(el) => setSparklineRef(el, item.label)" class="sparkline" />
            </div>
          </div>
        </PanelCard>
      </aside>

      <section class="viz-center">
        <PanelCard title="全国业务分布概览" class="panel--overview">
          <div class="overview-stats">
            <div v-for="item in overviewStats" :key="item.label" class="overview-stat">
              <span class="overview-stat__icon">{{ item.icon }}</span>
              <div>
                <strong>{{ item.value }}</strong>
                <p>{{ item.label }}</p>
              </div>
            </div>
          </div>
        </PanelCard>

        <div class="map-shell">
          <canvas ref="threeMapCanvasRef" class="three-map" aria-label="three.js 中国业务分布地图" />
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

        <div class="legend">
          <span>图例（交易额 / 万元）</span>
          <span v-for="item in legendItems" :key="item.label">
            <i :style="{ background: item.color }" />
            {{ item.label }}
          </span>
        </div>
      </section>

      <aside class="viz-column viz-column--right">
        <PanelCard title="区域交易额 TOP5" subtitle="单位：万元" class="panel--ranking">
          <div ref="rankChartRef" class="chart chart--rank" />
        </PanelCard>

        <PanelCard title="渠道分布" class="panel--channels">
          <div class="channel-total">
            <span>交易总额（万元）</span>
            <strong>125,811.23</strong>
          </div>
          <div ref="channelChartRef" class="chart chart--channels" />
        </PanelCard>

        <PanelCard title="实时监控" class="panel--monitor">
          <div class="monitor-table">
            <div class="monitor-table__head">
              <span>监控指标</span>
              <span>当前值</span>
              <span>状态</span>
            </div>
            <div v-for="item in monitorRows" :key="item.label" class="monitor-row">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <i />
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
import { cityLines, cityPoints, mapData } from './echartsChinaMap'

type ChartElement = HTMLElement | null

const PanelCard = defineComponent({
  name: 'PanelCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots }) {
    return () =>
      h('section', { class: 'panel-card' }, [
        h('div', { class: 'panel-card__header' }, [
          h('h2', props.title),
          props.subtitle ? h('span', props.subtitle) : null,
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
type ChinaGeoJson = {
  features: ChinaFeature[]
}
type FlyLineObject = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  curve: THREE.QuadraticBezierCurve3
  speed: number
  offset: number
}

const threeCanvasRef = ref<HTMLCanvasElement | null>(null)
const threeMapCanvasRef = ref<HTMLCanvasElement | null>(null)
const trendChartRef = ref<ChartElement>(null)
const rankChartRef = ref<ChartElement>(null)
const channelChartRef = ref<ChartElement>(null)
const sparklineRefs = new Map<string, HTMLElement>()

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let particles: THREE.Points | null = null
let mapRenderer: THREE.WebGLRenderer | null = null
let mapScene: THREE.Scene | null = null
let mapCamera: THREE.PerspectiveCamera | null = null
let chinaMapGroup: THREE.Group | null = null
const mapFlyLineObjects: FlyLineObject[] = []
const stationPulseMeshes: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = []
let animationFrame = 0
const chartInstances: echarts.ECharts[] = []
const chinaGeoJson = chinaMap as unknown as ChinaGeoJson
const mapDataByName = new Map(mapData.map((item) => [item.name, item.value]))
const mapCenter: Coordinate = [104.2, 36.2]
const mapScale = 8.2

const metrics = [
  { label: '总用户数', value: '8,745,229', delta: '12.45%', icon: '👥', color: '#28c5ff' },
  { label: '活跃用户数', value: '2,345,872', delta: '8.21%', icon: '♟', color: '#36e68f' },
  { label: '交易总额（元）', value: '125,811,231', delta: '15.78%', icon: '￥', color: '#a978ff' },
  { label: '订单总数', value: '98,234', delta: '10.31%', icon: '🛒', color: '#ff9d26' },
]

const businessMetrics = [
  { label: '用户增长率', value: '12.45%', delta: '2.34%', icon: '●', color: '#31c5ff', data: [22, 28, 24, 38, 30, 44, 36, 58, 42] },
  { label: '订单增长率', value: '10.31%', delta: '1.87%', icon: '■', color: '#43e58f', data: [18, 26, 22, 30, 25, 36, 29, 44, 35] },
  { label: '交易额增长率', value: '15.76%', delta: '3.45%', icon: '◆', color: '#ff9b2e', data: [20, 30, 26, 42, 32, 52, 40, 62, 48] },
  { label: '客单价增长率', value: '6.35%', delta: '1.23%', icon: '▲', color: '#925cff', data: [16, 20, 18, 28, 22, 35, 27, 42, 31] },
]

const overviewStats = [
  { label: '省级行政区', value: '34', icon: '♟' },
  { label: '地级市', value: '333', icon: '▣' },
  { label: '区县', value: '2,852', icon: '▲' },
  { label: '监测站点', value: '9,835', icon: '◆' },
  { label: '在线设备', value: '7,128', icon: '●' },
]

const legendItems = [
  { label: '> 10,000', color: '#ff3d62' },
  { label: '5,000 - 10,000', color: '#ff9c26' },
  { label: '1,000 - 5,000', color: '#ffd33c' },
  { label: '500 - 1,000', color: '#00cdfb' },
  { label: '< 500', color: '#2576ff' },
]

const monitorRows = [
  { label: '接口响应时间', value: '120ms' },
  { label: '数据同步延迟', value: '1.32s' },
  { label: 'CPU使用率', value: '32%' },
  { label: '内存使用率', value: '68%' },
  { label: '磁盘使用率', value: '45%' },
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

const setSparklineRef = (el: unknown, key: string) => {
  if (el instanceof HTMLElement) {
    sparklineRefs.set(key, el)
  }
}

const createChart = (el: ChartElement) => {
  if (!el) return null
  const chart = echarts.init(el)
  chartInstances.push(chart)
  return chart
}

const initCharts = () => {
  createChart(trendChartRef.value)?.setOption({
    color: ['#28c5ff', '#36e68f', '#ff9d26'],
    grid: { top: 34, right: 16, bottom: 24, left: 34 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(3, 14, 36, 0.92)', borderColor: '#1b6dff', textStyle: { color: '#d9ecff' } },
    legend: {
      top: 0,
      left: 20,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#a9c7f5', fontSize: 11 },
      data: ['用户数', '订单数', '交易额（万元）'],
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['05-14', '05-15', '05-16', '05-17', '05-18', '05-19', '05-20'],
      axisLine: { lineStyle: { color: '#1c4a7a' } },
      axisLabel: { color: '#779bc8', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#779bc8', fontSize: 10, formatter: '{value}k' },
      splitLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.12)' } },
    },
    series: [
      { name: '用户数', type: 'line', smooth: true, symbolSize: 5, data: [24, 35, 30, 40, 36, 48, 47] },
      { name: '订单数', type: 'line', smooth: true, symbolSize: 5, data: [18, 26, 22, 29, 27, 34, 37] },
      { name: '交易额（万元）', type: 'line', smooth: true, symbolSize: 5, data: [12, 20, 16, 21, 17, 24, 28] },
    ],
  })

  createChart(rankChartRef.value)?.setOption({
    grid: { top: 6, right: 34, bottom: 26, left: 58 },
    xAxis: {
      type: 'value',
      max: 15000,
      axisLabel: { color: '#6689b5', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.12)' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: ['广东省', '江苏省', '浙江省', '山东省', '河南省'],
      axisLabel: { color: '#d5eaff', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 8,
        data: [
          { value: 12985.21, itemStyle: { color: '#ff4778' } },
          { value: 10245.67, itemStyle: { color: '#ff7f31' } },
          { value: 8765.43, itemStyle: { color: '#ffd33c' } },
          { value: 7654.32, itemStyle: { color: '#36e68f' } },
          { value: 6543.21, itemStyle: { color: '#3489ff' } },
        ],
        label: {
          show: true,
          position: 'right',
          color: '#b9d9ff',
          fontSize: 10,
          formatter: ({ value }: { value: number }) => value.toLocaleString(),
        },
      },
    ],
  })

  createChart(channelChartRef.value)?.setOption({
    color: ['#2aa7ff', '#31d2b1', '#ff9d26', '#7659ff', '#286dff'],
    grid: { top: 4, right: 16, bottom: 2, left: 54 },
    xAxis: { type: 'value', show: false, max: 45 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: ['APP', '小程序', 'PC端', 'H5', '其他'],
      axisLabel: { color: '#c5dcff', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 8,
        data: [42.35, 24.18, 18.76, 8.23, 6.48],
        itemStyle: {
          borderRadius: 6,
          color: (params: { dataIndex: number }) => ['#2aa7ff', '#31d2b1', '#ff9d26', '#7659ff', '#286dff'][params.dataIndex],
        },
        label: { show: true, position: 'right', color: '#a9c7f5', formatter: '{c}%' },
      },
    ],
  })

  businessMetrics.forEach((item) => {
    createChart(sparklineRefs.get(item.label) ?? null)?.setOption({
      grid: { top: 6, right: 4, bottom: 6, left: 4 },
      xAxis: { type: 'category', show: false, data: item.data.map((_, index) => index) },
      yAxis: { type: 'value', show: false },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: item.data,
          lineStyle: { color: item.color, width: 2 },
          areaStyle: { color: `${item.color}22` },
        },
      ],
    })
  })
}

const projectLngLat = ([lng, lat]: Coordinate, z = 0) =>
  new THREE.Vector3((lng - mapCenter[0]) * mapScale, (lat - mapCenter[1]) * mapScale, z)

const getProvinceColor = (value = 0) => {
  if (value > 10000) return new THREE.Color('#ff3d62')
  if (value > 5000) return new THREE.Color('#ff9c26')
  if (value > 1000) return new THREE.Color('#09b9ff')
  if (value > 500) return new THREE.Color('#086fe8')
  return new THREE.Color('#05408f')
}

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
    if (index === 0) {
      shape.moveTo(point.x, point.y)
      return
    }

    shape.lineTo(point.x, point.y)
  })

  holes.forEach((holeRing) => {
    if (holeRing.length < 3) return
    const path = new THREE.Path()
    holeRing.forEach((coordinate, index) => {
      const point = projectLngLat(coordinate)
      if (index === 0) {
        path.moveTo(point.x, point.y)
        return
      }

      path.lineTo(point.x, point.y)
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
    context.font = '24px Microsoft YaHei, sans-serif'
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
  sprite.scale.set(38, 12, 1)
  return sprite
}

const buildThreeProvince = (feature: ChinaFeature) => {
  if (!chinaMapGroup) return
  const group = chinaMapGroup

  const name = feature.properties?.name ?? ''
  const value = mapDataByName.get(name) ?? 380
  const color = getProvinceColor(value)
  const material = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.88,
    shininess: 60,
  })

  getFeaturePolygons(feature).forEach((polygon) => {
    const shape = createShapeFromPolygon(polygon)
    if (!shape) return

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 5,
      bevelEnabled: false,
    })
    geometry.computeVertexNormals()

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = -2
    group.add(mesh)
    polygon.forEach((ring) => addBorderLine(ring, group))
  })

  const center = getFeatureCenter(feature)
  if (center && name) {
    const label = createTextSprite(name)
    label.position.copy(projectLngLat(center, 16))
    group.add(label)
  }
}

const addThreeStations = () => {
  if (!chinaMapGroup) return
  const group = chinaMapGroup

  cityPoints.forEach((point) => {
    const [lng, lat, power] = point.value as [number, number, number]
    const position = projectLngLat([lng, lat], 18)
    const station = new THREE.Mesh(
      new THREE.SphereGeometry(2.6 + power / 70, 18, 18),
      new THREE.MeshBasicMaterial({
        color: '#ff4778',
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
      }),
    )
    station.position.copy(position)
    group.add(station)

    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(4, 5.2, 48),
      new THREE.MeshBasicMaterial({
        color: '#ff4778',
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    )
    pulse.position.copy(position)
    group.add(pulse)
    stationPulseMeshes.push(pulse)
  })
}

const addThreeFlyLines = () => {
  if (!chinaMapGroup) return
  const group = chinaMapGroup

  cityLines.forEach((line, index) => {
    const [startCoordinate, endCoordinate] = line.coords as [Coordinate, Coordinate]
    const start = projectLngLat(startCoordinate, 20)
    const end = projectLngLat(endCoordinate, 20)
    const control = start.clone().lerp(end, 0.5)
    control.z = 42 + line.value / 4
    const curve = new THREE.QuadraticBezierCurve3(start, control, end)
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(96))
    const material = new THREE.LineBasicMaterial({
      color: '#ff9d26',
      transparent: true,
      opacity: 0.66,
      blending: THREE.AdditiveBlending,
    })
    group.add(new THREE.Line(geometry, material))

    const flyPoint = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 14, 14),
      new THREE.MeshBasicMaterial({
        color: '#ffe66d',
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
      }),
    )
    group.add(flyPoint)
    mapFlyLineObjects.push({
      mesh: flyPoint,
      curve,
      speed: 0.1 + index * 0.015,
      offset: index * 0.17,
    })
  })
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
  addThreeFlyLines()
  addThreeStations()
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

  stationPulseMeshes.forEach((mesh, index) => {
    const progress = (elapsed * 0.58 + index * 0.16) % 1
    mesh.scale.setScalar(1 + progress * 2.2)
    mesh.material.opacity = 0.42 * (1 - progress)
  })

  mapFlyLineObjects.forEach((item) => {
    const progress = (elapsed * item.speed + item.offset) % 1
    item.mesh.position.copy(item.curve.getPoint(progress))
    item.mesh.material.opacity = 0.42 + Math.sin(progress * Math.PI) * 0.5
  })

  mapRenderer.render(mapScene, mapCamera)
}

const initThree = () => {
  const canvas = threeCanvasRef.value
  if (!canvas) return

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
  camera.position.z = 120

  const geometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  for (let index = 0; index < 900; index += 1) {
    vertices.push(
      THREE.MathUtils.randFloatSpread(320),
      THREE.MathUtils.randFloatSpread(180),
      THREE.MathUtils.randFloat(-180, 80),
    )
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  const material = new THREE.PointsMaterial({
    color: '#1cb7ff',
    size: 0.8,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  const ringGeometry = new THREE.TorusGeometry(54, 0.16, 8, 96)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: '#146cff',
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = Math.PI / 2.7
  ring.position.set(30, -8, -60)
  scene.add(ring)

  const animate = () => {
    animationFrame = window.requestAnimationFrame(animate)
    if (particles) {
      particles.rotation.y += 0.0007
      particles.rotation.x += 0.0002
    }
    ring.rotation.z += 0.003
    renderer?.render(scene as THREE.Scene, camera as THREE.Camera)
    updateThreeChinaMap()
  }

  resizeThree()
  animate()
}

const resizeThree = () => {
  if (!renderer || !camera) return
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  resizeThreeChinaMap()
}

const handleResize = () => {
  resizeThree()
  chartInstances.forEach((chart) => chart.resize())
}

onMounted(async () => {
  await nextTick()
  initThree()
  initThreeChinaMap()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.cancelAnimationFrame(animationFrame)
  chartInstances.forEach((chart) => chart.dispose())
  renderer?.dispose()
  mapRenderer?.dispose()
  scene?.clear()
  mapScene?.clear()
})
</script>

<style lang="scss" scoped>
$panel-border: rgba(30, 140, 255, 0.36);
$panel-bg: rgba(4, 18, 50, 0.76);
$text-main: #e7f4ff;
$text-muted: #80a8d8;

.viz-screen {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  padding: 16px 18px 22px;
  color: $text-main;
  font-family:
    'Microsoft YaHei',
    'PingFang SC',
    system-ui,
    sans-serif;
  background:
    radial-gradient(circle at 50% 18%, rgba(0, 101, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 80%, rgba(12, 144, 255, 0.16), transparent 36%),
    linear-gradient(180deg, #02091f 0%, #031337 48%, #020817 100%);
}

.viz-screen__stars,
.viz-screen__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.viz-screen__stars {
  z-index: 0;
}

.viz-screen__glow {
  width: 34vw;
  height: 34vw;
  border-radius: 999px;
  filter: blur(36px);
  opacity: 0.42;
}

.viz-screen__glow--left {
  top: 12vh;
  left: -14vw;
  background: rgba(0, 83, 255, 0.45);
}

.viz-screen__glow--right {
  right: -12vw;
  bottom: 2vh;
  background: rgba(0, 194, 255, 0.28);
}

.viz-header,
.viz-layout {
  position: relative;
  z-index: 1;
}

.viz-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 60px;
  margin-bottom: 12px;
}

.viz-header__meta,
.viz-header__weather {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #bcdcff;
  font-size: 14px;
}

.viz-header__weather {
  justify-content: flex-end;
}

.viz-header__weather-icon {
  color: #ffe27a;
}

.viz-header__cube {
  width: 18px;
  height: 18px;
  border: 1px solid #23bbff;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  box-shadow: 0 0 12px #0aa6ff;
}

.viz-header__title-wrap {
  display: flex;
  align-items: center;
  gap: 22px;
}

.viz-header__title {
  margin: 0;
  color: #eaf6ff;
  font-size: clamp(30px, 2.6vw, 44px);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-shadow:
    0 0 12px rgba(69, 178, 255, 0.8),
    0 0 28px rgba(49, 111, 255, 0.55);
}

.viz-header__wing {
  width: clamp(160px, 18vw, 260px);
  height: 30px;
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
  grid-template-columns: minmax(260px, 25vw) 1fr minmax(260px, 24vw);
  gap: 14px;
  height: calc(100vh - 110px);
  min-height: 650px;
}

.viz-column {
  display: grid;
  gap: 12px;
}

.viz-column--left {
  grid-template-rows: 1.1fr 0.95fr 1.15fr;
}

.viz-column--right {
  grid-template-rows: 1fr 0.92fr 0.82fr;
}

.viz-center {
  position: relative;
  display: grid;
  grid-template-rows: 96px 1fr 36px;
  min-width: 0;
}

:deep(.panel-card) {
  position: relative;
  overflow: hidden;
  min-height: 0;
  border: 1px solid $panel-border;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(35, 123, 255, 0.16), transparent 38%),
    $panel-bg;
  box-shadow:
    inset 0 0 22px rgba(12, 114, 255, 0.12),
    0 0 18px rgba(4, 37, 95, 0.34);
  backdrop-filter: blur(8px);

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
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
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(42, 167, 255, 0.16);

  h2 {
    position: relative;
    margin: 0;
    padding-left: 12px;
    color: #e5f4ff;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.03em;

    &::before {
      content: '';
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 0;
      width: 3px;
      border-radius: 3px;
      background: #7d65ff;
      box-shadow: 0 0 10px #31bfff;
    }
  }

  span {
    color: $text-muted;
    font-size: 11px;
  }
}

:deep(.panel-card__body) {
  height: calc(100% - 36px);
  padding: 12px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  height: 100%;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(42, 167, 255, 0.12);
  border-radius: 8px;
  background: rgba(6, 25, 66, 0.72);
}

.metric-card__icon {
  flex: 0 0 34px;
  font-size: 28px;
  line-height: 1;
  text-shadow: 0 0 16px currentColor;
}

.metric-card__label,
.business-item p,
.overview-stat p,
.channel-total span {
  margin: 0;
  color: $text-muted;
  font-size: 11px;
}

.metric-card strong {
  display: block;
  margin: 2px 0;
  color: #f2fbff;
  font-size: clamp(16px, 1.35vw, 23px);
  line-height: 1.1;
}

.metric-card__delta,
.business-item span {
  color: #66dfb1;
  font-size: 10px;
}

.chart {
  width: 100%;
  height: 100%;
}

.business-list {
  display: grid;
  height: 100%;
  gap: 8px;
}

.business-item {
  display: grid;
  grid-template-columns: 28px 1fr 40%;
  align-items: center;
  min-height: 0;
  gap: 8px;
}

.business-item__icon {
  font-size: 18px;
  text-shadow: 0 0 12px currentColor;
}

.business-item__content {
  min-width: 0;
}

.business-item strong {
  display: inline-block;
  margin: 2px 0;
  font-size: 18px;
}

.sparkline {
  height: 42px;
  min-width: 0;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  gap: 12px;
  height: 100%;
}

.overview-stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.overview-stat__icon {
  color: #2aa7ff;
  font-size: 24px;
  text-shadow: 0 0 16px #2aa7ff;
}

.overview-stat strong {
  color: #f1fbff;
  font-size: clamp(18px, 1.6vw, 27px);
  line-height: 1.1;
}

.map-shell {
  position: relative;
  min-height: 0;
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
  inset: 12% 12% 6%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 138, 255, 0.24), transparent 58%);
  filter: blur(6px);
}

.map-inset {
  position: absolute;
  right: 3.5%;
  bottom: 8%;
  z-index: 2;
  width: 112px;
  height: 92px;
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
  height: 64px;
}

.map-inset__dots i {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #26cfff;
  box-shadow: 0 0 8px #26cfff;
}

.legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  color: #9fbfe8;
  font-size: 12px;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
}

.channel-total {
  margin-bottom: 2px;
}

.channel-total strong {
  display: block;
  margin-top: 4px;
  color: #47aaff;
  font-size: 26px;
  line-height: 1;
  text-shadow: 0 0 14px rgba(47, 154, 255, 0.62);
}

.chart--channels {
  height: calc(100% - 42px);
}

.monitor-table {
  display: grid;
  grid-template-rows: repeat(6, 1fr);
  height: 100%;
  color: #b7d8ff;
  font-size: 12px;
}

.monitor-table__head,
.monitor-row {
  display: grid;
  grid-template-columns: 1fr 0.7fr 34px;
  align-items: center;
  gap: 8px;
}

.monitor-table__head {
  color: #6689b5;
  font-size: 11px;
}

.monitor-row strong {
  color: #d4ff65;
  font-weight: 500;
}

.monitor-row i {
  width: 9px;
  height: 9px;
  margin-left: auto;
  border-radius: 50%;
  background: #55f07c;
  box-shadow: 0 0 12px #55f07c;
}

@media (max-width: 1180px) {
  .viz-screen {
    overflow: auto;
  }

  .viz-header {
    grid-template-columns: 1fr;
    gap: 8px;
    height: auto;
    text-align: center;
  }

  .viz-header__meta,
  .viz-header__weather,
  .viz-header__title-wrap {
    justify-content: center;
  }

  .viz-header__wing {
    display: none;
  }

  .viz-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .viz-column,
  .viz-center {
    grid-template-rows: none;
  }

  :deep(.panel-card) {
    min-height: 260px;
  }

  .viz-center {
    min-height: 680px;
  }
}
</style>

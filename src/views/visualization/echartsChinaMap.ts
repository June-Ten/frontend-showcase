import type { EChartsOption } from 'echarts'

export const mapData = [
  { name: '广东省', value: 12985.21 },
  { name: '江苏省', value: 10245.67 },
  { name: '浙江省', value: 8765.43 },
  { name: '山东省', value: 7654.32 },
  { name: '河南省', value: 6543.21 },
  { name: '四川省', value: 5420.8 },
  { name: '湖北省', value: 4822.12 },
  { name: '湖南省', value: 4510.45 },
  { name: '北京市', value: 3908.76 },
  { name: '上海市', value: 3820.1 },
  { name: '福建省', value: 3244.8 },
  { name: '安徽省', value: 2988.2 },
  { name: '河北省', value: 2731.14 },
  { name: '辽宁省', value: 2160.62 },
  { name: '重庆市', value: 1860.22 },
  { name: '云南省', value: 1406.5 },
  { name: '陕西省', value: 1266.42 },
  { name: '贵州省', value: 980.72 },
  { name: '甘肃省', value: 720.4 },
  { name: '青海省', value: 440.28 },
  { name: '西藏自治区', value: 268.36 },
  { name: '新疆维吾尔自治区', value: 860.92 },
  { name: '内蒙古自治区', value: 690.26 },
  { name: '黑龙江省', value: 920.12 },
  { name: '吉林省', value: 780.46 },
  { name: '海南省', value: 1220.88 },
  { name: '台湾省', value: 1468.62 },
]

export const cityLines = [
  { coords: [[113.27, 23.13], [118.78, 32.04]], value: 90 },
  { coords: [[113.27, 23.13], [121.47, 31.23]], value: 82 },
  { coords: [[113.27, 23.13], [120.16, 30.25]], value: 74 },
  { coords: [[113.27, 23.13], [114.31, 30.52]], value: 64 },
  { coords: [[113.27, 23.13], [104.06, 30.67]], value: 56 },
]

export const cityPoints = [
  { name: '广州', value: [113.27, 23.13, 100] },
  { name: '南京', value: [118.78, 32.04, 90] },
  { name: '上海', value: [121.47, 31.23, 82] },
  { name: '杭州', value: [120.16, 30.25, 74] },
  { name: '武汉', value: [114.31, 30.52, 64] },
  { name: '成都', value: [104.06, 30.67, 56] },
]

export const createEchartsChinaMapOption = (): EChartsOption => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(3, 14, 36, 0.92)',
    borderColor: '#1b6dff',
    textStyle: { color: '#d9ecff' },
    formatter: '{b}<br/>交易额：{c} 万元',
  },
  visualMap: {
    show: false,
    min: 0,
    max: 13000,
    inRange: { color: ['#053b9e', '#00bfff', '#ffd23d', '#ff8a22', '#ff3e6c'] },
  },
  geo: {
    map: 'china-full',
    roam: false,
    zoom: 1.16,
    aspectScale: 0.86,
    label: { show: true, color: '#c9e8ff', fontSize: 10 },
    itemStyle: {
      areaColor: 'rgba(5, 50, 141, 0.82)',
      borderColor: '#20d8ff',
      borderWidth: 1,
      shadowColor: '#0aa6ff',
      shadowBlur: 18,
    },
    emphasis: {
      label: { color: '#fff' },
      itemStyle: { areaColor: '#1ab6ff' },
    },
  },
  series: [
    {
      name: '交易额',
      type: 'map',
      geoIndex: 0,
      data: mapData,
    },
    {
      name: '迁徙路径',
      type: 'lines',
      coordinateSystem: 'geo',
      zlevel: 2,
      effect: {
        show: true,
        period: 4,
        trailLength: 0.3,
        symbol: 'arrow',
        symbolSize: 8,
      },
      lineStyle: {
        color: '#ff9d26',
        width: 2,
        opacity: 0.75,
        curveness: 0.24,
      },
      data: cityLines,
    },
    {
      name: '监测站点',
      type: 'effectScatter',
      coordinateSystem: 'geo',
      rippleEffect: { brushType: 'stroke', scale: 4 },
      symbolSize: (value: number[]) => Math.max(value[2] / 8, 8),
      itemStyle: { color: '#ff4778', shadowColor: '#ff4778', shadowBlur: 16 },
      data: cityPoints,
    },
  ],
})

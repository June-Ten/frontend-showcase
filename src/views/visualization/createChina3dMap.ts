import { geoMercator } from 'd3'
import type { FeatureCollection, Geometry, Position } from 'geojson'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import terrainTextureUrl from '../../assets/map/img/地理纹路.png'

type Ring = Position[]
type Polygon = Ring[]
type MultiPolygon = Polygon[]

const MAP_WIDTH = 640
const MAP_HEIGHT = MAP_WIDTH * 0.78
const EXTRUDE_HEIGHT = 4.5
const RISE_DURATION = 1.6

// 深蓝宝石主体 + 克制的青色描边：板块本身偏暗，让边界线和顶面纹理成为亮点
const COLOR_TOP_FACE = new THREE.Color('#2a5cab')
const COLOR_TOP_GLOW = new THREE.Color('#5da8ff')
const COLOR_SIDE_TOP = new THREE.Color('#2563b8')
const COLOR_SIDE_BOTTOM = new THREE.Color('#071430')
const COLOR_SIDE_RIM = new THREE.Color('#7fdfff')
const COLOR_BORDER = new THREE.Color('#8fe3ff')
const COLOR_ACCENT = new THREE.Color('#1f8fde')

function getPolygons(geometry: Geometry): Polygon[] {
  if (geometry.type === 'Polygon') return [geometry.coordinates as Polygon]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates as MultiPolygon
  return []
}

// 鞋带公式（经纬度近似面积，仅用于大小比较）
function ringArea(ring: Ring) {
  let area = 0
  for (let i = 0; i < ring.length - 1; i += 1) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(area / 2)
}

// 约 250km² 以下的零星岛屿不参与挤出，避免南海诸岛形成一片细碎厚块
const MIN_ISLAND_AREA = 0.02

function refineGeojson(geojson: FeatureCollection): FeatureCollection {
  const features = geojson.features
    .filter((feature) => {
      if (!feature.geometry) return false
      const props = feature.properties as { adcode?: string | number; name?: string } | null
      // 剔除九段线等纯边界要素（无名称或 adcode 带 JD 后缀）
      if (!props?.name) return false
      return !String(props.adcode ?? '').includes('JD')
    })
    .map((feature) => {
      const polygons = getPolygons(feature.geometry)
      if (polygons.length <= 1) return feature

      const areas = polygons.map((polygon) => ringArea(polygon[0] ?? []))
      const largest = Math.max(...areas)
      const kept = polygons.filter((_, i) => areas[i] === largest || areas[i] >= MIN_ISLAND_AREA)

      return {
        ...feature,
        geometry: { type: 'MultiPolygon', coordinates: kept } as Geometry,
      }
    })

  return { ...geojson, features }
}

function projectPoint(
  projection: ReturnType<typeof geoMercator>,
  coord: Position,
  offsetX: number,
  offsetY: number,
) {
  const projected = projection([coord[0], coord[1]])
  if (!projected) return null
  return { x: projected[0] - offsetX, y: -(projected[1] - offsetY) }
}

function createShapeFromPolygon(
  polygon: Polygon,
  projection: ReturnType<typeof geoMercator>,
  offsetX: number,
  offsetY: number,
) {
  const [outerRing, ...holes] = polygon
  if (!outerRing || outerRing.length < 3) return null

  const shape = new THREE.Shape()
  outerRing.forEach((coord, index) => {
    const point = projectPoint(projection, coord, offsetX, offsetY)
    if (!point) return
    if (index === 0) shape.moveTo(point.x, point.y)
    else shape.lineTo(point.x, point.y)
  })

  holes.forEach((holeRing) => {
    if (holeRing.length < 3) return
    const path = new THREE.Path()
    holeRing.forEach((coord, index) => {
      const point = projectPoint(projection, coord, offsetX, offsetY)
      if (!point) return
      if (index === 0) path.moveTo(point.x, point.y)
      else path.lineTo(point.x, point.y)
    })
    shape.holes.push(path)
  })

  return shape
}

function computeProjectedBounds(
  geojson: FeatureCollection,
  projection: ReturnType<typeof geoMercator>,
  offsetX: number,
  offsetY: number,
) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const feature of geojson.features) {
    if (!feature.geometry) continue
    for (const polygon of getPolygons(feature.geometry)) {
      for (const ring of polygon) {
        for (const coord of ring) {
          const point = projectPoint(projection, coord, offsetX, offsetY)
          if (!point) continue
          minX = Math.min(minX, point.x)
          maxX = Math.max(maxX, point.x)
          minY = Math.min(minY, point.y)
          maxY = Math.max(maxY, point.y)
        }
      }
    }
  }
  return { minX, maxX, minY, maxY }
}

function createBorderLines(
  geojson: FeatureCollection,
  projection: ReturnType<typeof geoMercator>,
  offsetX: number,
  offsetY: number,
) {
  const positions: number[] = []

  for (const feature of geojson.features) {
    if (!feature.geometry) continue
    for (const polygon of getPolygons(feature.geometry)) {
      for (const ring of polygon) {
        const points: { x: number; y: number }[] = []
        for (const coord of ring) {
          const point = projectPoint(projection, coord, offsetX, offsetY)
          if (point) points.push(point)
        }
        for (let i = 0; i < points.length - 1; i += 1) {
          const a = points[i]
          const b = points[i + 1]
          positions.push(a.x, a.y, EXTRUDE_HEIGHT + 0.45, b.x, b.y, EXTRUDE_HEIGHT + 0.45)
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.LineBasicMaterial({
    color: COLOR_BORDER,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  return new THREE.LineSegments(geometry, material)
}

function createSideMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTopColor: { value: COLOR_SIDE_TOP },
      uBottomColor: { value: COLOR_SIDE_BOTTOM },
      uRimColor: { value: COLOR_SIDE_RIM },
      uDepth: { value: EXTRUDE_HEIGHT },
    },
    vertexShader: /* glsl */ `
      varying float vZ;
      void main() {
        vZ = position.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform vec3 uRimColor;
      uniform float uDepth;
      varying float vZ;
      void main() {
        float t = clamp(vZ / uDepth, 0.0, 1.0);
        // 侧壁下 2/3 保持深色沉稳，亮度集中在贴近顶面的位置
        vec3 color = mix(uBottomColor, uTopColor, pow(t, 2.4));
        // 紧贴顶面的一条冰蓝细亮线，像被顶面光打亮的崖边
        float rim = smoothstep(0.9, 1.0, t);
        color = mix(color, uRimColor, rim * 0.65);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
}

function createBaseDisc(radius: number) {
  const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: COLOR_ACCENT },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor;
      #define PI 3.141592653589793
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        if (r > 1.0) discard;
        float ang = atan(p.y, p.x);

        float rings = smoothstep(0.03, 0.0, abs(fract(r * 6.0 - uTime * 0.15) - 0.5) - 0.47);
        float spokes = smoothstep(0.008, 0.0, abs(fract(ang / PI * 12.0) - 0.5) - 0.49);
        float sweep = pow(clamp(cos(ang - uTime * 0.6), 0.0, 1.0), 8.0);
        float edge = smoothstep(0.98, 0.9, r) * smoothstep(0.78, 0.9, r);

        float fade = smoothstep(1.0, 0.35, r);
        float alpha = (rings * 0.22 + spokes * 0.12 + sweep * 0.3 + edge * 0.5) * fade;
        gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.6));
      }
    `,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  return { mesh, material }
}

type CityMarker = { name: string; lon: number; lat: number; value: number }

const CITY_MARKERS: CityMarker[] = [
  { name: '北京', lon: 116.41, lat: 39.9, value: 100 },
  { name: '上海', lon: 121.47, lat: 31.23, value: 86 },
  { name: '广州', lon: 113.27, lat: 23.13, value: 78 },
  { name: '成都', lon: 104.06, lat: 30.67, value: 64 },
  { name: '武汉', lon: 114.31, lat: 30.52, value: 58 },
  { name: '西安', lon: 108.94, lat: 34.34, value: 52 },
  { name: '沈阳', lon: 123.43, lat: 41.8, value: 44 },
  { name: '乌鲁木齐', lon: 87.62, lat: 43.83, value: 36 },
]

// 飞线：北京为枢纽向各城市辐射
const FLY_ROUTES: [string, string][] = [
  ['北京', '上海'],
  ['北京', '广州'],
  ['北京', '成都'],
  ['北京', '武汉'],
  ['北京', '西安'],
  ['北京', '沈阳'],
  ['北京', '乌鲁木齐'],
]

const COLOR_PILLAR = new THREE.Color('#5fd8ff')
const COLOR_FLYLINE = new THREE.Color('#ffc861')

function createPillarMaterial(height: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: COLOR_PILLAR },
      uHeight: { value: height },
    },
    vertexShader: /* glsl */ `
      uniform float uHeight;
      varying float vT;
      void main() {
        vT = clamp(position.z / uHeight, 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vT;
      void main() {
        // 底部实、顶部渐隐，根部混入一点白色提亮
        vec3 color = mix(uColor, vec3(1.0), pow(1.0 - vT, 3.0) * 0.4);
        float alpha = (1.0 - vT) * 0.75 + 0.1;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createFlyLine(start: THREE.Vector3, end: THREE.Vector3) {
  const mid = start.clone().add(end).multiplyScalar(0.5)
  mid.z += start.distanceTo(end) * 0.32

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  const points = curve.getPoints(90)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const progress = new Float32Array(points.length)
  for (let i = 0; i < points.length; i += 1) progress[i] = i / (points.length - 1)
  geometry.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: COLOR_FLYLINE },
    },
    vertexShader: /* glsl */ `
      attribute float aProgress;
      varying float vProgress;
      void main() {
        vProgress = aProgress;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      varying float vProgress;
      void main() {
        // 常驻淡线 + 周期移动的光脉冲
        float head = fract(vProgress - uTime * 0.22);
        float pulse = pow(head, 22.0);
        vec3 color = mix(uColor, vec3(1.0), pulse * 0.55);
        float alpha = 0.1 + pulse * 0.95;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })

  return new THREE.Line(geometry, material)
}

export type China3dMapController = {
  resize: () => void
  render: () => void
  dispose: () => void
}

export function createChina3dMap(
  canvas: HTMLCanvasElement,
  rawGeojson: FeatureCollection,
): China3dMapController {
  // 先做数据精修（去九段线、滤碎岛），再用精修后的范围做投影适配，
  // 这样大陆主体能撑满画面，海南也只保留本岛
  const geojson = refineGeojson(rawGeojson)
  const projection = geoMercator().fitSize([MAP_WIDTH, MAP_HEIGHT], geojson)
  const offsetX = MAP_WIDTH / 2
  const offsetY = MAP_HEIGHT / 2

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()

  const pivot = new THREE.Group()
  scene.add(pivot)

  // Holds the flat-rotated map; extruding along +z becomes world +y.
  const mapGroup = new THREE.Group()
  mapGroup.rotation.x = -Math.PI / 2
  pivot.add(mapGroup)

  // Terrain texture stretched across the full country footprint so the ridge
  // detail flows continuously over every province.
  const bounds = computeProjectedBounds(geojson, projection, offsetX, offsetY)
  const spanX = bounds.maxX - bounds.minX || 1
  const spanY = bounds.maxY - bounds.minY || 1

  const terrainTexture = new THREE.TextureLoader().load(terrainTextureUrl)
  terrainTexture.colorSpace = THREE.SRGBColorSpace
  terrainTexture.wrapS = THREE.ClampToEdgeWrapping
  terrainTexture.wrapT = THREE.ClampToEdgeWrapping
  terrainTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

  const uvGenerator: THREE.UVGenerator = {
    generateTopUV(_geometry, vertices, indexA, indexB, indexC) {
      const toUv = (i: number) =>
        new THREE.Vector2(
          (vertices[i * 3] - bounds.minX) / spanX,
          (vertices[i * 3 + 1] - bounds.minY) / spanY,
        )
      return [toUv(indexA), toUv(indexB), toUv(indexC)]
    },
    generateSideWallUV() {
      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 1),
      ]
    },
  }

  const topMaterial = new THREE.MeshStandardMaterial({
    color: COLOR_TOP_FACE,
    map: terrainTexture,
    emissive: COLOR_TOP_GLOW,
    emissiveMap: terrainTexture,
    emissiveIntensity: 0.45,
    metalness: 0.08,
    roughness: 0.55,
  })
  const sideMaterial = createSideMaterial()

  const meshGeometries: THREE.BufferGeometry[] = []
  const provinceMeshes: THREE.Mesh[] = []
  for (const feature of geojson.features) {
    if (!feature.geometry) continue
    const provinceName = (feature.properties as { name?: string } | null)?.name ?? ''
    for (const polygon of getPolygons(feature.geometry)) {
      const shape = createShapeFromPolygon(polygon, projection, offsetX, offsetY)
      if (!shape) continue
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: EXTRUDE_HEIGHT,
        bevelEnabled: true,
        bevelThickness: 0.22,
        bevelSize: 0.22,
        bevelSegments: 1,
        UVGenerator: uvGenerator,
      })
      meshGeometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial])
      mesh.userData.provinceName = provinceName
      provinceMeshes.push(mesh)
      mapGroup.add(mesh)
    }
  }

  const borderLines = createBorderLines(geojson, projection, offsetX, offsetY)
  mapGroup.add(borderLines)

  // Recenter the (rotated) content so its footprint is centered on the origin
  // and it sits on the ground plane. This is independent of the projection scale.
  const bbox = new THREE.Box3().setFromObject(mapGroup)
  const center = bbox.getCenter(new THREE.Vector3())
  const size = bbox.getSize(new THREE.Vector3())
  mapGroup.position.set(-center.x, -bbox.min.y, -center.z)

  const footprint = Math.max(size.x, size.z)
  const boundingRadius = 0.5 * Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z)

  const { mesh: baseDisc, material: baseMaterial } = createBaseDisc(footprint * 0.62)
  baseDisc.position.y = -0.5
  pivot.add(baseDisc)

  // --- 城市柱子 / 光晕 / 飞线（挂在 mapGroup 内，跟随升起动画与旋转）---
  const cityPositions = new Map<string, THREE.Vector3>()
  for (const city of CITY_MARKERS) {
    const point = projectPoint(projection, [city.lon, city.lat], offsetX, offsetY)
    if (point) cityPositions.set(city.name, new THREE.Vector3(point.x, point.y, EXTRUDE_HEIGHT))
  }

  const overlayGeometries: THREE.BufferGeometry[] = []
  const overlayMaterials: THREE.Material[] = []
  const pillarMeshes: THREE.Mesh[] = []
  const halos: { mesh: THREE.Mesh; phase: number }[] = []
  const flyLineMaterials: THREE.ShaderMaterial[] = []

  const maxPillarHeight = footprint * 0.075
  const pillarWidth = footprint * 0.007

  CITY_MARKERS.forEach((city, index) => {
    const base = cityPositions.get(city.name)
    if (!base) return

    const height = maxPillarHeight * (0.35 + (city.value / 100) * 0.65)
    const geometry = new THREE.BoxGeometry(pillarWidth, pillarWidth, height)
    geometry.translate(0, 0, height / 2)
    const material = createPillarMaterial(height)
    const pillar = new THREE.Mesh(geometry, material)
    pillar.position.copy(base)
    pillar.userData.label = `${city.name} · ${city.value}`
    overlayGeometries.push(geometry)
    overlayMaterials.push(material)
    pillarMeshes.push(pillar)
    mapGroup.add(pillar)

    const haloGeometry = new THREE.RingGeometry(pillarWidth * 1.6, pillarWidth * 2.8, 32)
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_PILLAR,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const halo = new THREE.Mesh(haloGeometry, haloMaterial)
    halo.position.set(base.x, base.y, EXTRUDE_HEIGHT + 0.12)
    overlayGeometries.push(haloGeometry)
    overlayMaterials.push(haloMaterial)
    halos.push({ mesh: halo, phase: index * 0.8 })
    mapGroup.add(halo)
  })

  for (const [from, to] of FLY_ROUTES) {
    const start = cityPositions.get(from)
    const end = cityPositions.get(to)
    if (!start || !end) continue
    const line = createFlyLine(
      start.clone().setZ(EXTRUDE_HEIGHT + 0.4),
      end.clone().setZ(EXTRUDE_HEIGHT + 0.4),
    )
    overlayGeometries.push(line.geometry)
    overlayMaterials.push(line.material as THREE.Material)
    flyLineMaterials.push(line.material as THREE.ShaderMaterial)
    mapGroup.add(line)
  }

  scene.add(new THREE.AmbientLight(0xaac4f0, 0.9))
  const keyLight = new THREE.DirectionalLight(0xf2f7ff, 1.3)
  keyLight.position.set(footprint * 0.4, footprint * 0.9, footprint * 0.5)
  scene.add(keyLight)
  const rimLight = new THREE.PointLight(0x3aa0ff, 0.9, footprint * 4)
  rimLight.position.set(-footprint * 0.5, footprint * 0.5, -footprint * 0.4)
  scene.add(rimLight)

  const FOV = 38
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, footprint * 30)
  const target = new THREE.Vector3(0, size.y * 0.5, 0)
  const viewDir = new THREE.Vector3(-0.35, 0.66, 1).normalize()
  camera.position.copy(target).addScaledVector(viewDir, boundingRadius * 3)

  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(target)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minPolarAngle = Math.PI * 0.16
  controls.maxPolarAngle = Math.PI * 0.46
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.4

  // --- 鼠标悬浮：高亮省份 + tooltip，悬浮期间暂停自动旋转 ---
  const highlightMaterial = topMaterial.clone()
  highlightMaterial.color = new THREE.Color('#3f7fd6')
  highlightMaterial.emissiveIntensity = 0.9

  const tooltip = document.createElement('div')
  tooltip.style.cssText = [
    'position:absolute',
    'display:none',
    'padding:5px 10px',
    'border:1px solid rgba(63,184,255,0.45)',
    'border-radius:4px',
    'background:rgba(4,16,42,0.9)',
    'color:#d9efff',
    'font-size:12px',
    'letter-spacing:0.05em',
    'white-space:nowrap',
    'pointer-events:none',
    'z-index:10',
  ].join(';')
  canvas.parentElement?.appendChild(tooltip)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const interactiveMeshes = [...pillarMeshes, ...provinceMeshes]
  let highlightedMeshes: THREE.Mesh[] = []

  const clearHighlight = () => {
    highlightedMeshes.forEach((mesh) => {
      mesh.material = [topMaterial, sideMaterial]
    })
    highlightedMeshes = []
  }

  const handlePointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)

    const hit = raycaster.intersectObjects(interactiveMeshes, false)[0]
    clearHighlight()

    if (!hit) {
      tooltip.style.display = 'none'
      canvas.style.cursor = ''
      controls.autoRotate = true
      return
    }

    const data = hit.object.userData as { label?: string; provinceName?: string }
    const text = data.label ?? data.provinceName ?? ''

    if (data.provinceName) {
      highlightedMeshes = provinceMeshes.filter(
        (mesh) => mesh.userData.provinceName === data.provinceName,
      )
      highlightedMeshes.forEach((mesh) => {
        mesh.material = [highlightMaterial, sideMaterial]
      })
    }

    if (text) {
      tooltip.textContent = text
      tooltip.style.display = 'block'
      const parentRect = canvas.parentElement?.getBoundingClientRect() ?? rect
      tooltip.style.left = `${event.clientX - parentRect.left + 14}px`
      tooltip.style.top = `${event.clientY - parentRect.top - 10}px`
    }

    canvas.style.cursor = 'pointer'
    controls.autoRotate = false
  }

  const handlePointerLeave = () => {
    clearHighlight()
    tooltip.style.display = 'none'
    canvas.style.cursor = ''
    controls.autoRotate = true
  }

  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerleave', handlePointerLeave)

  // Fit the bounding sphere within the current viewport (both axes), then
  // keep the user's current orbit angle by only adjusting the distance.
  const frame = (aspect: number) => {
    const vFov = (FOV * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const fitH = boundingRadius / Math.sin(vFov / 2)
    const fitW = boundingRadius / Math.sin(hFov / 2)
    // 包围球本身偏保守（对角线半径），用 <1 的系数让地图撑满视口
    const distance = Math.max(fitH, fitW) * 0.86

    const dir = camera.position.clone().sub(controls.target).normalize()
    camera.position.copy(controls.target).addScaledVector(dir, distance)
    controls.minDistance = distance * 0.55
    controls.maxDistance = distance * 1.8
    controls.update()
  }

  const clock = new THREE.Clock()
  let elapsed = 0

  const resize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    frame(camera.aspect)
  }

  const render = () => {
    const delta = clock.getDelta()
    elapsed += delta

    const riseT = Math.min(elapsed / RISE_DURATION, 1)
    const eased = 1 - Math.pow(1 - riseT, 3)
    mapGroup.scale.z = Math.max(eased, 0.001)

    pivot.position.y = Math.sin(elapsed * 0.8) * footprint * 0.006

    topMaterial.emissiveIntensity = 0.45 + Math.sin(elapsed * 1.6) * 0.07
    highlightMaterial.emissiveIntensity = topMaterial.emissiveIntensity + 0.4
    baseMaterial.uniforms.uTime.value = elapsed

    flyLineMaterials.forEach((material) => {
      material.uniforms.uTime.value = elapsed
    })
    halos.forEach(({ mesh, phase }) => {
      const pulse = 1 + Math.sin(elapsed * 2.2 + phase) * 0.22
      mesh.scale.setScalar(pulse)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = 0.32 + Math.sin(elapsed * 2.2 + phase) * 0.18
    })

    controls.update()
    renderer.render(scene, camera)
  }

  const dispose = () => {
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerleave', handlePointerLeave)
    tooltip.remove()
    controls.dispose()
    meshGeometries.forEach((geometry) => geometry.dispose())
    overlayGeometries.forEach((geometry) => geometry.dispose())
    overlayMaterials.forEach((material) => material.dispose())
    highlightMaterial.dispose()
    borderLines.geometry.dispose()
    ;(borderLines.material as THREE.Material).dispose()
    baseDisc.geometry.dispose()
    baseMaterial.dispose()
    terrainTexture.dispose()
    topMaterial.dispose()
    sideMaterial.dispose()
    renderer.dispose()
  }

  resize()

  return { resize, render, dispose }
}

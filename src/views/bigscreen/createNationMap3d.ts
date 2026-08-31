import { geoMercator } from 'd3'
import type { FeatureCollection, Geometry, Position } from 'geojson'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js'
import chinaMap from '../../assets/map/100000_full.json'
import bar2Url from '../../assets/map/img/bar2.png'
import bar3Url from '../../assets/map/img/bar3.png'
import chinaWxUrl from '../../assets/map/img/chinawx1.png'
import hlSideUrl from '../../assets/map/img/HL-SIDE.png'
import hlmUrl from '../../assets/map/img/hlm.png'
import location from '../../assets/map/location.json'
import type { ScreenData } from './type'

type Ring = Position[]
type Polygon = Ring[]
type ProvinceMeta = {
  name: string
  lat: string
  lon: string
}

type BarObject = {
  name: string
  cube: THREE.Mesh
  top: THREE.Mesh
}

export type NationMap3dController = {
  initData: (data: ScreenData) => void
  resize: () => void
  dispose: () => void
  render: () => void
}

const PROJECTION_CENTER: [number, number] = [106.76581, 30.640725]
const PROJECTION_SCALE = 250
const DOWN_BIAS = 30
const BAR_BASE_HEIGHT = 12
const NORMAL_BAR_SIZE = 2
const HIGHLIGHT_BAR_SIZE = 4
const MAX_BAR_HEIGHT = 80
const HIGHLIGHT_BLOCK_DEPTH = 6

let cachedFont: Font | null = null

function getPolygons(geometry: Geometry): Polygon[] {
  if (geometry.type === 'Polygon') return [geometry.coordinates as Polygon]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates as Polygon[]
  return []
}

function logTransform(value: number, base = 0.5) {
  if (value <= 0) return 0
  return Math.pow(value, base)
}

function getBarHeight(value: number, max: number) {
  const maxLog = logTransform(Math.max(max, 1)) || 1
  return Math.max(8, (MAX_BAR_HEIGHT * logTransform(Math.max(value, 0))) / maxLog)
}

function loadTexture(url: string) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, reject)
  })
}

function createBarMesh(
  x: number,
  z: number,
  height: number,
  size: number,
  cubeMaterial: THREE.Material,
  topMaterial: THREE.Material,
) {
  if (height <= 0) return null
  const worldZ = z + DOWN_BIAS
  const cube = new THREE.Mesh(new THREE.BoxGeometry(size, height, size), cubeMaterial)
  cube.position.set(x, BAR_BASE_HEIGHT + height / 2, worldZ)
  cube.rotation.y = Math.PI / 4

  const top = new THREE.Mesh(new THREE.PlaneGeometry(size, size), topMaterial)
  top.position.set(x, BAR_BASE_HEIGHT + height + 0.01, worldZ)
  top.rotation.x = -Math.PI / 2
  top.rotation.z = Math.PI / 4
  return { cube, top }
}

export async function createNationMap3d(
  container: HTMLElement,
  onProvinceChange: (name: string) => void,
): Promise<NationMap3dController> {
  const projection = geoMercator().center(PROJECTION_CENTER).scale(PROJECTION_SCALE).translate([0, 0])
  const geojson = chinaMap as FeatureCollection
  const provinces = location.province as ProvinceMeta[]

  const [hlmTexture, hlSideTexture, bar2Texture, bar3Texture, chinaWxTexture] = await Promise.all([
    loadTexture(hlmUrl),
    loadTexture(hlSideUrl),
    loadTexture(bar2Url),
    loadTexture(bar3Url),
    loadTexture(chinaWxUrl),
  ])

  hlSideTexture.wrapS = THREE.RepeatWrapping
  hlSideTexture.wrapT = THREE.RepeatWrapping
  hlSideTexture.repeat.set(1, 0.1)

  const highlightTopMaterial = new THREE.MeshBasicMaterial({ map: hlmTexture, transparent: true })
  const highlightSideMaterial = new THREE.MeshBasicMaterial({ map: hlSideTexture, transparent: true })
  const normalBarMaterial = new THREE.MeshBasicMaterial({
    map: bar2Texture,
    transparent: true,
    side: THREE.DoubleSide,
  })
  const normalTopMaterial = new THREE.MeshBasicMaterial({ color: 0xe3fcfb })
  const highlightBarMaterial = new THREE.MeshStandardMaterial({
    map: bar3Texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    metalness: 0.1,
    roughness: 0.8,
  })

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
  camera.position.set(40, 360, 200)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  scene.add(camera)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true })
  renderer.shadowMap.enabled = true
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0xffffff, 0)
  renderer.toneMapping = THREE.NoToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const controller = new OrbitControls(camera, renderer.domElement)
  controller.enablePan = false
  controller.enableZoom = false
  controller.enableRotate = false
  controller.enableDamping = true
  controller.dampingFactor = 0.04
  controller.target.set(0, 0.5, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
  directionalLight.position.set(0.2, 1, -1)
  scene.add(directionalLight)

  const mapGroup = new THREE.Group()
  const materialTop = new THREE.MeshStandardMaterial({
    color: 0x338ad8,
    transparent: true,
    emissive: new THREE.Color('#1f1315'),
    emissiveIntensity: 2,
    opacity: 0.08,
  })
  const materialGlow = new THREE.MeshStandardMaterial({
    color: 0x338ad8,
    transparent: true,
    emissive: new THREE.Color('#74d0e2'),
    emissiveIntensity: 100,
    opacity: 0.2,
  })
  const materialSide = new THREE.MeshPhongMaterial({
    color: 0x338ad8,
    transparent: true,
    shininess: 50,
    opacity: 0.8,
  })
  chinaWxTexture.colorSpace = THREE.SRGBColorSpace
  chinaWxTexture.wrapS = THREE.RepeatWrapping
  chinaWxTexture.wrapT = THREE.RepeatWrapping
  chinaWxTexture.repeat.set(0.0035, 0.0035)
  chinaWxTexture.offset.set(0.543, 0.375)
  chinaWxTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  chinaWxTexture.needsUpdate = true
  const materialMap = new THREE.MeshStandardMaterial({
    map: chinaWxTexture,
    color: new THREE.Color('#8ec8e8'),
    emissive: new THREE.Color('#5aaed4'),
    emissiveMap: chinaWxTexture,
    emissiveIntensity: 0.85,
    metalness: 0,
    roughness: 0.55,
  })

  const addExtrudedLayer = (
    depth: number,
    y: number,
    materials: THREE.Material[],
    namePrefix?: string,
  ) => {
    geojson.features.forEach((feature) => {
      if (!feature.geometry) return
      const group = new THREE.Object3D()
      const provinceName = String((feature.properties as { name?: string } | null)?.name ?? '')
      getPolygons(feature.geometry).forEach((polygon) => {
        const shape = new THREE.Shape()
        polygon[0]?.forEach((point, index) => {
          const projected = projection(point as [number, number])
          if (!projected) return
          const x = projected[0]
          const yPos = -projected[1]
          if (index === 0) shape.moveTo(x, yPos)
          else shape.lineTo(x, yPos)
        })
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: false,
        })
        const mesh = new THREE.Mesh(geometry, materials)
        mesh.rotateX(-Math.PI / 2)
        mesh.position.set(0, y, DOWN_BIAS)
        if (namePrefix) mesh.name = `${namePrefix}${provinceName}`
        else mesh.name = provinceName
        group.add(mesh)

        if (namePrefix) {
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }),
          )
          edges.rotateX(-Math.PI / 2)
          edges.position.set(0, y, DOWN_BIAS)
          group.add(edges)
        }
      })
      mapGroup.add(group)
    })
  }

  addExtrudedLayer(0.2, 14.5, [materialTop, materialGlow], 'block-')
  addExtrudedLayer(12, 1.5, [materialMap, materialSide])
  scene.add(mapGroup)

  const provinceDataMap = new Map<string, ProvinceMeta>()
  const resolveProvince = (name: string) => {
    const direct = provinceDataMap.get(name)
    if (direct) return direct
    for (const [key, meta] of provinceDataMap) {
      if (key.includes(name) || name.includes(key)) return meta
    }
    return null
  }
  const projectProvince = (name: string) => {
    const meta = resolveProvince(name)
    if (!meta) return null
    const projected = projection([Number(meta.lon), Number(meta.lat)])
    if (!projected) return null
    return { x: projected[0], y: projected[1] }
  }
  const highlightBlockCache = new Map<string, THREE.Object3D>()
  const dataList: Record<string, number> = {}
  let bars: BarObject[] = []
  let maxValue = 1
  let nowProvince = ''
  let heightName = ''
  let highlightBlock: THREE.Object3D | null = null
  const highlightBar: { cube: THREE.Mesh | null; top: THREE.Mesh | null } = { cube: null, top: null }
  let textMesh: THREE.Mesh | null = null
  let carouselTimer: number | null = null
  let carouselIndex = 0
  let carouselPaused = false
  let disposed = false
  let animationFrame = 0

  const createHighlightBlock = (provinceName: string) => {
    const group = new THREE.Group()
    const feature = geojson.features.find((item) => {
      const name = String((item.properties as { name?: string } | null)?.name ?? '')
      return name.includes(provinceName)
    })
    if (!feature?.geometry) return null
    getPolygons(feature.geometry).forEach((polygon) => {
      const shape = new THREE.Shape()
      polygon[0]?.forEach((point, index) => {
        const projected = projection(point as [number, number])
        if (!projected) return
        if (index === 0) shape.moveTo(projected[0], -projected[1])
        else shape.lineTo(projected[0], -projected[1])
      })
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: HIGHLIGHT_BLOCK_DEPTH,
        bevelEnabled: false,
      })
      const mesh = new THREE.Mesh(geometry, [
        highlightTopMaterial.clone(),
        highlightSideMaterial.clone(),
      ])
      mesh.rotateX(-Math.PI / 2)
      mesh.position.set(0, 14, DOWN_BIAS)
      group.add(mesh)
    })
    return group
  }

  const addHighlightBlock = (provinceName: string) => {
    if (highlightBlock) scene.remove(highlightBlock)
    let block = highlightBlockCache.get(provinceName)
    if (!block) {
      block = createHighlightBlock(provinceName) ?? undefined
      if (!block) {
        highlightBlock = null
        return
      }
      highlightBlockCache.set(provinceName, block)
    }
    scene.add(block)
    highlightBlock = block
  }

  const restoreNormalBar = (provinceName: string) => {
    const bar = bars.find((item) => item.name === provinceName)
    if (!bar) return
    scene.add(bar.cube)
    scene.add(bar.top)
  }

  const hideNormalBar = (provinceName: string) => {
    const bar = bars.find((item) => item.name === provinceName)
    if (!bar) return
    scene.remove(bar.cube)
    scene.remove(bar.top)
  }

  const highlightProvinceBar = (provinceName: string) => {
    if (highlightBar.top) scene.remove(highlightBar.top)
    if (highlightBar.cube) scene.remove(highlightBar.cube)
    highlightBar.top = null
    highlightBar.cube = null

    const loca = projectProvince(provinceName)
    if (!loca) return
    const barHeight = getBarHeight(dataList[provinceName] || 0, maxValue)
    const meshes = createBarMesh(
      loca.x,
      loca.y,
      barHeight * 1.5,
      HIGHLIGHT_BAR_SIZE,
      highlightBarMaterial,
      normalTopMaterial,
    )
    if (!meshes) return
    highlightBar.cube = meshes.cube
    highlightBar.top = meshes.top
    scene.add(meshes.cube)
    scene.add(meshes.top)
    hideNormalBar(provinceName)
  }

  const createTextMesh = (font: Font, provinceName: string, xyz: number[]) => {
    if (textMesh) {
      scene.remove(textMesh)
      textMesh.geometry.dispose()
      if (Array.isArray(textMesh.material)) textMesh.material.forEach((item) => item.dispose())
      else textMesh.material.dispose()
    }
    const geometry = new TextGeometry(provinceName, { font, size: 4, depth: 0.001 })
    geometry.center()
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        depthTest: false,
      }),
    )
    mesh.position.set(xyz[0], xyz[1] + 30, xyz[2])
    mesh.rotation.set(-1, 0, 0.2)
    scene.add(mesh)
    textMesh = mesh
  }

  const updateInfoText = (provinceName: string) => {
    const loca = projectProvince(provinceName)
    if (!loca) return
    const barHeight = getBarHeight(dataList[provinceName] || 0, maxValue)
    const xyz = [loca.x, BAR_BASE_HEIGHT + barHeight + 10, loca.y + DOWN_BIAS]
    if (cachedFont) {
      createTextMesh(cachedFont, provinceName, xyz)
      return
    }
    const loader = new FontLoader()
    loader.load(
      `${import.meta.env.BASE_URL}fonts/${encodeURIComponent('Alimama ShuHeiTi_Bold.json')}`,
      (font) => {
        cachedFont = font
        createTextMesh(font, provinceName, xyz)
      },
    )
  }

  const heightChange = (name: string) => {
    const provinceName = name.includes('-') ? name.split('-')[1] : name
    if (!provinceName || nowProvince === provinceName) return
    if (heightName) restoreNormalBar(heightName.split('-')[1] ?? '')
    nowProvince = provinceName
    onProvinceChange(provinceName)
    highlightProvinceBar(provinceName)
    addHighlightBlock(provinceName)
    updateInfoText(provinceName)
    heightName = name
  }

  const initBars = () => {
    bars.forEach((item) => {
      scene.remove(item.cube)
      scene.remove(item.top)
    })
    bars = []
    provinces.forEach((province) => {
      const value = dataList[province.name] ?? 0
      if (value <= 0) return
      const barHeight = getBarHeight(value, maxValue)
      const loca = projectProvince(province.name)
      if (!loca) return
      const meshes = createBarMesh(
        loca.x,
        loca.y,
        barHeight,
        NORMAL_BAR_SIZE,
        normalBarMaterial.clone(),
        normalTopMaterial.clone(),
      )
      if (!meshes) return
      bars.push({ name: province.name, cube: meshes.cube, top: meshes.top })
      scene.add(meshes.cube)
      scene.add(meshes.top)
    })
  }

  const stopCarousel = () => {
    if (carouselTimer == null) return
    window.clearInterval(carouselTimer)
    carouselTimer = null
  }

  const startCarousel = () => {
    stopCarousel()
    const list = Array.from(provinceDataMap.keys()).map((name) => `block-${name}`)
    if (list.length === 0) return
    carouselTimer = window.setInterval(() => {
      carouselIndex = (carouselIndex + 1) % list.length
      heightChange(list[carouselIndex])
    }, 5000)
  }

  const onMouseMove = (event: MouseEvent) => {
    const rect = container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObjects(scene.children, true)
    const target = hits.find((item) => item.object.name.includes('block-'))
    if (!target) return
    if (heightName !== target.object.name) {
      stopCarousel()
      carouselPaused = true
      heightChange(target.object.name)
    }
  }

  const onMouseLeave = () => {
    if (!carouselPaused) return
    startCarousel()
    carouselPaused = false
  }

  const resize = () => {
    if (!container.clientWidth || !container.clientHeight) return
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }

  const render = () => {
    controller.update()
    renderer.render(scene, camera)
  }

  const animate = () => {
    if (disposed) return
    animationFrame = window.requestAnimationFrame(animate)
    render()
  }

  const initData = (data: ScreenData) => {
    provinceDataMap.clear()
    Object.keys(dataList).forEach((key) => {
      delete dataList[key]
    })
    maxValue = 1
    provinces.forEach((province) => provinceDataMap.set(province.name, province))
    data.aiFileCountList.forEach((item) => {
      const province = provinceDataMap.get(item.provinceName)
      if (!province) return
      const num = item.aiReview ?? 0
      dataList[province.name] = num
      maxValue = Math.max(maxValue, num)
    })
    initBars()
    startCarousel()
  }

  const dispose = () => {
    disposed = true
    stopCarousel()
    window.cancelAnimationFrame(animationFrame)
    container.removeEventListener('mousemove', onMouseMove)
    container.removeEventListener('mouseleave', onMouseLeave)
    controller.dispose()
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) child.material.forEach((item) => item.dispose())
        else child.material.dispose()
      }
    })
    highlightTopMaterial.dispose()
    highlightSideMaterial.dispose()
    normalBarMaterial.dispose()
    normalTopMaterial.dispose()
    highlightBarMaterial.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement)
    }
  }

  container.addEventListener('mousemove', onMouseMove)
  container.addEventListener('mouseleave', onMouseLeave)
  animate()

  return { initData, resize, dispose, render }
}

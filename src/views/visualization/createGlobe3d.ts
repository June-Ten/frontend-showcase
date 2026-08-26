import type { FeatureCollection } from 'geojson'
import { geoEquirectangular, geoPath } from 'd3'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import earthCloudsUrl from '../../assets/map/img/earth-clouds.png'
import earthNightUrl from '../../assets/map/img/earth-night.jpg'
import { createGlobeStreamGlow, STREAM_STYLE } from './globeStreamGlow'

const GLOBE_RADIUS = 100
const CHINA_CENTER = { lon: 104.2, lat: 35.8 }
const CITY_HEIGHT_REST = 1.15
const CITY_HEIGHT_HOVER = 8.4
const CITY_PICK_ANGLE = THREE.MathUtils.degToRad(2.6)

const STYLE = {
  bg: '#020814',
  area: '#1565a8',
  line: '#9fd4ee',
  sprite: STREAM_STYLE.sprite,
  spriteSize: STREAM_STYLE.spriteSize,
  path: STREAM_STYLE.path,
  fly: STREAM_STYLE.fly,
  wallOpacity: 0.5,
} as const

const CITIES = [
  { name: '北京', lon: 116.41, lat: 39.9 },
  { name: '天津', lon: 117.2, lat: 39.12 },
  { name: '上海', lon: 121.47, lat: 31.23 },
  { name: '重庆', lon: 106.55, lat: 29.56 },
  { name: '哈尔滨', lon: 126.53, lat: 45.8 },
  { name: '长春', lon: 125.32, lat: 43.88 },
  { name: '沈阳', lon: 123.43, lat: 41.8 },
  { name: '大连', lon: 121.62, lat: 38.92 },
  { name: '呼和浩特', lon: 111.75, lat: 40.84 },
  { name: '石家庄', lon: 114.51, lat: 38.04 },
  { name: '太原', lon: 112.55, lat: 37.87 },
  { name: '济南', lon: 117.12, lat: 36.65 },
  { name: '青岛', lon: 120.38, lat: 36.07 },
  { name: '南京', lon: 118.8, lat: 32.06 },
  { name: '杭州', lon: 120.16, lat: 30.29 },
  { name: '合肥', lon: 117.23, lat: 31.82 },
  { name: '南昌', lon: 115.86, lat: 28.68 },
  { name: '福州', lon: 119.3, lat: 26.08 },
  { name: '厦门', lon: 118.09, lat: 24.48 },
  { name: '郑州', lon: 113.63, lat: 34.75 },
  { name: '武汉', lon: 114.31, lat: 30.52 },
  { name: '长沙', lon: 112.98, lat: 28.23 },
  { name: '广州', lon: 113.27, lat: 23.13 },
  { name: '深圳', lon: 114.06, lat: 22.54 },
  { name: '南宁', lon: 108.37, lat: 22.82 },
  { name: '海口', lon: 110.32, lat: 20.04 },
  { name: '成都', lon: 104.06, lat: 30.67 },
  { name: '贵阳', lon: 106.63, lat: 26.65 },
  { name: '昆明', lon: 102.71, lat: 25.04 },
  { name: '拉萨', lon: 91.11, lat: 29.97 },
  { name: '西安', lon: 108.94, lat: 34.34 },
  { name: '兰州', lon: 103.83, lat: 36.06 },
  { name: '西宁', lon: 101.78, lat: 36.62 },
  { name: '银川', lon: 106.27, lat: 38.47 },
  { name: '乌鲁木齐', lon: 87.62, lat: 43.83 },
  { name: '香港', lon: 114.17, lat: 22.32 },
  { name: '澳门', lon: 113.54, lat: 22.19 },
  { name: '台北', lon: 121.56, lat: 25.03 },
]

const FLY_ROUTES: [string, string][] = [
  ['北京', '上海'],
  ['北京', '广州'],
  ['北京', '深圳'],
  ['北京', '成都'],
  ['北京', '武汉'],
  ['北京', '西安'],
  ['北京', '乌鲁木齐'],
  ['北京', '哈尔滨'],
  ['北京', '拉萨'],
  ['北京', '香港'],
  ['上海', '台北'],
  ['广州', '海口'],
]

const refineChinaGeojson = (geojson: FeatureCollection): FeatureCollection => {
  const features = geojson.features.filter((feature) => {
    if (!feature.geometry) return false
    const props = feature.properties as { adcode?: string | number; name?: string } | null
    if (!props?.name) return false
    return !String(props.adcode ?? '').includes('JD')
  })
  return { ...geojson, features }
}

const lonLatToVector = (lon: number, lat: number, radius = GLOBE_RADIUS) => {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

const createChinaMask = (geojson: FeatureCollection) => {
  const width = 1024
  const height = 512
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建中国区域遮罩')

  context.fillStyle = '#000000'
  context.fillRect(0, 0, width, height)

  const projection = geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / (2 * Math.PI))
  const path = geoPath(projection, context)

  const collection = refineChinaGeojson(geojson)

  context.beginPath()
  path(collection)
  context.fillStyle = '#ff0000'
  context.fill()
  context.strokeStyle = '#00ff00'
  context.lineWidth = 2.2
  context.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.anisotropy = 4
  const pixels = context.getImageData(0, 0, width, height).data

  const containsUv = (u: number, v: number) => {
    const x = Math.min(width - 1, Math.max(0, Math.floor(u * width)))
    const y = Math.min(height - 1, Math.max(0, Math.floor((1 - v) * height)))
    const index = (y * width + x) * 4
    return pixels[index] > 24 || pixels[index + 1] > 24
  }

  return { texture, containsUv }
}

const createAtmosphere = (sunDir: THREE.Vector3) => {
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 48, 32)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uSunDir: { value: sunDir.clone() },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vView = normalize(world.xyz - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      void main() {
        float rim = pow(max(0.0, 0.58 - dot(vNormal, -normalize(vView))), 4.6);
        float sun = pow(max(dot(normalize(vWorldNormal), uSunDir), 0.0), 3.8);
        vec3 color = mix(vec3(0.18, 0.42, 0.72), vec3(0.86, 0.93, 1.0), sun);
        gl_FragColor = vec4(color, rim * 0.38 + rim * sun * 0.42);
      }
    `,
  })
  return new THREE.Mesh(geometry, material)
}

const createStars = () => {
  const positions: number[] = []
  for (let i = 0; i < 320; i += 1) {
    const radius = 420 + Math.random() * 680
    const point = new THREE.Vector3().randomDirection().multiplyScalar(radius)
    positions.push(point.x, point.y, point.z)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: STYLE.sprite,
    size: STYLE.spriteSize,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    sizeAttenuation: true,
  })
  return new THREE.Points(geometry, material)
}

const createSunSprite = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建太阳光晕')

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(255,248,236,1)')
  gradient.addColorStop(0.12, 'rgba(186,220,245,0.85)')
  gradient.addColorStop(0.32, 'rgba(32,92,148,0.28)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(52, 52, 1)
  return { sprite, texture, material }
}

const createOrbitRing = (radius: number, tiltX: number, tiltZ: number, nodeCount: number) => {
  const group = new THREE.Group()
  group.rotation.x = tiltX
  group.rotation.z = tiltZ

  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0)
  const points = curve.getPoints(128).map((point) => new THREE.Vector3(point.x, 0, point.y))
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: STYLE.path,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  group.add(new THREE.LineLoop(lineGeometry, lineMaterial))

  const nodeGeometry = new THREE.SphereGeometry(0.85, 12, 10)
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: STYLE.fly,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const nodeMeshes: THREE.Mesh[] = []
  for (let i = 0; i < nodeCount; i += 1) {
    const angle = (i / nodeCount) * Math.PI * 2
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
    node.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
    nodeMeshes.push(node)
    group.add(node)
  }

  return { group, lineGeometry, lineMaterial, nodeGeometry, nodeMaterial }
}

const createHoloBase = () => {
  const group = new THREE.Group()
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const rings = [
    { inner: 78, outer: 79.2, y: -GLOBE_RADIUS - 14, opacity: STYLE.wallOpacity },
    { inner: 108, outer: 109.1, y: -GLOBE_RADIUS - 20, opacity: 0.28 },
    { inner: 138, outer: 139.2, y: -GLOBE_RADIUS - 28, opacity: 0.16 },
  ]

  rings.forEach((ring) => {
    const geometry = new THREE.RingGeometry(ring.inner, ring.outer, 64)
    const material = new THREE.MeshBasicMaterial({
      color: STYLE.fly,
      transparent: true,
      opacity: ring.opacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = ring.y
    geometries.push(geometry)
    materials.push(material)
    group.add(mesh)
  })

  const dashPoints: THREE.Vector3[] = []
  const dashRadius = 108
  for (let i = 0; i < 96; i += 1) {
    if (i % 3 === 2) continue
    const a0 = (i / 96) * Math.PI * 2
    const a1 = ((i + 0.7) / 96) * Math.PI * 2
    dashPoints.push(
      new THREE.Vector3(Math.cos(a0) * dashRadius, 0, Math.sin(a0) * dashRadius),
      new THREE.Vector3(Math.cos(a1) * dashRadius, 0, Math.sin(a1) * dashRadius),
    )
  }
  const dashGeometry = new THREE.BufferGeometry().setFromPoints(dashPoints)
  const dashMaterial = new THREE.LineBasicMaterial({
    color: STYLE.fly,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const dashes = new THREE.LineSegments(dashGeometry, dashMaterial)
  dashes.position.y = -GLOBE_RADIUS - 21
  geometries.push(dashGeometry)
  materials.push(dashMaterial)
  group.add(dashes)

  return { group, geometries, materials }
}

type CityMarker = {
  name: string
  dir: THREE.Vector3
  mesh: THREE.Mesh
  halo: THREE.Mesh
  height: number
  target: number
}

const createCityMarkers = () => {
  const group = new THREE.Group()
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const cities: CityMarker[] = []

  const bodyGeometry = new THREE.CylinderGeometry(0.42, 0.72, 1, 16)
  bodyGeometry.translate(0, 0.5, 0)
  const haloGeometry = new THREE.CircleGeometry(1.05, 24)
  haloGeometry.rotateX(-Math.PI / 2)
  geometries.push(bodyGeometry, haloGeometry)

  const up = new THREE.Vector3(0, 1, 0)

  CITIES.forEach((city) => {
    const dir = lonLatToVector(city.lon, city.lat, 1)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir)

    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: STYLE.fly,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
    mesh.position.copy(dir).multiplyScalar(GLOBE_RADIUS + 0.18)
    mesh.quaternion.copy(quaternion)
    mesh.scale.set(1, CITY_HEIGHT_REST, 1)

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: STYLE.fly,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const halo = new THREE.Mesh(haloGeometry, haloMaterial)
    halo.position.copy(dir).multiplyScalar(GLOBE_RADIUS + 0.22)
    halo.quaternion.copy(quaternion)

    materials.push(bodyMaterial, haloMaterial)
    group.add(mesh, halo)
    cities.push({
      name: city.name,
      dir,
      mesh,
      halo,
      height: CITY_HEIGHT_REST,
      target: CITY_HEIGHT_REST,
    })
  })

  return { group, cities, geometries, materials }
}

export type Globe3dController = {
  resize: () => void
  render: () => void
  dispose: () => void
}

export function createGlobe3d(
  canvas: HTMLCanvasElement,
  chinaGeojson: FeatureCollection,
): Globe3dController {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio < 1.5,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping

  const scene = new THREE.Scene()
  const globe = new THREE.Group()
  scene.add(globe)

  const chinaDirection = lonLatToVector(CHINA_CENTER.lon, CHINA_CENTER.lat, 1).normalize()
  const sunDir = chinaDirection.clone().add(new THREE.Vector3(0.22, 0.38, 0.12)).normalize()

  const textureLoader = new THREE.TextureLoader()
  const nightTexture = textureLoader.load(earthNightUrl)
  nightTexture.colorSpace = THREE.SRGBColorSpace
  nightTexture.anisotropy = 4

  const cloudsTexture = textureLoader.load(earthCloudsUrl)
  cloudsTexture.colorSpace = THREE.SRGBColorSpace
  cloudsTexture.anisotropy = 4

  const chinaMask = createChinaMask(chinaGeojson)
  const cityMarkers = createCityMarkers()

  const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 64)
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uNightMap: { value: nightTexture },
      uChinaMask: { value: chinaMask.texture },
      uSunDir: { value: sunDir },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform sampler2D uNightMap;
      uniform sampler2D uChinaMask;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vView;
      void main() {
        vec3 night = pow(texture2D(uNightMap, vUv).rgb, vec3(0.62));
        vec3 mask = texture2D(uChinaMask, vUv).rgb;
        vec3 normal = normalize(vWorldNormal);
        float wrap = clamp(dot(normal, uSunDir) * 0.58 + 0.52, 0.0, 1.0);
        float rim = pow(1.0 - max(dot(normal, normalize(vView)), 0.0), 2.6);

        vec3 color = night * (1.55 + wrap * 1.25);
        color += night * night * 1.15;
        color += vec3(0.04, 0.10, 0.20) * (0.55 + wrap * 0.7);
        color += vec3(0.42, 0.68, 0.86) * rim * 0.16;

        vec3 ocean = vec3(0.07, 0.32, 0.58);
        vec3 sky = vec3(0.58, 0.80, 0.93);
        vec3 chinaFill = mix(color, ocean, 0.46);
        color = mix(color, chinaFill, mask.r * 0.58);
        color += ocean * mask.r * 0.10;
        color += sky * mask.g * 0.48;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial)
  globe.add(earthMesh)
  globe.add(cityMarkers.group)
  const glow = createGlobeStreamGlow({
    radius: GLOBE_RADIUS,
    cities: cityMarkers.cities,
    routes: FLY_ROUTES,
    chinaGeojson: refineChinaGeojson(chinaGeojson),
  })
  globe.add(glow.group)

  const cloudsGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.006, 64, 48)
  const cloudsMaterial = new THREE.MeshBasicMaterial({
    map: cloudsTexture,
    color: '#e8f2fa',
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
  clouds.raycast = () => {}
  globe.add(clouds)

  const atmosphere = createAtmosphere(sunDir)
  scene.add(atmosphere)

  const orbitA = createOrbitRing(GLOBE_RADIUS * 1.18, 0.18, 0.08, 8)
  const orbitB = createOrbitRing(GLOBE_RADIUS * 1.32, -0.42, 0.22, 6)
  globe.add(orbitA.group, orbitB.group)

  const { group: holoBase, geometries: holoGeometries, materials: holoMaterials } = createHoloBase()
  scene.add(holoBase)

  const stars = createStars()
  scene.add(stars)

  const { sprite: sunSprite, texture: sunTexture, material: sunMaterial } = createSunSprite()
  sunSprite.position.copy(sunDir).multiplyScalar(GLOBE_RADIUS * 1.18)
  scene.add(sunSprite)

  scene.add(new THREE.AmbientLight('#c5d8ea', 1.15))
  const keyLight = new THREE.DirectionalLight('#fff4e8', 2.45)
  keyLight.position.copy(sunDir).multiplyScalar(400)
  scene.add(keyLight)
  const fillLight = new THREE.HemisphereLight('#87b8d9', '#061018', 0.9)
  scene.add(fillLight)
  const rimLight = new THREE.DirectionalLight('#9ec9e8', 0.7)
  rimLight.position.copy(sunDir).multiplyScalar(-320)
  scene.add(rimLight)

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000)
  camera.position.copy(chinaDirection).multiplyScalar(GLOBE_RADIUS * 3.05)
  camera.position.y += GLOBE_RADIUS * 0.18

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = false
  controls.minDistance = GLOBE_RADIUS * 1.7
  controls.maxDistance = GLOBE_RADIUS * 4.4
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.22
  controls.target.set(0, 0, 0)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const localHit = new THREE.Vector3()

  const tooltip = document.createElement('div')
  tooltip.style.cssText = [
    'position:absolute',
    'display:none',
    'padding:6px 10px',
    'border:1px solid #9fd4ee',
    'border-radius:4px',
    'background:rgba(2,8,20,0.92)',
    'color:#9fd4ee',
    'font-size:12px',
    'letter-spacing:0.06em',
    'white-space:nowrap',
    'pointer-events:none',
    'z-index:10',
  ].join(';')
  canvas.parentElement?.appendChild(tooltip)

  const pickCity = (point: THREE.Vector3) => {
    localHit.copy(point)
    earthMesh.worldToLocal(localHit).normalize()
    let nearest: CityMarker | null = null
    let bestAngle = CITY_PICK_ANGLE
    cityMarkers.cities.forEach((city) => {
      const angle = localHit.angleTo(city.dir)
      if (angle < bestAngle) {
        bestAngle = angle
        nearest = city
      }
    })
    return nearest
  }

  const setActiveCity = (city: CityMarker | null, event?: PointerEvent) => {
    cityMarkers.cities.forEach((item) => {
      item.target = item === city ? CITY_HEIGHT_HOVER : CITY_HEIGHT_REST
    })
    canvas.style.cursor = city ? 'pointer' : 'grab'
    controls.autoRotate = !city

    if (!city || !event) {
      tooltip.style.display = 'none'
      return
    }
    tooltip.textContent = city.name
    tooltip.style.display = 'block'
    const parentRect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect()
    tooltip.style.left = `${event.clientX - parentRect.left + 14}px`
    tooltip.style.top = `${event.clientY - parentRect.top - 12}px`
  }

  const handlePointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObject(earthMesh)[0]
    const uv = hit?.uv
    if (!hit || !uv || !chinaMask.containsUv(uv.x, uv.y)) {
      setActiveCity(null)
      return
    }
    setActiveCity(pickCity(hit.point), event)
  }

  const handlePointerLeave = () => setActiveCity(null)

  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerleave', handlePointerLeave)

  const clock = new THREE.Clock()
  let introProgress = 0

  const resize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    glow.setResolution(width, height)

    const verticalDistance = GLOBE_RADIUS / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const horizontalDistance = verticalDistance / Math.max(camera.aspect, 0.55)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.18
    const dir = camera.position.clone().sub(controls.target).normalize()
    camera.position.copy(controls.target).addScaledVector(dir, distance)
    controls.minDistance = distance * 0.62
    controls.maxDistance = distance * 1.7
    controls.update()
  }

  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05)
    introProgress = Math.min(introProgress + delta / 1.6, 1)
    const eased = 1 - Math.pow(1 - introProgress, 4)
    globe.scale.setScalar(0.84 + eased * 0.16)

    clouds.rotation.y += delta * 0.01
    orbitA.group.rotation.y += delta * 0.06
    orbitB.group.rotation.y -= delta * 0.04

    glow.update(clock.elapsedTime)

    cityMarkers.cities.forEach((city) => {
      city.height += (city.target - city.height) * Math.min(1, delta * 8)
      city.mesh.scale.set(1, city.height, 1)
      const hover = (city.height - CITY_HEIGHT_REST) / (CITY_HEIGHT_HOVER - CITY_HEIGHT_REST)
      city.halo.scale.setScalar(1 + hover * 0.55)
      ;(city.halo.material as THREE.MeshBasicMaterial).opacity = 0.28 + hover * 0.45
      ;(city.mesh.material as THREE.MeshBasicMaterial).color.set(hover > 0.2 ? '#e7f5fc' : STYLE.fly)
    })

    controls.update()
    renderer.render(scene, camera)
  }

  const dispose = () => {
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerleave', handlePointerLeave)
    tooltip.remove()
    controls.dispose()
    earthGeometry.dispose()
    earthMaterial.dispose()
    cloudsGeometry.dispose()
    cloudsMaterial.dispose()
    nightTexture.dispose()
    cloudsTexture.dispose()
    chinaMask.texture.dispose()
    cityMarkers.geometries.forEach((geometry) => geometry.dispose())
    cityMarkers.materials.forEach((material) => material.dispose())
    glow.dispose()
    atmosphere.geometry.dispose()
    ;(atmosphere.material as THREE.Material).dispose()
    orbitA.lineGeometry.dispose()
    orbitA.lineMaterial.dispose()
    orbitA.nodeGeometry.dispose()
    orbitA.nodeMaterial.dispose()
    orbitB.lineGeometry.dispose()
    orbitB.lineMaterial.dispose()
    orbitB.nodeGeometry.dispose()
    orbitB.nodeMaterial.dispose()
    holoGeometries.forEach((geometry) => geometry.dispose())
    holoMaterials.forEach((material) => material.dispose())
    stars.geometry.dispose()
    ;(stars.material as THREE.Material).dispose()
    sunTexture.dispose()
    sunMaterial.dispose()
    renderer.dispose()
  }

  resize()
  return { resize, render, dispose }
}

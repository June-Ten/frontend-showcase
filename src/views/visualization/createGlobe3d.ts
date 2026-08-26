import type { FeatureCollection } from 'geojson'
import { geoEquirectangular, geoPath } from 'd3'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import earthCloudsUrl from '../../assets/map/img/earth-clouds.png'
import earthNightUrl from '../../assets/map/img/earth-night.jpg'

const GLOBE_RADIUS = 100
const CHINA_CENTER = { lon: 104.2, lat: 35.8 }

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
  const width = 2048
  const height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('无法创建中国区域遮罩')

  context.fillStyle = '#000000'
  context.fillRect(0, 0, width, height)

  const projection = geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / (2 * Math.PI))
  const path = geoPath(projection, context)

  const features = geojson.features.filter((feature) => {
    const props = feature.properties as { adcode?: string | number; name?: string } | null
    if (!props?.name) return false
    return !String(props.adcode ?? '').includes('JD')
  })

  context.fillStyle = '#ffffff'
  context.beginPath()
  path({ ...geojson, features })
  context.fill()

  const source = context.getImageData(0, 0, width, height).data
  const fill = new Uint8Array(width * height)
  for (let i = 0; i < fill.length; i += 1) {
    fill[i] = source[i * 4] > 128 ? 255 : 0
  }

  const edge = new Uint8Array(width * height)
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      if (!fill[index]) continue
      if (!fill[index - 1] || !fill[index + 1] || !fill[index - width] || !fill[index + width]) {
        edge[index] = 255
      }
    }
  }

  const dilate = (input: Uint8Array, radius: number) => {
    const output = new Uint8Array(input.length)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let max = 0
        for (let dy = -radius; dy <= radius && max < 255; dy += 1) {
          const yy = y + dy
          if (yy < 0 || yy >= height) continue
          for (let dx = -radius; dx <= radius; dx += 1) {
            const xx = x + dx
            if (xx < 0 || xx >= width) continue
            const value = input[yy * width + xx]
            if (value > max) max = value
          }
        }
        output[y * width + x] = max
      }
    }
    return output
  }

  const border = dilate(edge, 1)
  const glow = dilate(edge, 3)
  const output = context.createImageData(width, height)
  for (let i = 0; i < fill.length; i += 1) {
    const offset = i * 4
    output.data[offset] = fill[i]
    output.data[offset + 1] = border[i]
    output.data[offset + 2] = glow[i]
    output.data[offset + 3] = 255
  }
  context.putImageData(output, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.anisotropy = 8
  return texture
}

const createAtmosphere = (sunDir: THREE.Vector3) => {
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 64, 48)
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
        float rim = pow(0.72 - dot(vNormal, -normalize(vView)), 2.6);
        float sun = pow(max(dot(normalize(vWorldNormal), uSunDir), 0.0), 3.4);
        vec3 color = mix(vec3(0.12, 0.42, 0.95), vec3(0.78, 0.93, 1.0), sun);
        gl_FragColor = vec4(color, clamp(rim * 0.42 + rim * sun * 0.85, 0.0, 0.9));
      }
    `,
  })
  return new THREE.Mesh(geometry, material)
}

const createStars = () => {
  const positions: number[] = []
  for (let i = 0; i < 900; i += 1) {
    const radius = 420 + Math.random() * 680
    const point = new THREE.Vector3().randomDirection().multiplyScalar(radius)
    positions.push(point.x, point.y, point.z)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: '#9ecbff',
    size: 0.9,
    transparent: true,
    opacity: 0.55,
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
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.1, 'rgba(190,230,255,0.9)')
  gradient.addColorStop(0.28, 'rgba(70,160,255,0.28)')
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
  sprite.scale.set(78, 78, 1)
  return { sprite, texture, material }
}

const createOrbitRing = (radius: number, tiltX: number, tiltZ: number, nodeCount: number) => {
  const group = new THREE.Group()
  group.rotation.x = tiltX
  group.rotation.z = tiltZ

  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0)
  const points = curve.getPoints(256).map((point) => new THREE.Vector3(point.x, 0, point.y))
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: '#4ec8ff',
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  group.add(new THREE.LineLoop(lineGeometry, lineMaterial))

  const nodeGeometry = new THREE.SphereGeometry(0.85, 12, 10)
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: '#7fe0ff',
    transparent: true,
    opacity: 0.95,
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
    { inner: 78, outer: 79.2, y: -GLOBE_RADIUS - 14, opacity: 0.38 },
    { inner: 96, outer: 97.1, y: -GLOBE_RADIUS - 18, opacity: 0.28 },
    { inner: 118, outer: 119.4, y: -GLOBE_RADIUS - 24, opacity: 0.2 },
    { inner: 142, outer: 143.2, y: -GLOBE_RADIUS - 31, opacity: 0.12 },
  ]

  rings.forEach((ring) => {
    const geometry = new THREE.RingGeometry(ring.inner, ring.outer, 160)
    const material = new THREE.MeshBasicMaterial({
      color: '#3db7ff',
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
    color: '#5ad0ff',
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

export type Globe3dController = {
  resize: () => void
  render: () => void
  dispose: () => void
}

export function createGlobe3d(
  canvas: HTMLCanvasElement,
  chinaGeojson: FeatureCollection,
): Globe3dController {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  const scene = new THREE.Scene()
  const globe = new THREE.Group()
  scene.add(globe)

  const chinaDirection = lonLatToVector(CHINA_CENTER.lon, CHINA_CENTER.lat, 1).normalize()
  const sunDir = new THREE.Vector3(0.72, 0.18, 0.42).normalize()

  const textureLoader = new THREE.TextureLoader()
  const nightTexture = textureLoader.load(earthNightUrl)
  nightTexture.colorSpace = THREE.SRGBColorSpace
  nightTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

  const cloudsTexture = textureLoader.load(earthCloudsUrl)
  cloudsTexture.colorSpace = THREE.SRGBColorSpace
  cloudsTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

  const chinaMask = createChinaMask(chinaGeojson)
  chinaMask.anisotropy = renderer.capabilities.getMaxAnisotropy()

  const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 96)
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uNightMap: { value: nightTexture },
      uChinaMask: { value: chinaMask },
      uSunDir: { value: sunDir },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uNightMap;
      uniform sampler2D uChinaMask;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vec3 night = texture2D(uNightMap, vUv).rgb;
        vec3 mask = texture2D(uChinaMask, vUv).rgb;
        float ndl = max(dot(normalize(vWorldNormal), uSunDir), 0.0);

        vec3 color = night * (0.82 + ndl * 0.38);
        color += night * night * 0.55;

        vec3 chinaFill = color * vec3(0.52, 0.82, 1.45) + vec3(0.04, 0.18, 0.48);
        color = mix(color, chinaFill, mask.r * 0.78);
        color += vec3(0.28, 0.78, 1.0) * mask.g * 2.15;
        color += vec3(0.1, 0.38, 0.92) * mask.b * 0.85;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  globe.add(new THREE.Mesh(earthGeometry, earthMaterial))

  const cloudsGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.008, 96, 64)
  const cloudsMaterial = new THREE.MeshLambertMaterial({
    map: cloudsTexture,
    color: '#d7ecff',
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
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

  scene.add(new THREE.AmbientLight(0x6b8eb8, 0.55))
  const keyLight = new THREE.DirectionalLight(0xd8eeff, 2.2)
  keyLight.position.copy(sunDir).multiplyScalar(400)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight(0x1a4f9c, 0.55)
  fillLight.position.set(-180, 40, -120)
  scene.add(fillLight)

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

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.18)
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  const clock = new THREE.Clock()
  let introProgress = 0

  const resize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    renderer.setSize(width, height, false)
    composer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

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

    clouds.rotation.y += delta * 0.012
    orbitA.group.rotation.y += delta * 0.08
    orbitB.group.rotation.y -= delta * 0.05
    holoBase.rotation.y += delta * 0.04
    stars.rotation.y -= delta * 0.004

    controls.update()
    composer.render()
  }

  const dispose = () => {
    controls.dispose()
    composer.dispose()
    earthGeometry.dispose()
    earthMaterial.dispose()
    cloudsGeometry.dispose()
    cloudsMaterial.dispose()
    nightTexture.dispose()
    cloudsTexture.dispose()
    chinaMask.dispose()
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

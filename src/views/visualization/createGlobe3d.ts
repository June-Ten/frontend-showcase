import type { FeatureCollection } from 'geojson'
import { geoEquirectangular, geoPath } from 'd3'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { feature } from 'topojson-client'
import worldAtlas from 'world-atlas/countries-110m.json'

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

const createEarthTexture = (
  countries: FeatureCollection,
  chinaGeojson: FeatureCollection,
) => {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建地球纹理')

  context.fillStyle = '#050505'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const projection = geoEquirectangular()
    .translate([canvas.width / 2, canvas.height / 2])
    .scale(canvas.width / (2 * Math.PI))
  const path = geoPath(projection, context)

  context.beginPath()
  path(countries)
  context.fillStyle = '#252527'
  context.fill()
  context.strokeStyle = '#4a4a4e'
  context.lineWidth = 0.7
  context.stroke()

  context.beginPath()
  path(chinaGeojson)
  context.fillStyle = '#ff5a36'
  context.fill()
  context.strokeStyle = '#ffb09c'
  context.lineWidth = 1.15
  context.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

const createAtmosphere = () => {
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.1, 64, 48)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color('#8da2b5') } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      void main() {
        float intensity = pow(0.68 - dot(vNormal, -vPositionNormal), 3.0);
        gl_FragColor = vec4(uColor, intensity * 0.22);
      }
    `,
  })
  return new THREE.Mesh(geometry, material)
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

  const scene = new THREE.Scene()
  const globe = new THREE.Group()
  scene.add(globe)

  const topology = worldAtlas as unknown as {
    type: 'Topology'
    objects: { countries: object }
    arcs: unknown[]
  }
  const countries = feature(
    topology as Parameters<typeof feature>[0],
    topology.objects.countries as Parameters<typeof feature>[1],
  ) as unknown as FeatureCollection

  const chinaDirection = lonLatToVector(CHINA_CENTER.lon, CHINA_CENTER.lat, 1).normalize()
  const earthTexture = createEarthTexture(countries, chinaGeojson)
  earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

  const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 96)
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.82,
    metalness: 0.04,
  })
  globe.add(new THREE.Mesh(earthGeometry, earthMaterial))

  const atmosphere = createAtmosphere()
  scene.add(atmosphere)

  scene.add(new THREE.AmbientLight(0xffffff, 0.42))
  const keyLight = new THREE.DirectionalLight(0xf4f7ff, 2.4)
  keyLight.position.copy(chinaDirection).multiplyScalar(260).add(new THREE.Vector3(-60, 90, 10))
  scene.add(keyLight)

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1200)
  camera.position.copy(chinaDirection).multiplyScalar(GLOBE_RADIUS * 3.15)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.055
  controls.enablePan = false
  controls.minDistance = GLOBE_RADIUS * 1.55
  controls.maxDistance = GLOBE_RADIUS * 4.2
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.28

  const clock = new THREE.Clock()
  let introProgress = 0

  const resize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    const verticalDistance = GLOBE_RADIUS / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const horizontalDistance = verticalDistance / Math.max(camera.aspect, 0.55)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.14
    camera.position.copy(chinaDirection).multiplyScalar(distance)
    controls.update()
  }

  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05)
    introProgress = Math.min(introProgress + delta / 1.5, 1)
    const eased = 1 - Math.pow(1 - introProgress, 4)
    globe.scale.setScalar(0.82 + eased * 0.18)

    controls.update()
    renderer.render(scene, camera)
  }

  const dispose = () => {
    controls.dispose()
    earthGeometry.dispose()
    earthMaterial.dispose()
    earthTexture.dispose()
    ;(atmosphere.geometry as THREE.BufferGeometry).dispose()
    ;(atmosphere.material as THREE.Material).dispose()
    renderer.dispose()
  }

  resize()
  return { resize, render, dispose }
}

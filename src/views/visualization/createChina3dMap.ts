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
const COLOR_SIDE_TOP = new THREE.Color('#4f9fe8')
const COLOR_SIDE_BOTTOM = new THREE.Color('#050d24')
const COLOR_BORDER = new THREE.Color('#8fe3ff')
const COLOR_ACCENT = new THREE.Color('#1f8fde')

function getPolygons(geometry: Geometry): Polygon[] {
  if (geometry.type === 'Polygon') return [geometry.coordinates as Polygon]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates as MultiPolygon
  return []
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
    opacity: 0.95,
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
      uniform float uDepth;
      varying float vZ;
      void main() {
        float t = clamp(vZ / uDepth, 0.0, 1.0);
        vec3 color = mix(uBottomColor, uTopColor, pow(t, 1.6));
        // 顶部边缘一条细窄的亮带，弱化大面积渐变的廉价感
        float rim = smoothstep(0.82, 1.0, t);
        color += uTopColor * rim * 0.55;
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

export type China3dMapController = {
  resize: () => void
  render: () => void
  dispose: () => void
}

export function createChina3dMap(
  canvas: HTMLCanvasElement,
  geojson: FeatureCollection,
): China3dMapController {
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
  for (const feature of geojson.features) {
    if (!feature.geometry) continue
    for (const polygon of getPolygons(feature.geometry)) {
      const shape = createShapeFromPolygon(polygon, projection, offsetX, offsetY)
      if (!shape) continue
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: EXTRUDE_HEIGHT,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 1,
        UVGenerator: uvGenerator,
      })
      meshGeometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial])
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

  // Fit the bounding sphere within the current viewport (both axes), then
  // keep the user's current orbit angle by only adjusting the distance.
  const frame = (aspect: number) => {
    const vFov = (FOV * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const fitH = boundingRadius / Math.sin(vFov / 2)
    const fitW = boundingRadius / Math.sin(hFov / 2)
    const distance = Math.max(fitH, fitW) * 1.12

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
    baseMaterial.uniforms.uTime.value = elapsed

    controls.update()
    renderer.render(scene, camera)
  }

  const dispose = () => {
    controls.dispose()
    meshGeometries.forEach((geometry) => geometry.dispose())
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

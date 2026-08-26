import type { FeatureCollection, Position } from 'geojson'
import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import spriteUrl from '../../assets/map/img/globe-stream/sprite.png'

export const STREAM_STYLE = {
  sprite: '#1a4d78',
  spriteSize: 2.5,
  path: '#8ec8e4',
  fly: '#f2f9ff',
  scatter: '#9fd0ea',
  stream: '#8ec8e4',
} as const

const FLY_DURATION = 2
const FLY_LINE_R_FACTOR = 0.2

type CityRef = {
  name: string
  dir: THREE.Vector3
}

const toXYPlane = (start: THREE.Vector3, end: THREE.Vector3) => {
  const origin = new THREE.Vector3(0, 0, 0)
  const startDir = start.clone().sub(origin)
  const endDir = end.clone().sub(origin)
  const normal = new THREE.Vector3().crossVectors(startDir, endDir).normalize()
  const toZ = new THREE.Quaternion().setFromUnitVectors(normal, new THREE.Vector3(0, 0, 1))
  const startZ = start.clone().applyQuaternion(toZ)
  const endZ = end.clone().applyQuaternion(toZ)
  const middle = startZ.clone().add(endZ).multiplyScalar(0.5).normalize()
  const toY = new THREE.Quaternion().setFromUnitVectors(middle, new THREE.Vector3(0, 1, 0))
  return {
    quaternion: toZ.clone().invert().multiply(toY.clone().invert()),
    startPoint: startZ.clone().applyQuaternion(toY),
    endPoint: endZ.clone().applyQuaternion(toY),
  }
}

const radianAOB = (a: THREE.Vector3, b: THREE.Vector3, origin: THREE.Vector3) => {
  const dir1 = a.clone().sub(origin).normalize()
  const dir2 = b.clone().sub(origin).normalize()
  return Math.acos(THREE.MathUtils.clamp(dir1.dot(dir2), -1, 1))
}

const threePointCenter = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) => {
  const l1 = p1.lengthSq()
  const l2 = p2.lengthSq()
  const l3 = p3.lengthSq()
  const s = p1.x * p2.y + p2.x * p3.y + p3.x * p1.y - p1.x * p3.y - p2.x * p1.y - p3.x * p2.y
  const x = (l2 * p3.y + l1 * p2.y + l3 * p1.y - l2 * p1.y - l3 * p2.y - l1 * p3.y) / s / 2
  const y = (l3 * p2.x + l2 * p1.x + l1 * p3.x - l1 * p2.x - l2 * p3.x - l3 * p1.x) / s / 2
  return new THREE.Vector3(x, y, 0)
}

const createTadpole = (radius: number, startAngle: number, endAngle: number) => {
  const points = new THREE.ArcCurve(0, 0, radius, startAngle, endAngle, false).getSpacedPoints(200)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const percents = new Float32Array(points.length)
  const colors = new Float32Array(points.length * 3)
  const tail = new THREE.Color('#9fd4ee')
  const head = new THREE.Color('#ffffff')
  for (let i = 0; i < points.length; i += 1) {
    percents[i] = i / points.length
    const color = tail.clone().lerp(head, i / points.length)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  geometry.setAttribute('percent', new THREE.BufferAttribute(percents, 1))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    vertexColors: true,
    size: 4,
    sizeAttenuation: false,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      'attribute float percent;\nvoid main() {',
    )
    shader.vertexShader = shader.vertexShader.replace(
      'gl_PointSize = size;',
      'gl_PointSize = percent * size;',
    )
  }

  const mesh = new THREE.Points(geometry, material)
  mesh.name = 'tadpolePointsMesh'
  mesh.raycast = () => {}
  return { mesh, geometry, material }
}

const createPathLine = (
  center: THREE.Vector3,
  radius: number,
  startDeg: number,
  endDeg: number,
) => {
  const points = new THREE.ArcCurve(center.x, center.y, radius, startDeg, endDeg, false).getSpacedPoints(200)
  const geometry = new LineGeometry()
  geometry.setPositions(points.flatMap((point) => [point.x, point.y, 0]))
  const material = new LineMaterial({
    color: 0xb8e4f7,
    linewidth: 1.8,
    transparent: true,
    opacity: 1,
    dashed: false,
    worldUnits: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const line = new Line2(geometry, material)
  line.name = 'pathLine'
  line.computeLineDistances()
  line.raycast = () => {}
  return { line, geometry, material }
}

const createFlyLine = (from: THREE.Vector3, to: THREE.Vector3, radius: number, delay: number) => {
  const { quaternion, startPoint, endPoint } = toXYPlane(from, to)
  const middle = startPoint.clone().add(endPoint).multiplyScalar(0.5)
  const dir = middle.clone().normalize()
  const angle = radianAOB(from, to, new THREE.Vector3(0, 0, 0))
  const peak = dir.multiplyScalar(radius + angle * radius * FLY_LINE_R_FACTOR)
  const center = threePointCenter(startPoint, endPoint, peak)
  const arcRadius = peak.clone().sub(center).length()
  const offset = radianAOB(startPoint, new THREE.Vector3(0, -1, 0), center)
  const startDeg = -Math.PI / 2 + offset
  const endDeg = Math.PI - startDeg
  const flyAngle = (endDeg - startDeg) / 7

  const path = createPathLine(center, arcRadius, startDeg, endDeg)
  const tadpole = createTadpole(arcRadius, startDeg, startDeg + flyAngle)
  tadpole.mesh.position.y = center.y

  const group = new THREE.Group()
  group.add(path.line, tadpole.mesh)
  group.quaternion.multiply(quaternion)
  group.name = 'flyLine'
  group.raycast = () => {}

  return {
    group,
    geometries: [path.geometry, tadpole.geometry],
    materials: [path.material, tadpole.material],
    tadpole: tadpole.mesh,
    range: endDeg - startDeg,
    delay,
  }
}

const projectLonLat = (lon: number, lat: number, width: number, height: number) => [
  (lon / 360 + 0.5) * width,
  height / 2 - (lat * width) / 360,
]

const DIRS = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
] as const

const extractNationalOutline = (geojson: FeatureCollection) => {
  const width = 1024
  const height = 512
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return []

  const drawRing = (ring: Position[]) => {
    if (ring.length < 3) return
    context.beginPath()
    ring.forEach((position, index) => {
      const [x, y] = projectLonLat(Number(position[0]), Number(position[1]), width, height)
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.closePath()
    context.fill()
  }

  context.fillStyle = '#ff0000'
  geojson.features.forEach((feature) => {
    const geometry = feature.geometry
    if (!geometry) return
    if (geometry.type === 'Polygon') {
      drawRing(geometry.coordinates[0])
      return
    }
    if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon) => drawRing(polygon[0]))
    }
  })

  const { data } = context.getImageData(0, 0, width, height)
  const solid = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false
    return data[(y * width + x) * 4] > 24
  }
  const visited = new Uint8Array(width * height)
  const rings: Position[][] = []

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (visited[y * width + x] || !solid(x, y) || solid(x - 1, y)) continue
      if (
        solid(x + 1, y) &&
        solid(x, y + 1) &&
        solid(x, y - 1) &&
        solid(x + 1, y + 1) &&
        solid(x - 1, y + 1) &&
        solid(x + 1, y - 1) &&
        solid(x - 1, y - 1)
      ) {
        continue
      }

      const ring: Position[] = []
      let cx = x
      let cy = y
      let px = x - 1
      let py = y

      for (let step = 0; step < width * height; step += 1) {
        ring.push([cx, cy])
        visited[cy * width + cx] = 1
        let back = 0
        for (let i = 0; i < 8; i += 1) {
          if (cx + DIRS[i][0] === px && cy + DIRS[i][1] === py) {
            back = i
            break
          }
        }
        let moved = false
        for (let i = 1; i <= 8; i += 1) {
          const dir = (back + i) % 8
          const nx = cx + DIRS[dir][0]
          const ny = cy + DIRS[dir][1]
          if (!solid(nx, ny)) continue
          px = cx
          py = cy
          cx = nx
          cy = ny
          moved = true
          break
        }
        if (!moved) break
        if (cx === x && cy === y && ring.length > 8) break
      }

      if (ring.length < 90) continue
      const step = ring.length > 400 ? 3 : 2
      rings.push(
        ring.filter((_, index) => index % step === 0).map(([px, py]) => {
          const lon = (Number(px) / width - 0.5) * 360
          const lat = ((height / 2 - Number(py)) * 360) / width
          return [lon, lat]
        }),
      )
    }
  }

  rings.sort((a, b) => b.length - a.length)
  return rings.slice(0, 3)
}

export const createGlobeStreamGlow = (options: {
  radius: number
  cities: CityRef[]
  routes: [string, string][]
  chinaGeojson: FeatureCollection
}) => {
  const group = new THREE.Group()
  group.name = 'globeStreamGlow'
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const textures: THREE.Texture[] = []

  const spriteTexture = new THREE.TextureLoader().load(spriteUrl)
  spriteTexture.colorSpace = THREE.NoColorSpace
  const spriteMaterial = new THREE.SpriteMaterial({
    color: STREAM_STYLE.sprite,
    map: spriteTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.scale.set(
    options.radius * STREAM_STYLE.spriteSize,
    options.radius * STREAM_STYLE.spriteSize,
    1,
  )
  sprite.renderOrder = -1
  sprite.raycast = () => {}
  textures.push(spriteTexture)
  materials.push(spriteMaterial)
  group.add(sprite)

  const tadpoles: { mesh: THREE.Object3D; range: number; delay: number }[] = []
  const pathMaterials: LineMaterial[] = []
  const byName = new Map(options.cities.map((city) => [city.name, city.dir]))

  options.routes.forEach(([fromName, toName], index) => {
    const fromDir = byName.get(fromName)
    const toDir = byName.get(toName)
    if (!fromDir || !toDir) return
    const from = fromDir.clone().multiplyScalar(options.radius)
    const to = toDir.clone().multiplyScalar(options.radius)
    const fly = createFlyLine(from, to, options.radius, index * 0.18)
    geometries.push(...fly.geometries)
    materials.push(...fly.materials)
    pathMaterials.push(fly.materials[0] as LineMaterial)
    tadpoles.push({ mesh: fly.tadpole, range: fly.range, delay: fly.delay })
    group.add(fly.group)
  })

  const streamUniforms = {
    u_time: { value: 0 },
    number: { value: 4 },
    speed: { value: 1 },
    length: { value: 2.2 },
    size: { value: 10 },
    color: { value: new THREE.Color(STREAM_STYLE.stream) },
  }
  const streamMaterial = new THREE.ShaderMaterial({
    uniforms: streamUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float percent;
      uniform float u_time;
      uniform float number;
      uniform float speed;
      uniform float length;
      uniform float size;
      varying float opacity;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float l = clamp(1.0 - length, 0.0, 1.0);
        gl_PointSize = clamp(fract(percent * number + l - u_time * number * speed) - l, 0.0, 1.0) * size * (1.0 / length);
        opacity = gl_PointSize / size;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float opacity;
      uniform vec3 color;
      void main() {
        if (opacity <= 0.2) discard;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  materials.push(streamMaterial)

  extractNationalOutline(options.chinaGeojson).forEach((ring) => {
    if (ring.length < 2) return
    const vertices: number[] = []
    const percents: number[] = []
    const step = ring.length > 240 ? 2 : 1
    const sampled = ring.filter((_, index) => index % step === 0)
    sampled.forEach((position, index) => {
      const lon = Number(position[0])
      const lat = Number(position[1])
      const phi = THREE.MathUtils.degToRad(90 - lat)
      const theta = THREE.MathUtils.degToRad(lon + 180)
      const r = options.radius * 1.002
      vertices.push(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      )
      percents.push(index / Math.max(sampled.length - 1, 1))
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('percent', new THREE.Float32BufferAttribute(percents, 1))
    geometries.push(geometry)
    const line = new THREE.Line(geometry, streamMaterial)
    line.raycast = () => {}
    group.add(line)
  })

  const setResolution = (width: number, height: number) => {
    pathMaterials.forEach((material) => material.resolution.set(width, height))
  }

  const update = (elapsed: number) => {
    streamUniforms.u_time.value = (elapsed % 10) / 10
    tadpoles.forEach((item) => {
      const t = ((elapsed + item.delay) / FLY_DURATION) % 1
      item.mesh.rotation.z = t * item.range
    })
  }

  const dispose = () => {
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => material.dispose())
    textures.forEach((texture) => texture.dispose())
  }

  return { group, update, dispose, setResolution }
}

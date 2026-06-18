import { ExtensionCategory, Polyline, register, type Graph as G6Graph, type Point } from '@antv/g6'

const EDGE_TYPE = 'g6-test-tree-polyline'
const ANT_LINE_DASH = [6, 4] as const
const ANT_LINE_OFFSET = 20
const ANT_LINE_DURATION = 450

const EDGE_LABEL_OFFSET_X = 8
const EDGE_LABEL_OFFSET_Y = 0

const DEFAULT_EDGE_ZINDEX = 1
/** 高于普通边，但低于节点（含 ± 折叠按钮） */
const ACTIVE_EDGE_ZINDEX = 3
export const G6_TEST_NODE_ZINDEX = 5

let visibilityAnimating = false

/** 折叠/展开、懒加载期间跳过边的蚂蚁线，避免与布局动画冲突 */
export function setG6TestVisibilityAnimating(value: boolean) {
  visibilityAnimating = value
}

export function isG6TestVisibilityAnimating() {
  return visibilityAnimating
}

interface CancellableAnimation {
  cancel?: () => void
}

interface AnimatableShape {
  attr: (attrs: Record<string, unknown>) => void
  animate: (
    keyframes: Record<string, unknown>[],
    options?: Record<string, unknown>,
  ) => CancellableAnimation | null
  activeAnimations?: CancellableAnimation[]
}

/** 竖 → 横 → 竖，控制点仅由端点决定，折叠/展开时路径平滑跟随 */
function treeOrthControlPoints(source: Point, target: Point): Point[] {
  const midY = (source[1] + target[1]) / 2
  return [
    [source[0], midY],
    [target[0], midY],
  ]
}

/** 标签落在第二段竖线（最后一段，靠近子节点）中部，配合 offsetX 显示在竖线右侧 */
function lastVerticalSegmentLabelRatio(source: Point, target: Point): number {
  const midY = (source[1] + target[1]) / 2
  const seg1 = Math.abs(midY - source[1])
  const seg2 = Math.abs(target[0] - source[0])
  const seg3 = Math.abs(target[1] - midY)
  const total = seg1 + seg2 + seg3
  if (total <= 0) return 0.5
  return (seg1 + seg2 + seg3 * 0.55) / total
}

function getG6TestTreePolyline(graph: G6Graph, id: string): G6TestTreePolyline | undefined {
  return (graph as unknown as { context: { element: { getElement: (id: string) => G6TestTreePolyline | undefined } } })
    .context.element.getElement(id)
}

function forEachG6TestTreePolyline(graph: G6Graph, fn: (edge: G6TestTreePolyline) => void) {
  for (const edge of graph.getEdgeData()) {
    const id = edge.id ?? `${edge.source}-${edge.target}`
    const element = getG6TestTreePolyline(graph, id)
    if (element) fn(element)
  }
}

class G6TestTreePolyline extends Polyline {
  private antAnimation: CancellableAnimation | null = null

  getControlPoints(attributes: Parameters<Polyline['getControlPoints']>[0]) {
    const [source, target] = this.getEndpoints(attributes, false)
    return treeOrthControlPoints(source, target)
  }

  protected getLabelStyle(attributes: Parameters<Polyline['getLabelStyle']>[0]) {
    if (attributes.label === false || !attributes.labelText) return false

    const [source, target] = this.getEndpoints(attributes, false)

    const style = super.getLabelStyle({
      ...attributes,
      labelPlacement: lastVerticalSegmentLabelRatio(source, target),
      labelAutoRotate: false,
      labelOffsetX: EDGE_LABEL_OFFSET_X,
      labelOffsetY: EDGE_LABEL_OFFSET_Y,
    })
    if (!style) return false
    return { ...style, textAlign: 'left' as const }
  }

  private isActive() {
    return this.context.graph.getElementState(this.id).includes('active')
  }

  private getKeyShape(): AnimatableShape | undefined {
    return this.shapeMap.key as unknown as AnimatableShape | undefined
  }

  private cancelRunningAnimations(shape: AnimatableShape) {
    this.antAnimation?.cancel?.()
    this.antAnimation = null
    shape.activeAnimations?.slice().forEach((animation) => animation.cancel?.())
  }

  stopAntAnimation() {
    const shape = this.getKeyShape()
    if (!shape) return

    this.cancelRunningAnimations(shape)
    shape.attr({
      lineDash: 0,
      lineDashOffset: 0,
    })
  }

  private startAntAnimation() {
    const shape = this.getKeyShape()
    if (!shape || this.antAnimation) return

    shape.attr({ lineDash: [...ANT_LINE_DASH] })
    this.antAnimation = shape.animate(
      [{ lineDashOffset: 0 }, { lineDashOffset: -ANT_LINE_OFFSET }],
      { duration: ANT_LINE_DURATION, iterations: Infinity },
    ) as CancellableAnimation | null
  }

  syncAntAnimation() {
    if (visibilityAnimating) {
      this.stopAntAnimation()
      return
    }
    if (this.isActive()) this.startAntAnimation()
    else this.stopAntAnimation()
  }

  render(...args: Parameters<Polyline['render']>) {
    super.render(...args)
    this.syncAntAnimation()
  }

  onCreate() {
    this.syncAntAnimation()
  }

  onUpdate() {
    this.syncAntAnimation()
  }

  onDestroy() {
    this.stopAntAnimation()
  }
}

let registered = false

export function registerG6TestTreePolyline() {
  if (registered) return
  register(ExtensionCategory.EDGE, EDGE_TYPE, G6TestTreePolyline)
  registered = true
}

export function stopAllG6TestTreePolylineEdges(graph: G6Graph) {
  forEachG6TestTreePolyline(graph, (edge) => edge.stopAntAnimation())
  syncG6TestEdgeZIndex(graph)
}

export function syncG6TestEdgeZIndex(graph: G6Graph) {
  if (visibilityAnimating) return

  const activeIds = new Set(
    graph.getElementDataByState('edge', 'active').map((edge) => String(edge.id)),
  )
  const updates: Record<string, number> = {}

  for (const edge of graph.getEdgeData()) {
    const id = String(edge.id ?? `${edge.source}-${edge.target}`)
    updates[id] = activeIds.has(id) ? ACTIVE_EDGE_ZINDEX : DEFAULT_EDGE_ZINDEX
  }

  if (Object.keys(updates).length > 0) {
    void graph.setElementZIndex(updates)
  }
}

export function syncAllG6TestTreePolylineEdges(graph: G6Graph) {
  forEachG6TestTreePolyline(graph, (edge) => edge.syncAntAnimation())
  syncG6TestEdgeZIndex(graph)
}

export { EDGE_TYPE as G6_TEST_TREE_POLYLINE_TYPE }

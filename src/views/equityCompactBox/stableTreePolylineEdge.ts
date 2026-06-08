import { ExtensionCategory, Polyline, register, type Graph as G6Graph, type Point } from '@antv/g6'

const ANT_LINE_DASH = [6, 4] as const
const ANT_LINE_OFFSET = 20
const ANT_LINE_DURATION = 450

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

/** 垂直树：先竖后横再竖，仅依赖端点，折叠动画时路径不会乱跳 */
function stableTreeControlPoints(sourcePoint: Point, targetPoint: Point): Point[] {
  const midY = (sourcePoint[1] + targetPoint[1]) / 2
  return [
    [sourcePoint[0], midY],
    [targetPoint[0], midY],
  ]
}

function getStableTreePolyline(graph: G6Graph, id: string): StableTreePolyline | undefined {
  return (graph as unknown as { context: { element: { getElement: (id: string) => StableTreePolyline | undefined } } })
    .context.element.getElement(id)
}

function forEachStableTreePolyline(graph: G6Graph, fn: (edge: StableTreePolyline) => void) {
  for (const edge of graph.getEdgeData()) {
    const id = String(edge.id ?? `${edge.source}-${edge.target}`)
    const element = getStableTreePolyline(graph, id)
    if (element) fn(element)
  }
}

class StableTreePolyline extends Polyline {
  private antAnimation: CancellableAnimation | null = null

  getControlPoints(attributes: Parameters<Polyline['getControlPoints']>[0]) {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes, false)
    return stableTreeControlPoints(sourcePoint, targetPoint)
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

  private isGraphCollapsingExpanding() {
    return (this.context.graph as unknown as { isCollapsingExpanding?: boolean }).isCollapsingExpanding === true
  }

  syncAntAnimation() {
    if (this.isGraphCollapsingExpanding()) {
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

export function registerStableTreePolyline() {
  if (registered) return
  register(ExtensionCategory.EDGE, 'stable-tree-polyline', StableTreePolyline)
  registered = true
}

export function stopAllStableTreePolylineEdges(graph: G6Graph) {
  forEachStableTreePolyline(graph, (edge) => edge.stopAntAnimation())
}

export function syncAllStableTreePolylineEdges(graph: G6Graph) {
  forEachStableTreePolyline(graph, (edge) => edge.syncAntAnimation())
}

import { ExtensionCategory, Polyline, register, type Graph as G6Graph } from '@antv/g6'

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

function getHoverAntPolyline(graph: G6Graph, id: string): HoverAntPolyline | undefined {
  return (graph as unknown as { context: { element: { getElement: (id: string) => HoverAntPolyline | undefined } } })
    .context.element.getElement(id)
}

function forEachHoverAntPolyline(graph: G6Graph, fn: (edge: HoverAntPolyline) => void) {
  for (const edge of graph.getEdgeData()) {
    const id = edge.id ?? `${edge.source}-${edge.target}`
    const element = getHoverAntPolyline(graph, id)
    if (element) fn(element)
  }
}

class HoverAntPolyline extends Polyline {
  private antAnimation: CancellableAnimation | null = null

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

export function registerHoverAntPolyline() {
  if (registered) return
  register(ExtensionCategory.EDGE, 'hover-ant-polyline', HoverAntPolyline)
  registered = true
}

export function stopAllHoverAntPolylineEdges(graph: G6Graph) {
  forEachHoverAntPolyline(graph, (edge) => edge.stopAntAnimation())
}

export function syncAllHoverAntPolylineEdges(graph: G6Graph) {
  forEachHoverAntPolyline(graph, (edge) => edge.syncAntAnimation())
}

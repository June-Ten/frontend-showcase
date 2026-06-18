import * as d3 from 'd3'
import dagre from '@dagrejs/dagre'
import type { EquityGraphData, EquityNodeItem, EquityNodeType } from '../equity/equityData'

const NODE_WIDTH = 200
const NODE_HEIGHT = 56
const BADGE_RADIUS = 11
const PADDING = { top: 48, right: 56, bottom: 48, left: 56 }
const TRANSITION_MS = 400

const OFFSHORE_STYLE = {
  fill: '#f5f9fd',
  stroke: '#7eb2dd',
  labelFill: '#1f2937',
}

const TARGET_STYLE = {
  fill: '#1a5fb4',
  stroke: '#1a5fb4',
  labelFill: '#ffffff',
}

const EDGE_COLOR = '#99ADD1'
const EDGE_ACTIVE_COLOR = '#1a5fb4'
const ANT_LINE_DASH = '6,4'
const ANT_LINE_DURATION = 450

interface LayoutNode extends EquityNodeItem {
  x: number
  y: number
}

interface LayoutEdge {
  id: string
  source: string
  target: string
  percent?: string
}

interface GraphTopology {
  shareholderParents: Map<string, string[]>
  investmentChildren: Map<string, string[]>
}

interface LayoutResult {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  nodeById: Map<string, LayoutNode>
}

interface ToggleContext {
  nodeId: string
  direction: 'upstream' | 'downstream'
  expanding: boolean
}

export interface D3EquityGraph {
  destroy: () => void
  resize: (width?: number, height?: number) => void
  reset: () => void
  expandAll: () => void
  collapseAll: () => void
}

function nodeStyle(type?: EquityNodeType) {
  return type === 'target' ? TARGET_STYLE : OFFSHORE_STYLE
}

function formatLabelLines(data: EquityNodeItem['data']): string[] {
  if (data.type === 'person') return [data.name]
  if (data.region) return [data.name, `(${data.region})`]
  return [data.name]
}

function buildTopology(data: EquityGraphData): GraphTopology {
  const shareholderParents = new Map<string, string[]>()
  const investmentChildren = new Map<string, string[]>()

  const addToMap = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key) ?? []
    list.push(value)
    map.set(key, list)
  }

  for (const edge of data.edges) {
    if (edge.data?.relation === 'shareholder') {
      addToMap(shareholderParents, edge.target, edge.source)
    } else if (edge.data?.relation === 'investment') {
      addToMap(investmentChildren, edge.source, edge.target)
    }
  }

  return { shareholderParents, investmentChildren }
}

function collectUpstream(topo: GraphTopology, nodeId: string): Set<string> {
  const hidden = new Set<string>()
  const queue = [...(topo.shareholderParents.get(nodeId) ?? [])]

  while (queue.length > 0) {
    const id = queue.shift()!
    if (hidden.has(id)) continue
    hidden.add(id)
    for (const parent of topo.shareholderParents.get(id) ?? []) {
      queue.push(parent)
    }
  }

  return hidden
}

function collectDownstream(topo: GraphTopology, nodeId: string): Set<string> {
  const hidden = new Set<string>()
  const queue = [...(topo.investmentChildren.get(nodeId) ?? [])]

  while (queue.length > 0) {
    const id = queue.shift()!
    if (hidden.has(id)) continue
    hidden.add(id)
    for (const child of topo.investmentChildren.get(id) ?? []) {
      queue.push(child)
    }
  }

  return hidden
}

function computeHiddenNodes(
  topo: GraphTopology,
  collapsedUpstream: Set<string>,
  collapsedDownstream: Set<string>,
): Set<string> {
  const hidden = new Set<string>()

  for (const nodeId of collapsedUpstream) {
    for (const id of collectUpstream(topo, nodeId)) hidden.add(id)
  }
  for (const nodeId of collapsedDownstream) {
    for (const id of collectDownstream(topo, nodeId)) hidden.add(id)
  }

  return hidden
}

function filterVisibleLayout(fullLayout: LayoutResult, hidden: Set<string>): LayoutResult {
  const nodes = fullLayout.nodes.filter((node) => !hidden.has(node.id))
  const visibleIds = new Set(nodes.map((node) => node.id))
  const edges = fullLayout.edges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
  )
  return { nodes, edges, nodeById: fullLayout.nodeById }
}

function computeLayout(data: EquityGraphData): LayoutResult {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 36,
    ranksep: 64,
    marginx: 0,
    marginy: 0,
  })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of data.nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of data.edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  const nodes: LayoutNode[] = data.nodes.map((node) => {
    const positioned = graph.node(node.id)
    return { ...node, x: positioned.x, y: positioned.y }
  })

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const edges: LayoutEdge[] = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    percent: edge.data?.percent,
  }))

  return { nodes, edges, nodeById }
}

function orthPath(
  source: LayoutNode,
  target: LayoutNode,
): { path: string; labelX: number; labelY: number } {
  const sx = source.x
  const sy = source.y + NODE_HEIGHT / 2
  const tx = target.x
  const ty = target.y - NODE_HEIGHT / 2
  const midY = sy + (ty - sy) / 2

  const path = `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`
  return { path, labelX: (sx + tx) / 2, labelY: midY }
}

function nodeTransform(node: LayoutNode): string {
  return `translate(${node.x - NODE_WIDTH / 2},${node.y - NODE_HEIGHT / 2})`
}

function collapsedPathAt(node: LayoutNode): string {
  const x = node.x
  const y = node.y
  return `M${x},${y} L${x},${y} L${x},${y} L${x},${y}`
}

function snapshotNodePositions(
  selection: d3.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  selection.each(function (d) {
    const transform = d3.select(this).attr('transform') ?? ''
    const match = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/)
    if (match) {
      positions.set(d.id, {
        x: parseFloat(match[1]) + NODE_WIDTH / 2,
        y: parseFloat(match[2]) + NODE_HEIGHT / 2,
      })
    } else {
      positions.set(d.id, { x: d.x, y: d.y })
    }
  })
  return positions
}

function snapshotEdgePaths(
  selection: d3.Selection<SVGGElement, LayoutEdge, SVGGElement, unknown>,
): Map<string, string> {
  const paths = new Map<string, string>()
  selection.each(function (d) {
    const pathD = d3.select(this).select('path.equity-d3-edge__line').attr('d')
    if (pathD) paths.set(d.id, pathD)
  })
  return paths
}

function getBounds(nodes: LayoutNode[]) {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 1, height: 1 }
  }
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs) - NODE_WIDTH / 2
  const maxX = Math.max(...xs) + NODE_WIDTH / 2
  const minY = Math.min(...ys) - NODE_HEIGHT / 2 - BADGE_RADIUS
  const maxY = Math.max(...ys) + NODE_HEIGHT / 2 + BADGE_RADIUS
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}

export function createD3EquityGraph(container: HTMLElement, data: EquityGraphData): D3EquityGraph {
  const width = container.clientWidth || 800
  const height = container.clientHeight || 600

  const topo = buildTopology(data)
  const collapsedUpstream = new Set<string>()
  const collapsedDownstream = new Set<string>()

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'equity-d3-svg')

  const defs = svg.append('defs')
  defs
    .append('marker')
    .attr('id', 'equity-d3-arrow')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', EDGE_COLOR)

  defs
    .append('marker')
    .attr('id', 'equity-d3-arrow-active')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', EDGE_ACTIVE_COLOR)

  const root = svg.append('g').attr('class', 'equity-d3-root')
  const edgeLayer = root.append('g').attr('class', 'equity-d3-edges')
  const nodeLayer = root.append('g').attr('class', 'equity-d3-nodes')

  const antAnimations = new Map<string, number>()
  let viewWidth = width
  let viewHeight = height
  const fullLayout = computeLayout(data)
  let layout: LayoutResult = fullLayout
  const bounds = getBounds(fullLayout.nodes)
  let isAnimating = false
  let lastToggle: ToggleContext | null = null

  function stopAntAnimation(edgeId: string) {
    const frameId = antAnimations.get(edgeId)
    if (frameId != null) {
      cancelAnimationFrame(frameId)
      antAnimations.delete(edgeId)
    }
  }

  function stopAllAntAnimations() {
    for (const edgeId of antAnimations.keys()) stopAntAnimation(edgeId)
  }

  function startAntAnimation(edgeId: string, pathEl: SVGPathElement) {
    stopAntAnimation(edgeId)
    const start = performance.now()
    const dashLength = 10

    const tick = (now: number) => {
      const elapsed = (now - start) % ANT_LINE_DURATION
      const offset = (elapsed / ANT_LINE_DURATION) * dashLength
      d3.select(pathEl).attr('stroke-dashoffset', -offset)
      antAnimations.set(edgeId, requestAnimationFrame(tick))
    }

    antAnimations.set(edgeId, requestAnimationFrame(tick))
  }

  function setEdgeActive(edgeId: string, active: boolean) {
    const group = edgeLayer.select<SVGGElement>(`g[data-edge-id="${edgeId}"]`)
    const path = group.select<SVGPathElement>('path.equity-d3-edge__line')
    if (path.empty()) return

    if (active) {
      path
        .attr('stroke', EDGE_ACTIVE_COLOR)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', ANT_LINE_DASH)
        .attr('marker-end', 'url(#equity-d3-arrow-active)')
      startAntAnimation(edgeId, path.node()!)
      group.select('text').attr('fill', EDGE_ACTIVE_COLOR).attr('font-weight', 600)
    } else {
      stopAntAnimation(edgeId)
      path
        .attr('stroke', EDGE_COLOR)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', null)
        .attr('stroke-dashoffset', null)
        .attr('marker-end', 'url(#equity-d3-arrow)')
      group.select('text').attr('fill', '#6b7280').attr('font-weight', 500)
    }
  }

  function highlightNode(nodeId: string | null) {
    if (isAnimating) return
    stopAllAntAnimations()

    const connectedEdgeIds = new Set<string>()
    const connectedNodeIds = new Set<string>()

    if (nodeId) {
      connectedNodeIds.add(nodeId)
      for (const edge of layout.edges) {
        if (edge.source === nodeId || edge.target === nodeId) {
          connectedEdgeIds.add(edge.id)
          connectedNodeIds.add(edge.source)
          connectedNodeIds.add(edge.target)
        }
      }
    }

    nodeLayer.selectAll<SVGGElement, LayoutNode>('g.equity-d3-node').each(function (d) {
      const group = d3.select(this)
      group.style('opacity', nodeId == null || connectedNodeIds.has(d.id) ? 1 : 0.35)
      group.select('rect.equity-d3-node__body').attr('stroke-width', d.id === nodeId ? 2 : 1)
    })

    edgeLayer.selectAll<SVGGElement, LayoutEdge>('g.equity-d3-edge').each(function (d) {
      setEdgeActive(d.id, connectedEdgeIds.has(d.id))
    })
  }

  function hasUpstreamBranch(nodeId: string) {
    return (topo.shareholderParents.get(nodeId)?.length ?? 0) > 0
  }

  function hasDownstreamBranch(nodeId: string) {
    return (topo.investmentChildren.get(nodeId)?.length ?? 0) > 0
  }

  function appendBadge(
    group: d3.Selection<SVGGElement, LayoutNode, null, undefined>,
    placement: 'top' | 'bottom',
    collapsed: boolean,
    isTarget: boolean,
    onToggle: () => void,
  ) {
    const cy = placement === 'top' ? -BADGE_RADIUS : NODE_HEIGHT + BADGE_RADIUS
    const badge = group
      .append('g')
      .attr('class', `equity-d3-badge equity-d3-badge--${placement}`)
      .attr('transform', `translate(${NODE_WIDTH / 2},${cy})`)
      .style('cursor', 'pointer')

    badge
      .append('circle')
      .attr('r', BADGE_RADIUS)
      .attr('fill', '#ffffff')
      .attr('stroke', isTarget ? '#1a5fb4' : '#7eb2dd')
      .attr('stroke-width', 1.5)

    badge
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 13)
      .attr('font-weight', 600)
      .attr('fill', '#1a5fb4')
      .attr('pointer-events', 'none')
      .text(collapsed ? '+' : '−')

    badge.on('click', (event) => {
      event.stopPropagation()
      onToggle()
    })
  }

  function updateBadges() {
    nodeLayer.selectAll<SVGGElement, LayoutNode>('g.equity-d3-node').each(function (d) {
      const group = d3.select<SVGGElement, LayoutNode>(this)
      group.selectAll('.equity-d3-badge').remove()

      const isTarget = d.data.type === 'target'

      if (hasUpstreamBranch(d.id)) {
        appendBadge(group, 'top', collapsedUpstream.has(d.id), isTarget, () => {
          toggleUpstream(d.id)
        })
      }
      if (hasDownstreamBranch(d.id)) {
        appendBadge(group, 'bottom', collapsedDownstream.has(d.id), isTarget, () => {
          toggleDownstream(d.id)
        })
      }
    })
  }

  function renderEdges(
    animate: boolean,
    prevPaths: Map<string, string>,
    toggle: ToggleContext | null,
  ) {
    const duration = animate ? TRANSITION_MS : 0
    const ease = d3.easeCubicInOut
    const anchor = toggle ? fullLayout.nodeById.get(toggle.nodeId) : undefined

    const edgeSelection = edgeLayer
      .selectAll<SVGGElement, LayoutEdge>('g.equity-d3-edge')
      .data(layout.edges, (d) => d.id)

    edgeSelection.exit().each(function (this: SVGGElement) {
      const d = d3.select(this).datum() as LayoutEdge
      const group = d3.select(this)
      const pathEl = group.select<SVGPathElement>('path.equity-d3-edge__line')
      const label = group.select<SVGTextElement>('text.equity-d3-edge__label')
      const currentPath = pathEl.attr('d') ?? prevPaths.get(d.id) ?? ''
      const endPath = anchor && toggle && !toggle.expanding ? collapsedPathAt(anchor) : currentPath

      group
        .transition()
        .duration(duration)
        .ease(ease)
        .style('opacity', 0)
        .remove()

      if (animate && currentPath) {
        pathEl
          .transition()
          .duration(duration)
          .ease(ease)
          .attrTween('d', () => d3.interpolateString(currentPath, endPath))

        const startX = parseFloat(label.attr('x') || '0')
        const startY = parseFloat(label.attr('y') || '0')
        if (anchor && toggle && !toggle.expanding) {
          label
            .transition()
            .duration(duration)
            .ease(ease)
            .attr('x', anchor.x)
            .attr('y', anchor.y)
        } else if (startX || startY) {
          label.transition().duration(duration).ease(ease).attr('x', startX).attr('y', startY)
        }
      }
    })

    const edgeEnter = edgeSelection
      .enter()
      .append('g')
      .attr('class', 'equity-d3-edge')
      .attr('data-edge-id', (d) => d.id)
      .style('opacity', 0)

    edgeEnter.each(function (this: SVGGElement) {
      const group = d3.select(this)
      group.append('path').attr('class', 'equity-d3-edge__line')
      group.append('text').attr('class', 'equity-d3-edge__label')
    })

    const edgeMerge = edgeEnter.merge(edgeSelection)

    edgeMerge.each(function (d) {
      const source = layout.nodeById.get(d.source)
      const target = layout.nodeById.get(d.target)
      if (!source || !target) return

      const { path, labelX, labelY } = orthPath(source, target)
      const group = d3.select(this)
      const pathEl = group.select<SVGPathElement>('path.equity-d3-edge__line')
      const label = group.select<SVGTextElement>('text.equity-d3-edge__label')
      const prevPath = prevPaths.get(d.id)
      const startPath =
        animate && anchor && toggle?.expanding && !prevPath
          ? collapsedPathAt(anchor)
          : (prevPath ?? path)

      pathEl
        .attr('fill', 'none')
        .attr('stroke', EDGE_COLOR)
        .attr('stroke-width', 1)
        .attr('marker-end', 'url(#equity-d3-arrow)')

      if (animate && startPath !== path) {
        pathEl
          .attr('d', startPath)
          .transition()
          .duration(duration)
          .ease(ease)
          .attrTween('d', () => d3.interpolateString(startPath, path))
      } else {
        pathEl.attr('d', path)
      }

      if (d.percent) {
        label
          .attr('text-anchor', 'middle')
          .attr('font-size', 11)
          .attr('fill', '#6b7280')
          .attr('font-weight', 500)
          .text(d.percent)

        if (animate) {
          const startLabelX =
            anchor && toggle?.expanding && !prevPath ? anchor.x : parseFloat(label.attr('x') || String(labelX))
          const startLabelY =
            anchor && toggle?.expanding && !prevPath
              ? anchor.y
              : parseFloat(label.attr('y') || String(labelY - 6))

          label
            .attr('x', startLabelX)
            .attr('y', startLabelY)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr('x', labelX)
            .attr('y', labelY - 6)
        } else {
          label.attr('x', labelX).attr('y', labelY - 6)
        }
      } else {
        label.text('')
      }
    })

    edgeEnter.transition().duration(duration).ease(ease).style('opacity', 1)
    edgeSelection.transition().duration(duration).ease(ease).style('opacity', 1)
  }

  function renderNodes(
    animate: boolean,
    prevPositions: Map<string, { x: number; y: number }>,
    toggle: ToggleContext | null,
  ) {
    const duration = animate ? TRANSITION_MS : 0
    const ease = d3.easeCubicInOut
    const anchor = toggle ? fullLayout.nodeById.get(toggle.nodeId) : undefined
    const anchorTransform = anchor ? nodeTransform(anchor) : null

    const nodeSelection = nodeLayer
      .selectAll<SVGGElement, LayoutNode>('g.equity-d3-node')
      .data(layout.nodes, (d) => d.id)

    nodeSelection.exit().each(function (this: SVGGElement) {
      const d = d3.select(this).datum() as LayoutNode
      const group = d3.select(this)
      const prev = prevPositions.get(d.id)
      const endTransform =
        animate && anchorTransform && toggle && !toggle.expanding
          ? anchorTransform
          : prev
            ? `translate(${prev.x - NODE_WIDTH / 2},${prev.y - NODE_HEIGHT / 2})`
            : nodeTransform(d)

      group
        .transition()
        .duration(duration)
        .ease(ease)
        .attr('transform', endTransform)
        .style('opacity', 0)
        .remove()
    })

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'equity-d3-node')
      .attr('transform', (d) => {
        if (animate && anchorTransform && toggle?.expanding) return anchorTransform
        const prev = prevPositions.get(d.id)
        if (prev) {
          return `translate(${prev.x - NODE_WIDTH / 2},${prev.y - NODE_HEIGHT / 2})`
        }
        return nodeTransform(d)
      })
      .style('opacity', animate ? 0 : 1)
      .style('cursor', 'default')

    nodeEnter.append('rect').attr('class', 'equity-d3-node__body')
    nodeEnter.append('text').attr('class', 'equity-d3-node__label')

    const nodeMerge = nodeEnter.merge(nodeSelection)

    if (animate) {
      nodeMerge
        .transition()
        .duration(duration)
        .ease(ease)
        .attr('transform', (d) => nodeTransform(d))
        .style('opacity', 1)
    } else {
      nodeMerge.attr('transform', (d) => nodeTransform(d)).style('opacity', 1)
    }

    nodeMerge.each(function (d) {
      const group = d3.select(this)
      const style = nodeStyle(d.data.type)

      group
        .select('rect.equity-d3-node__body')
        .attr('width', NODE_WIDTH)
        .attr('height', NODE_HEIGHT)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', style.fill)
        .attr('stroke', style.stroke)
        .attr('stroke-width', 1)

      const lines = formatLabelLines(d.data)
      const lineHeight = 18
      const totalHeight = lines.length * lineHeight
      const startY = NODE_HEIGHT / 2 - totalHeight / 2 + lineHeight * 0.72

      const text = group
        .select('text.equity-d3-node__label')
        .attr('x', NODE_WIDTH / 2)
        .attr('y', startY)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('font-weight', d.data.type === 'target' ? 600 : 500)
        .attr('fill', style.labelFill)
        .style('pointer-events', 'none')

      text.selectAll('tspan').remove()
      lines.forEach((line, index) => {
        text
          .append('tspan')
          .attr('x', NODE_WIDTH / 2)
          .attr('dy', index === 0 ? 0 : lineHeight)
          .text(line)
      })
    })

    nodeMerge
      .on('mouseenter', (_, d) => {
        if (!isAnimating) highlightNode(d.id)
      })
      .on('mouseleave', () => {
        if (!isAnimating) highlightNode(null)
      })
  }

  function refreshGraph(animate: boolean) {
    const prevPositions = snapshotNodePositions(
      nodeLayer.selectAll<SVGGElement, LayoutNode>('g.equity-d3-node'),
    )
    const prevPaths = snapshotEdgePaths(
      edgeLayer.selectAll<SVGGElement, LayoutEdge>('g.equity-d3-edge'),
    )
    const toggle = lastToggle

    const hidden = computeHiddenNodes(topo, collapsedUpstream, collapsedDownstream)
    layout = filterVisibleLayout(fullLayout, hidden)

    isAnimating = animate
    highlightNode(null)
    renderEdges(animate, prevPaths, toggle)
    renderNodes(animate, prevPositions, toggle)
    updateBadges()

    if (animate) {
      window.setTimeout(() => {
        isAnimating = false
      }, TRANSITION_MS)
    }

    lastToggle = null
  }

  function toggleUpstream(nodeId: string) {
    const expanding = collapsedUpstream.has(nodeId)
    if (expanding) collapsedUpstream.delete(nodeId)
    else collapsedUpstream.add(nodeId)
    lastToggle = { nodeId, direction: 'upstream', expanding }
    refreshGraph(true)
  }

  function toggleDownstream(nodeId: string) {
    const expanding = collapsedDownstream.has(nodeId)
    if (expanding) collapsedDownstream.delete(nodeId)
    else collapsedDownstream.add(nodeId)
    lastToggle = { nodeId, direction: 'downstream', expanding }
    refreshGraph(true)
  }

  function fitView(animate = false) {
    const availW = viewWidth - PADDING.left - PADDING.right
    const availH = viewHeight - PADDING.top - PADDING.bottom
    const scale = Math.min(availW / bounds.width, availH / bounds.height, 1.2)
    const cx = (bounds.minX + bounds.maxX) / 2
    const cy = (bounds.minY + bounds.maxY) / 2
    const tx = viewWidth / 2 - scale * cx
    const ty = viewHeight / 2 - scale * cy
    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale)

    if (animate) {
      svg.transition().duration(300).call(zoom.transform as never, transform)
    } else {
      svg.call(zoom.transform as never, transform)
    }
  }

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 3])
    .on('zoom', (event) => {
      root.attr('transform', event.transform.toString())
    })

  svg.call(zoom).on('dblclick.zoom', null)

  refreshGraph(false)
  fitView(false)

  function destroy() {
    stopAllAntAnimations()
    svg.remove()
  }

  function resize(nextWidth?: number, nextHeight?: number) {
    viewWidth = nextWidth ?? container.clientWidth
    viewHeight = nextHeight ?? container.clientHeight
    svg.attr('width', viewWidth).attr('height', viewHeight)
    fitView(false)
  }

  function reset() {
    collapsedUpstream.clear()
    collapsedDownstream.clear()
    refreshGraph(false)
    fitView(true)
  }

  function expandAll() {
    collapsedUpstream.clear()
    collapsedDownstream.clear()
    refreshGraph(true)
  }

  function collapseAll() {
    collapsedUpstream.clear()
    collapsedDownstream.clear()

    for (const node of data.nodes) {
      if (hasUpstreamBranch(node.id)) collapsedUpstream.add(node.id)
      if (hasDownstreamBranch(node.id)) collapsedDownstream.add(node.id)
    }

    refreshGraph(true)
  }

  return { destroy, resize, reset, expandAll, collapseAll }
}

export async function resetD3EquityGraph(graph: D3EquityGraph, _data: EquityGraphData) {
  graph.reset()
}

export function expandAllD3EquityNodes(graph: D3EquityGraph) {
  graph.expandAll()
}

export function collapseAllD3EquityNodes(graph: D3EquityGraph) {
  graph.collapseAll()
}

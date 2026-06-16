import type { EquityGraphData } from './equityData'

export interface EquityGraphTopology {
  shareholderParents: Map<string, string[]>
  investmentChildren: Map<string, string[]>
}

export function buildEquityTopology(data: EquityGraphData): EquityGraphTopology {
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

function collectUpstream(topo: EquityGraphTopology, nodeId: string): Set<string> {
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

function collectDownstream(topo: EquityGraphTopology, nodeId: string): Set<string> {
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

export function computeEquityHiddenNodes(
  topo: EquityGraphTopology,
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

export function hasUpstreamBranch(topo: EquityGraphTopology, nodeId: string) {
  return (topo.shareholderParents.get(nodeId)?.length ?? 0) > 0
}

export function hasDownstreamBranch(topo: EquityGraphTopology, nodeId: string) {
  return (topo.investmentChildren.get(nodeId)?.length ?? 0) > 0
}

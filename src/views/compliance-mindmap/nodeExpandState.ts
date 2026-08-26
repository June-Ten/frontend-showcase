const expandedNodeIds = new Set<string>()

export function isNodeExpanded(id: string) {
  return expandedNodeIds.has(id)
}

export function toggleNodeExpanded(id: string) {
  if (expandedNodeIds.has(id)) expandedNodeIds.delete(id)
  else expandedNodeIds.add(id)
  return expandedNodeIds.has(id)
}

export function clearExpandedNodes() {
  expandedNodeIds.clear()
}

import { ExtensionCategory, Polyline, register, type Point } from '@antv/g6'

const EDGE_TYPE = 'g6-test-tree-polyline'

/** 竖 → 横 → 竖，控制点仅由端点决定，折叠/展开时路径平滑跟随 */
function treeOrthControlPoints(source: Point, target: Point): Point[] {
  const midY = (source[1] + target[1]) / 2
  return [
    [source[0], midY],
    [target[0], midY],
  ]
}

class G6TestTreePolyline extends Polyline {
  getControlPoints(attributes: Parameters<Polyline['getControlPoints']>[0]) {
    const [source, target] = this.getEndpoints(attributes, false)
    return treeOrthControlPoints(source, target)
  }
}

let registered = false

export function registerG6TestTreePolyline() {
  if (registered) return
  register(ExtensionCategory.EDGE, EDGE_TYPE, G6TestTreePolyline)
  registered = true
}

export { EDGE_TYPE as G6_TEST_TREE_POLYLINE_TYPE }

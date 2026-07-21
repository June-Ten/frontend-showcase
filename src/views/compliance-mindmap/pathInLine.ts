import { CubicHorizontal, ExtensionCategory, register } from '@antv/g6'

/** 连线生长动画时长（毫秒） */
export const EDGE_GROW_DURATION_MS = 1200

const EDGE_DASH: [number, number] = [4, 4]

interface GrowablePath {
  getTotalLength(): number
  attr(name: string, value: unknown): void
  animate(
    keyframes: Array<Record<string, unknown>>,
    options: { duration: number; easing: string; fill: string },
  ): { finished: Promise<unknown> } | null
}

class PathInLine extends CubicHorizontal {
  onCreate(): void {
    const shape = this.getShape('key') as unknown as GrowablePath
    const length = shape.getTotalLength()
    if (!length) return

    shape.attr('lineDash', [0, length])

    const animation = shape.animate(
      [{ lineDash: [0, length] }, { lineDash: [length, 0] }],
      {
        duration: EDGE_GROW_DURATION_MS,
        easing: 'ease-out',
        fill: 'both',
      },
    )

    void animation?.finished.then(() => {
      shape.attr('lineDash', EDGE_DASH)
    })
  }
}

let pathInLineRegistered = false

export function registerPathInLineEdge() {
  if (pathInLineRegistered) return
  register(ExtensionCategory.EDGE, 'path-in-line', PathInLine)
  pathInLineRegistered = true
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.svg' {
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.json' {
  const value: unknown
  export default value
}

declare module '*.glb?url' {
  const src: string
  export default src
}

declare module 'pdfh5' {
  interface Pdfh5Options {
    pdfurl?: string
    data?: ArrayBuffer
    workerSrc?: string
    cMapUrl?: string
    standardFontDataUrl?: string
    iccUrl?: string
    wasmUrl?: string
    backTop?: boolean
    scale?: number
    zoomEnable?: boolean
    textLayer?: boolean
  }

  class Pdfh5 {
    constructor(container: HTMLElement, options?: Pdfh5Options)
    totalNum: number
    on(event: string, callback: (...args: unknown[]) => void): void
    destroy(): void
  }

  export default Pdfh5
}

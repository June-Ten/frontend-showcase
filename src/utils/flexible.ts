const DESIGN_WIDTH = 1920
const MOBILE_DESIGN_WIDTH = 375
const MOBILE_BREAKPOINT = 768
const BASE_FONT_SIZE = 16
const MIN_FONT_SIZE = 12
const MOBILE_MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 16

function setRootFontSize() {
  const clientWidth = document.documentElement.clientWidth || window.innerWidth
  const isMobile = clientWidth < MOBILE_BREAKPOINT
  const designWidth = isMobile ? MOBILE_DESIGN_WIDTH : DESIGN_WIDTH
  const minFontSize = isMobile ? MOBILE_MIN_FONT_SIZE : MIN_FONT_SIZE

  const fontSize = Math.min(
    MAX_FONT_SIZE,
    Math.max(minFontSize, (clientWidth / designWidth) * BASE_FONT_SIZE),
  )
  document.documentElement.style.fontSize = `${fontSize}px`
}

export function initFlexible() {
  setRootFontSize()
  window.addEventListener('resize', setRootFontSize)

  return () => {
    window.removeEventListener('resize', setRootFontSize)
  }
}

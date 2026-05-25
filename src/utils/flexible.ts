const DESIGN_WIDTH = 1920
const BASE_FONT_SIZE = 16
const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 16

function setRootFontSize() {
  const clientWidth = document.documentElement.clientWidth || window.innerWidth
  const fontSize = Math.min(
    MAX_FONT_SIZE,
    Math.max(MIN_FONT_SIZE, (clientWidth / DESIGN_WIDTH) * BASE_FONT_SIZE),
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

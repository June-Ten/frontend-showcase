export function getFontSize(res: number) {
  const clientWidth =
    window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1920
  return res * 100 * (clientWidth / 1920)
}

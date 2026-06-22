import { onMounted, onUnmounted, type Ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useCorporateAnimations(root: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | undefined
  let mm: gsap.MatchMedia | undefined

  onMounted(() => {
    if (!root.value) return

    mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      ctx = gsap.context(() => {
        initHeaderAnimation()
        initHomeAnimation()
      }, root.value!)
    })
  })

  onUnmounted(() => {
    ctx?.revert()
    mm?.revert()
  })

  function initHeaderAnimation() {
    gsap.from('.corp-header', {
      y: -80,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    })

    gsap.from('.corp-nav__link', {
      y: -12,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      delay: 0.2,
      ease: 'power2.out',
    })
  }

  function initHomeAnimation() {
    const home = root.value?.querySelector('.corp-home')
    if (!home) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.corp-home__title', { y: 48, opacity: 0, duration: 0.85 })
      .from('.corp-home__divider', { scaleX: 0, opacity: 0, duration: 0.5 }, '-=0.5')
      .from('.corp-home__desc', { y: 28, opacity: 0, duration: 0.65 }, '-=0.35')
      .from('.corp-home__content .corp-btn', { y: 24, opacity: 0, duration: 0.5 }, '-=0.35')

    gsap.from('.corp-value-item', {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power2.out',
      delay: 0.5,
    })

    gsap.to('.corp-home__arc--1', {
      rotate: 8,
      scale: 1.05,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    gsap.to('.corp-home__arc--2', {
      rotate: -6,
      scale: 1.08,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }
}

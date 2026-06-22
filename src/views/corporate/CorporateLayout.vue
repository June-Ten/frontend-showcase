<template>
    <div ref="corpRoot" class="corp">
    <header
      class="corp-header"
      :class="{
        'corp-header--scrolled': scrolled || !isHome,
        'corp-header--menu-open': menuOpen,
        'corp-header--inner': !isHome,
      }"
    >
      <div class="corp-header__inner">
        <RouterLink to="/corporate" class="corp-logo" @click="menuOpen = false">
          <span class="corp-logo__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 2L28 9.5V22.5L16 30L4 22.5V9.5L16 2Z"
                stroke="currentColor"
                stroke-width="1.5"
                fill="rgba(255,255,255,0.12)"
              />
              <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="currentColor" opacity="0.9" />
            </svg>
          </span>
          <span class="corp-logo__text-group">
            <span class="corp-logo__text">智远科技</span>
            <span class="corp-logo__tagline">创新驱动未来</span>
          </span>
        </RouterLink>
        <nav class="corp-nav" aria-label="主导航">
          <RouterLink
            v-for="item in corporateNavItems"
            :key="item.path"
            :to="item.path"
            class="corp-nav__link"
            :class="{ 'corp-nav__link--active': isActive(item.path) }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="corp-header__actions">
          <button type="button" class="corp-header__lang" aria-label="切换语言">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.2" />
              <path
                d="M2 10h16M10 2c2.5 2.8 4 6 4 8s-1.5 5.2-4 8M10 2C7.5 4.8 6 8 6 10s1.5 5.2 4 8"
                stroke="currentColor"
                stroke-width="1.2"
              />
            </svg>
            EN
          </button>
          <button
            type="button"
            class="corp-header__menu"
            aria-label="打开菜单"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      <nav v-show="menuOpen" class="corp-mobile-nav" aria-label="移动端导航">
        <RouterLink
          v-for="item in corporateNavItems"
          :key="item.path"
          :to="item.path"
          class="corp-mobile-nav__link"
          :class="{ 'corp-mobile-nav__link--active': isActive(item.path) }"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <main class="corp-main" :class="{ 'corp-main--home': isHome }">
      <RouterView />
    </main>

    <footer class="corp-footer">
      <div class="corp-container corp-footer__inner">
        <div class="corp-footer__brand">
          <RouterLink to="/corporate" class="corp-logo corp-logo--footer">
            <span class="corp-logo__mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 2L28 9.5V22.5L16 30L4 22.5V9.5L16 2Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="rgba(37,99,235,0.1)"
                />
                <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="currentColor" opacity="0.9" />
              </svg>
            </span>
            <span class="corp-logo__text-group">
              <span class="corp-logo__text">智远科技</span>
              <span class="corp-logo__tagline">创新驱动未来</span>
            </span>
          </RouterLink>
          <p class="corp-footer__tagline">科技赋能，智创未来</p>
        </div>
        <div class="corp-footer__links">
          <div v-for="group in footerLinks" :key="group.title" class="corp-footer__group">
            <h4 class="corp-footer__group-title">{{ group.title }}</h4>
            <a
              v-for="link in group.links"
              :key="link"
              href="#"
              class="corp-footer__link"
              @click.prevent
            >
              {{ link }}
            </a>
          </div>
        </div>
      </div>
      <div class="corp-footer__bottom">
        <div class="corp-container corp-footer__bottom-inner">
          <p>© {{ year }} 智远科技有限公司 版权所有</p>
          <p>沪ICP备12345678号</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { corporateNavItems, footerLinks } from './corporateNav'
import { useCorporateAnimations } from './useCorporateAnimations'

const route = useRoute()
const corpRoot = ref<HTMLElement | null>(null)
useCorporateAnimations(corpRoot)
const scrolled = ref(false)
const menuOpen = ref(false)
const year = new Date().getFullYear()

const isHome = computed(() => route.path === '/corporate' || route.path === '/corporate/')

function isActive(path: string) {
  if (path === '/corporate') {
    return route.path === '/corporate' || route.path === '/corporate/'
  }
  return route.path === path
}

function handleScroll() {
  scrolled.value = window.scrollY > 60
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

watch(
  () => route.path,
  () => {
    menuOpen.value = false
    window.scrollTo({ top: 0 })
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" src="./corporate.scss"></style>

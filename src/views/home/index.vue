<template>
  <div class="devworks">
    <header class="nav">
      <a href="/" class="nav__logo">
        <span class="nav__logo-dot" aria-hidden="true" />
        DevWorks
      </a>
      <nav class="nav__links" aria-label="主导航">
        <a
          v-for="item in navItems"
          :key="item.label"
          :href="item.href"
          class="nav__link"
          :class="{ 'nav__link--active': item.active }"
        >
          {{ item.label }}
          <span v-if="item.active" class="nav__link-dot" aria-hidden="true" />
        </a>
      </nav>
      <div class="nav__actions">
        <button type="button" class="nav__icon-btn" aria-label="切换主题">
          <AppIcon name="theme-moon" />
        </button>
        <a
          href="https://github.com/June-Ten"
          target="_blank"
          rel="noopener noreferrer"
          class="nav__icon-btn"
          aria-label="GitHub"
        >
          <AppIcon name="github" />
        </a>
      </div>
    </header>

    <main class="main">
      <section class="hero">
        <div class="hero__content">
          <h1 class="hero__title">
            <span ref="typedTitleRef" class="hero__typed" aria-live="polite" />
          </h1>
          <p class="hero__subtitle">
            <span ref="typedSubtitleRef" class="hero__typed" aria-live="polite" />
          </p>
          <a href="#projects" class="hero__cta">
            Explore Projects
            <AppIcon name="arrow-right" :size="18" />
          </a>
          <div class="hero__social">
            <a
              href="https://github.com/June-Ten"
              aria-label="GitHub"
              class="hero__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AppIcon name="github" />
            </a>
            <a href="#" aria-label="Website" class="hero__social-link">
              <AppIcon name="globe" />
            </a>
            <a href="#" aria-label="LinkedIn" class="hero__social-link">
              <AppIcon name="linkedin" />
            </a>
            <a href="mailto:891696668@qq.com" aria-label="Email" class="hero__social-link">
              <AppIcon name="email" />
            </a>
          </div>
        </div>
        <div class="hero__visual" role="img" aria-label="工作台场景" />
      </section>

      <section id="projects" class="featured">
        <div class="featured__header">
          <h2 class="featured__title">
            精选项目
            <span class="featured__title-dot" aria-hidden="true" />
          </h2>
          <a href="#" class="featured__more">
            查看全部项目
            <AppIcon name="arrow-right" :size="16" />
          </a>
        </div>
        <div class="featured__grid">
          <component
            :is="project.href ? 'RouterLink' : 'article'"
            v-for="project in projects"
            :key="project.title"
            v-bind="project.href ? { to: project.href } : {}"
            class="project-card"
          >
            <div
              class="project-card__thumb"
              :class="{ 'project-card__thumb--equity': project.thumbType === 'equity' }"
              :style="project.thumbGradient ? { background: project.thumbGradient } : undefined"
            >
              <img
                v-if="project.thumbType === 'equity'"
                class="project-card__equity-cover"
                :src="equityCoverImg"
                alt=""
              />
            </div>
            <h3 class="project-card__title">{{ project.title }}</h3>
            <p class="project-card__desc">{{ project.description }}</p>
            <div class="project-card__tags">
              <span v-for="tag in project.tags" :key="tag" class="project-card__tag">
                {{ tag }}
              </span>
            </div>
            <span class="project-card__arrow" aria-hidden="true">
              <AppIcon name="arrow-right-sm" :size="18" />
            </span>
          </component>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Typed from 'typed.js'
import AppIcon from '../../components/AppIcon.vue'
import deskImg from '../../assets/img/desk.png'
import equityCoverImg from '../../assets/img/equity_cover.png'

const deskBackground = `url(${deskImg})`

const typedTitleRef = ref<HTMLElement | null>(null)
const typedSubtitleRef = ref<HTMLElement | null>(null)

let typedTitle: Typed | null = null
let typedSubtitle: Typed | null = null

onMounted(() => {
  if (typedTitleRef.value) {
    typedTitle = new Typed(typedTitleRef.value, {
      strings: [
        'Welcome to<br><span class="hero__title-gradient">my website</span>',
        'Welcome to<br><span class="hero__title-gradient">my portfolio</span>',
        'Welcome to<br><span class="hero__title-gradient">DevWorks</span>',
      ],
      typeSpeed: 45,
      backSpeed: 28,
      backDelay: 2200,
      startDelay: 400,
      loop: true,
      smartBackspace: true,
      contentType: 'html',
      showCursor: true,
      cursorChar: '|',
    })
  }

  if (typedSubtitleRef.value) {
    typedSubtitle = new Typed(typedSubtitleRef.value, {
      strings: [
        'Exploring the tech world and crafting elegant, functional web experiences.',
        'Turning ideas into clean, modern web interfaces.',
        'Building with Vue, TypeScript, and thoughtful design.',
      ],
      typeSpeed: 32,
      backSpeed: 20,
      backDelay: 2800,
      startDelay: 900,
      loop: true,
      smartBackspace: true,
      showCursor: false,
    })
  }
})

onBeforeUnmount(() => {
  typedTitle?.destroy()
  typedSubtitle?.destroy()
})

const navItems = [
  { label: '首页', href: '/', active: true },
  { label: '项目', href: '#projects', active: false },
  { label: '数据大屏', href: '/visualization', active: false },
  { label: '实验室', href: '#', active: false },
  { label: '设计与灵感', href: '#', active: false },
]

const projects = [
  {
    title: '股权穿透图',
    description: '企业股权结构可视化，支持多层穿透与交互展开',
    tags: ['Vue3', 'G6', 'Tree'],
    thumbType: 'equity' as const,
    href: '/equity',
  },
  {
    title: '数据可视化平台',
    description: '基于 Vue3 + ECharts 的数据可视化解决方案',
    tags: ['Vue3', 'TypeScript', 'ECharts'],
    thumbGradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #312e81 100%)',
  },
  {
    title: '企业官网设计',
    description: '简洁现代的企业官网设计与实现',
    tags: ['React', 'TailwindCSS'],
    thumbGradient: 'linear-gradient(135deg, #134e4a 0%, #0f172a 50%, #1e3a5f 100%)',
  },
  {
    title: '待办事项应用',
    description: '高效的任务管理应用，专注用户体验',
    tags: ['Vue3', 'Pinia', 'Vite'],
    thumbGradient: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 50%, #312e81 100%)',
  },
  {
    title: '电商商城',
    description: '完整的电商购物平台前端实现',
    tags: ['Next.js', 'MongoDB'],
    thumbGradient: 'linear-gradient(135deg, #431407 0%, #1c1917 50%, #292524 100%)',
  },
]

</script>

<style lang="scss" scoped>
$bg: #050505;
$card-bg: #121212;
$text: #ffffff;
$text-muted: #9ca3af;
$accent: #6366f1;
$accent-end: #a855f7;
$gradient: linear-gradient(90deg, $accent 0%, $accent-end 100%);
$container: 1400px;

.devworks {
  min-height: 100vh;
  background: $bg;
  color: $text;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.main {
  max-width: $container;
  margin: 0 auto;
  padding: 0 48px 80px;
}

// —— Nav ——
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: $container;
  margin: 0 auto;
  padding: 24px 48px;
  height: 72px;
}

.nav__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: $text;
  text-decoration: none;
  letter-spacing: -0.02em;
}

.nav__logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $accent;
  flex-shrink: 0;
}

.nav__links {
  display: flex;
  align-items: center;
  gap: 40px;
}

.nav__link {
  position: relative;
  font-size: 15px;
  color: $text-muted;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $text;
  }

  &--active {
    color: $accent;
  }
}

.nav__link-dot {
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: $accent;
}

.nav__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: $text-muted;
  cursor: pointer;
  text-decoration: none;
  transition:
    color 0.2s,
    background 0.2s;

  &:hover {
    color: $text;
    background: rgba(255, 255, 255, 0.06);
  }
}

// —— Hero ——
.hero {
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: 20px;
  min-height: 620px;
  padding: 48px 0 64px;
  margin-right: -48px;
}

.hero__content {
  flex: 0 0 auto;
  width: min(100%, 460px);
  max-width: 460px;
  align-self: center;
}

.hero__title {
  margin: 0 0 24px;
  font-size: 56px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: $text;
  min-height: 2.3em;
}

.hero__typed {
  display: inline-block;
  vertical-align: top;
}

.hero__title :deep(.hero__title-gradient) {
  display: block;
  background: $gradient;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero__title :deep(.typed-cursor) {
  font-weight: 300;
  color: $accent;
  opacity: 1;
  animation: typed-blink 0.7s infinite;
}

@keyframes typed-blink {
  50% {
    opacity: 0;
  }
}

.hero__subtitle {
  margin: 0 0 36px;
  font-size: 16px;
  line-height: 1.7;
  color: $text-muted;
  max-width: 420px;
  min-height: 3.4em;
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 999px;
  background: $gradient;
  color: $text;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition:
    opacity 0.2s,
    transform 0.2s;
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.35);

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
}

.hero__social {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
}

.hero__social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-muted;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $text;
  }
}

.hero__visual {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 520px;
  height: clamp(480px, 42vw, 620px);
  background-image: v-bind(deskBackground);
  background-repeat: no-repeat;
  background-position: right center;
  background-size: contain;
}

// —— Featured ——
.featured {
  margin-top: 24px;
}

.featured__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.featured__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.featured__title-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $accent;
}

.featured__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: $text-muted;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $text;
  }
}

.featured__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.project-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: $card-bg;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.2s,
    transform 0.2s;
  cursor: pointer;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);

    .project-card__arrow {
      opacity: 1;
      color: $accent;
    }
  }
}

.project-card__thumb {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 10px;
  margin-bottom: 16px;

  &--equity {
    overflow: hidden;
    background: #f3f4f6;
  }
}

.project-card__equity-cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-card__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: $text;
}

.project-card__desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.55;
  color: $text-muted;
  flex: 1;
}

.project-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-card__tag {
  padding: 4px 10px;
  font-size: 12px;
  color: $text-muted;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
}

.project-card__arrow {
  position: absolute;
  right: 16px;
  bottom: 16px;
  opacity: 0.4;
  color: $text-muted;
  transition:
    opacity 0.2s,
    color 0.2s;

}

@media (max-width: 1200px) {
  .featured__grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    min-height: auto;
    margin-right: 0;
    gap: 24px;
  }

  .hero__content {
    max-width: 100%;
  }

  .hero__subtitle {
    margin-left: auto;
    margin-right: auto;
  }

  .hero__social {
    justify-content: center;
  }

  .hero__visual {
    width: 100%;
    min-height: 420px;
    height: clamp(380px, 52vh, 540px);
  }

  .nav__links {
    display: none;
  }
}

@media (max-width: 640px) {
  .main,
  .nav {
    padding-left: 20px;
    padding-right: 20px;
  }

  .hero__title {
    font-size: 36px;
  }

  .hero__visual {
    min-height: 360px;
    height: clamp(340px, 50vh, 480px);
  }

  .featured__grid {
    grid-template-columns: 1fr;
  }
}
</style>

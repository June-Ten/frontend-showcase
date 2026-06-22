<template>
  <section class="corp-home">
    <div class="corp-home__bg" aria-hidden="true">
      <div class="corp-home__bg-image" />
      <div class="corp-home__bg-overlay" />
      <div class="corp-home__arc corp-home__arc--1" />
      <div class="corp-home__arc corp-home__arc--2" />
    </div>
    <div class="corp-container corp-home__inner">
      <div class="corp-home__content">
        <h1 class="corp-home__title">
          创新驱动未来
          <span class="corp-home__title-line">科技引领世界</span>
        </h1>
        <div class="corp-home__divider" aria-hidden="true" />
        <p class="corp-home__desc">
          我们致力于通过技术创新与卓越服务<br />
          为客户创造价值，为社会创造美好未来
        </p>
        <RouterLink to="/corporate/about" class="corp-btn corp-btn--primary">
          了解更多
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 10h12M12 6l4 4-4 4"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </RouterLink>
      </div>
    </div>
    <div class="corp-container corp-home__values-wrap">
      <div class="corp-home__values">
        <div
          v-for="(item, index) in valueProps"
          :key="item.title"
          class="corp-value-item"
          :class="{ 'corp-value-item--bordered': index > 0 }"
        >
          <div class="corp-value-item__icon" aria-hidden="true" v-html="item.icon" />
          <div class="corp-value-item__text">
            <h3 class="corp-value-item__title">{{ item.title }}</h3>
            <p class="corp-value-item__desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import heroCoverImg from '../../../assets/img/official_website_cover_bg.png'

const heroBackground = `url(${heroCoverImg})`

const valueProps = [
  {
    title: '创新',
    desc: '持续创新，追求卓越',
    icon: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 4l2.5 7.5H26l-6 4.5 2.5 7.5L16 19l-6.5 4.5 2.5-7.5-6-4.5h7.5L16 4z" stroke="#0078d4" stroke-width="1.5" fill="rgba(0,120,212,0.1)"/></svg>`,
  },
  {
    title: '品质',
    desc: '精益求精，品质至上',
    icon: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 4l10 4v8c0 6.5-4.5 10.5-10 12-5.5-1.5-10-5.5-10-12V8l10-4z" stroke="#0078d4" stroke-width="1.5"/><path d="M11 16l3 3 7-7" stroke="#0078d4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    title: '合作',
    desc: '开放合作，共赢未来',
    icon: `<svg viewBox="0 0 32 32" fill="none"><circle cx="12" cy="11" r="4" stroke="#0078d4" stroke-width="1.5"/><circle cx="20" cy="11" r="4" stroke="#0078d4" stroke-width="1.5"/><path d="M6 26c0-4 2.7-7 6-7s6 3 6 7M14 26c0-4 2.7-7 6-7s6 3 6 7" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    title: '责任',
    desc: '回馈社会，成就价值',
    icon: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="11" stroke="#0078d4" stroke-width="1.5"/><path d="M16 5c-3 4-5 8-5 11a5 5 0 0010 0c0-3-2-7-5-11z" stroke="#0078d4" stroke-width="1.5"/><path d="M8 16h16" stroke="#0078d4" stroke-width="1.2"/></svg>`,
  },
]
</script>

<style lang="scss" scoped>
@use '../corporate.scss' as *;

.corp-home {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 100px 0 0;
  overflow: hidden;
}

.corp-home__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corp-home__bg-image {
  position: absolute;
  inset: 0;
  background-image: v-bind(heroBackground);
  background-size: cover;
  background-position: center 35%;
  background-repeat: no-repeat;
}

.corp-home__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(240, 248, 255, 0.35) 42%,
    rgba(200, 230, 255, 0.1) 68%,
    transparent 100%
  );
}

.corp-home__arc {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  opacity: 0.5;

  &--1 {
    width: 600px;
    height: 600px;
    top: -120px;
    right: -80px;
  }

  &--2 {
    width: 480px;
    height: 480px;
    top: 40px;
    right: 60px;
    opacity: 0.3;
  }
}

.corp-home__inner {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  align-self: stretch;
  width: 100%;
  padding: 40px 24px 180px;
}

.corp-home__content {
  max-width: 560px;
  text-align: left;
}

.corp-home__title {
  margin: 0 0 16px;
  font-size: clamp(36px, 5vw, 52px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: $corp-blue-text;
}

.corp-home__title-line {
  display: block;
}

.corp-home__divider {
  width: 56px;
  height: 4px;
  margin-bottom: 24px;
  background: $corp-blue;
  border-radius: 2px;
}

.corp-home__desc {
  margin: 0 0 36px;
  font-size: clamp(15px, 2vw, 18px);
  line-height: 1.85;
  color: rgba(15, 61, 110, 0.82);
}

.corp-home__values-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 48px;
  z-index: 2;
}

.corp-home__values {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  @include corp-glass-light(14px, rgba(255, 255, 255, 0.78));
  border-radius: 12px;
  overflow: hidden;
}

.corp-value-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;

  &--bordered {
    border-left: 1px solid rgba(0, 120, 212, 0.1);
  }
}

.corp-value-item__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.corp-value-item__title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: $corp-blue-text;
}

.corp-value-item__desc {
  margin: 0;
  font-size: 13px;
  color: $corp-text-muted;
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .corp-home__values {
    grid-template-columns: repeat(2, 1fr);
  }

  .corp-value-item--bordered {
    border-left: none;
  }

  .corp-value-item:nth-child(odd) {
    border-right: 1px solid rgba(0, 120, 212, 0.1);
  }

  .corp-value-item:nth-child(-n + 2) {
    border-bottom: 1px solid rgba(0, 120, 212, 0.1);
  }
}

@media (max-width: 1024px) {
  .corp-home__inner {
    padding-bottom: 280px;
  }
}

@media (max-width: 640px) {
  .corp-home__values {
    grid-template-columns: 1fr;
  }

  .corp-value-item {
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid rgba(0, 120, 212, 0.1);

    &:last-child {
      border-bottom: none;
    }
  }

  .corp-home__inner {
    padding-bottom: 420px;
  }

  .corp-home__values-wrap {
    bottom: 24px;
  }
}
</style>

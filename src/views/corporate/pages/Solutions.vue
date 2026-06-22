<template>
  <div>
    <section class="corp-page-banner corp-page-banner--tall">
      <div
        class="corp-page-banner__bg"
        :style="{ backgroundImage: `url(${coverImg})` }"
      />
      <div
        class="corp-page-banner__overlay"
        style="background: linear-gradient(135deg, rgba(8, 40, 100, 0.88) 0%, rgba(0, 100, 200, 0.6) 100%)"
      />
      <div class="corp-container corp-page-banner__content">
        <h1 class="corp-page-banner__title">解决方案</h1>
        <p class="corp-page-banner__subtitle">
          行业深耕，场景化解决方案，助力企业数字化转型
        </p>
      </div>
    </section>

    <section class="solutions-page">
      <div class="corp-container">
        <div class="solutions-page__grid">
          <article v-for="item in solutions" :key="item.title" class="solution-card">
            <div class="solution-card__thumb" :style="{ background: item.gradient }">
              <span class="solution-card__thumb-label">{{ item.industry }}</span>
            </div>
            <div class="solution-card__body">
              <div class="solution-card__icon" aria-hidden="true" v-html="item.icon" />
              <h3 class="solution-card__title">{{ item.title }}</h3>
              <p class="solution-card__desc">{{ item.desc }}</p>
            </div>
          </article>
        </div>
        <div class="solutions-page__cta">
          <RouterLink to="/corporate/contact" class="corp-btn corp-btn--primary">
            了解更多解决方案
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import coverImg from '../../../assets/img/official_website_cover_bg.png'

const solutions = [
  {
    industry: '金融',
    title: '金融行业',
    desc: '为银行、保险、证券等机构提供核心系统升级、风控与智能投顾解决方案。',
    gradient: 'linear-gradient(180deg, #0c2d5e 0%, #1e5a9e 100%)',
    icon: `<svg viewBox="0 0 32 32" fill="none"><path d="M6 26V14l10-8 10 8v12" stroke="#0078d4" stroke-width="1.5"/><path d="M12 26v-8h8v8" stroke="#0078d4" stroke-width="1.5"/></svg>`,
  },
  {
    industry: '制造',
    title: '制造行业',
    desc: '工业互联网平台、智能工厂与供应链数字化，实现生产全流程可视化调度。',
    gradient: 'linear-gradient(180deg, #1a365d 0%, #2b6cb0 100%)',
    icon: `<svg viewBox="0 0 32 32" fill="none"><rect x="6" y="14" width="20" height="12" rx="1" stroke="#0078d4" stroke-width="1.5"/><path d="M10 14V10h4v4M18 14V8h4v6" stroke="#0078d4" stroke-width="1.5"/><path d="M6 20h20" stroke="#0078d4" stroke-width="1.5"/></svg>`,
  },
  {
    industry: '政务',
    title: '政务行业',
    desc: '数字政府、智慧城市与政务云平台，提升公共服务效率与治理现代化水平。',
    gradient: 'linear-gradient(180deg, #0f2942 0%, #2563a8 100%)',
    icon: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 4l12 6v4H4v-4l12-6z" stroke="#0078d4" stroke-width="1.5"/><rect x="8" y="14" width="16" height="14" stroke="#0078d4" stroke-width="1.5"/><path d="M14 22h4" stroke="#0078d4" stroke-width="1.5"/></svg>`,
  },
  {
    industry: '医疗',
    title: '医疗行业',
    desc: '智慧医院、电子病历与医疗大数据平台，助力医疗健康产业数字化升级。',
    gradient: 'linear-gradient(180deg, #134e6f 0%, #38a3c9 100%)',
    icon: `<svg viewBox="0 0 32 32" fill="none"><rect x="8" y="8" width="16" height="20" rx="2" stroke="#0078d4" stroke-width="1.5"/><path d="M16 12v8M12 16h8" stroke="#0078d4" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
]
</script>

<style lang="scss" scoped>
@use '../corporate.scss' as *;

.solutions-page {
  padding: 80px 0 100px;
  background: $corp-bg-page;
}

.solutions-page__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.solution-card {
  border-radius: 14px;
  overflow: hidden;
  background: $corp-bg-white;
  box-shadow: 0 8px 32px rgba(0, 60, 120, 0.08);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
}

.solution-card__thumb {
  position: relative;
  height: 160px;
  display: flex;
  align-items: flex-end;
  padding: 16px;
}

.solution-card__thumb-label {
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.solution-card__body {
  padding: 24px 20px 28px;
}

.solution-card__icon {
  width: 36px;
  height: 36px;
  margin-bottom: 12px;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.solution-card__title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: $corp-blue-text;
}

.solution-card__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: $corp-text-muted;
}

.solutions-page__cta {
  display: flex;
  justify-content: center;
  margin-top: 56px;
}

@media (max-width: 1024px) {
  .solutions-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .solutions-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>

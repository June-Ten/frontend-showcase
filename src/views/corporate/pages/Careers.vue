<template>
  <div>
    <section class="corp-page-banner corp-page-banner--tall careers-hero">
      <div
        class="corp-page-banner__bg careers-hero__bg"
        :style="{ backgroundImage: `url(${coverImg})` }"
      />
      <div class="corp-page-banner__overlay careers-hero__overlay" />
      <div class="corp-container corp-page-banner__content">
        <h1 class="corp-page-banner__title">加入我们</h1>
        <p class="corp-page-banner__subtitle">加入我们，共创未来，成就无限可能</p>
      </div>
      <div class="corp-page-banner__wave" aria-hidden="true" />
    </section>

    <section class="careers-benefits">
      <div class="corp-container">
        <div class="careers-benefits__grid">
          <div v-for="item in benefits" :key="item.title" class="careers-benefit">
            <div class="careers-benefit__icon" aria-hidden="true" v-html="item.icon" />
            <h3 class="careers-benefit__title">{{ item.title }}</h3>
            <p class="careers-benefit__desc">{{ item.desc }}</p>
          </div>
        </div>
        <div class="careers-benefits__cta">
          <RouterLink to="/corporate/contact" class="corp-btn corp-btn--primary">
            查看职位
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

    <section class="careers-positions">
      <div class="corp-container">
        <h2 class="corp-section-title careers-positions__title">热招职位</h2>
        <div class="careers-positions__list">
          <article v-for="job in jobs" :key="job.title" class="job-card">
            <div class="job-card__info">
              <h3 class="job-card__title">{{ job.title }}</h3>
              <p class="job-card__meta">{{ job.dept }} · {{ job.location }}</p>
            </div>
            <span class="job-card__type">{{ job.type }}</span>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import coverImg from '../../../assets/img/official_website_cover_bg.webp'

const benefits = [
  {
    title: '广阔的发展空间',
    desc: '完善的晋升通道与培训体系，助力职业成长',
    icon: `<svg viewBox="0 0 32 32" fill="none"><path d="M6 26V12l10-6 10 6v14" stroke="#0078d4" stroke-width="1.5"/><path d="M12 26v-8h8v8" stroke="#0078d4" stroke-width="1.5"/><path d="M16 8v6" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    title: '有竞争力的薪酬',
    desc: '行业领先的薪资福利与绩效激励方案',
    icon: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" stroke="#0078d4" stroke-width="1.5"/><path d="M16 10v2M16 20v2M12 14h6a2 2 0 010 4h-4a2 2 0 000 4h6" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    title: '多元化的团队',
    desc: '开放包容的工作氛围，与全球优秀人才协作',
    icon: `<svg viewBox="0 0 32 32" fill="none"><circle cx="11" cy="11" r="3.5" stroke="#0078d4" stroke-width="1.5"/><circle cx="21" cy="11" r="3.5" stroke="#0078d4" stroke-width="1.5"/><path d="M5 24c0-3.3 2.7-6 6-6s6 2.7 6 6M15 24c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    title: '完善的福利体系',
    desc: '五险一金、带薪年假、健康体检等全方位保障',
    icon: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 4l9 4v7c0 5.5-3.8 9.5-9 11-5.2-1.5-9-5.5-9-11V8l9-4z" stroke="#0078d4" stroke-width="1.5"/><path d="M12 16l3 3 6-6" stroke="#0078d4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
]

const jobs = [
  { title: '高级前端工程师', dept: '技术研发部', location: '上海', type: '全职' },
  { title: '云计算架构师', dept: '云服务事业部', location: '北京', type: '全职' },
  { title: 'AI 算法工程师', dept: '人工智能实验室', location: '深圳', type: '全职' },
  { title: '产品经理', dept: '产品中心', location: '上海', type: '全职' },
]
</script>

<style lang="scss" scoped>
@use '../corporate.scss' as *;

.careers-hero__bg {
  background-position: center 60%;
}

.careers-hero__overlay {
  background: linear-gradient(
    135deg,
    rgba(180, 80, 20, 0.45) 0%,
    rgba(30, 60, 120, 0.65) 50%,
    rgba(10, 40, 90, 0.75) 100%
  );
}

.careers-benefits {
  padding: 64px 0;
  background: $corp-bg-white;
}

.careers-benefits__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.careers-benefit {
  text-align: center;
  padding: 24px 16px;
}

.careers-benefit__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.careers-benefit__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: $corp-blue-text;
}

.careers-benefit__desc {
  margin: 0;
  font-size: 13px;
  color: $corp-text-muted;
  line-height: 1.5;
}

.careers-benefits__cta {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

.careers-positions {
  padding: 80px 0 100px;
  background: $corp-bg-page;
}

.careers-positions__title {
  text-align: center;
  margin-bottom: 40px;
}

.careers-positions__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.job-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  border-radius: 12px;
  @include corp-glass-light(10px, rgba(255, 255, 255, 0.92));
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 12px 36px rgba(0, 60, 120, 0.08);
  }
}

.job-card__title {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 600;
  color: $corp-blue-text;
}

.job-card__meta {
  margin: 0;
  font-size: 13px;
  color: $corp-text-muted;
}

.job-card__type {
  padding: 6px 14px;
  border-radius: 6px;
  background: rgba(0, 120, 212, 0.08);
  color: $corp-blue;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .careers-benefits__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .careers-benefits__grid {
    grid-template-columns: 1fr;
  }

  .job-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

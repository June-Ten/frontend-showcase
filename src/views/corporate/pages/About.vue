<template>
  <div>
    <section class="corp-page-banner corp-page-banner--tall">
      <div
        class="corp-page-banner__bg"
        :style="{ backgroundImage: `url(${coverImg})` }"
      />
      <div
        class="corp-page-banner__overlay"
        style="background: linear-gradient(135deg, rgba(6, 32, 80, 0.82) 0%, rgba(0, 90, 180, 0.55) 100%)"
      />
      <div class="corp-container corp-page-banner__content">
        <h1 class="corp-page-banner__title">关于我们</h1>
        <p class="corp-page-banner__subtitle">创新驱动未来，科技引领世界</p>
      </div>
      <div class="corp-page-banner__wave" aria-hidden="true" />
    </section>

    <section class="corp-stats-bar">
      <div class="corp-container">
        <div class="corp-stats-bar__grid">
          <div v-for="stat in stats" :key="stat.label" class="corp-stat-item">
            <div class="corp-stat-item__icon" aria-hidden="true" v-html="stat.icon" />
            <div>
              <p class="corp-stat-item__value">{{ stat.value }}</p>
              <p class="corp-stat-item__label">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="about-body">
      <div class="corp-container about-body__inner">
        <div class="about-body__content">
          <p class="corp-eyebrow">公司简介</p>
          <h2 class="corp-section-title">深耕企业数字化，值得信赖的技术伙伴</h2>
          <p class="corp-section-desc">
            智远科技成立于 2010 年，是一家专注于企业数字化转型的科技公司。我们以「创新驱动未来」为使命，为全球客户提供云计算、大数据、人工智能等一站式技术服务。
          </p>
          <p class="corp-section-desc about-body__para">
            多年来，我们持续投入研发，打造安全、稳定、可扩展的技术平台，已服务超过 5000 家企业客户，业务覆盖 100 多个国家和地区。
          </p>
          <ul class="about-body__features">
            <li v-for="feature in features" :key="feature" class="about-body__feature">
              <span class="about-body__check" aria-hidden="true">✓</span>
              {{ feature }}
            </li>
          </ul>
        </div>
        <div class="about-body__media">
          <img :src="coverImg" alt="" class="about-body__photo" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import coverImg from '../../../assets/img/official_website_cover_bg.png'

const stats = [
  {
    value: '2010年',
    label: '公司成立',
    icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    value: '5000+',
    label: '员工人数',
    icon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M15 20c.3-2.2 1.8-4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    value: '100+',
    label: '业务覆盖国家和地区',
    icon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" stroke="currentColor" stroke-width="1.5"/></svg>`,
  },
  {
    value: '200+',
    label: '获得知识产权',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v6c0 4.5-3.2 7.8-7 9-3.8-1.2-7-4.5-7-9V7l7-4z" stroke="currentColor" stroke-width="1.5"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
]

const features = [
  '国家高新技术企业认证',
  'ISO 27001 信息安全管理体系',
  '自主研发核心技术平台',
  '7×24 小时全球运维保障',
]
</script>

<style lang="scss" scoped>
@use '../corporate.scss' as *;

.about-body {
  padding: 80px 0 100px;
  background: $corp-bg-white;
}

.about-body__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

.about-body__para {
  margin-top: 16px;
}

.about-body__features {
  list-style: none;
  margin: 32px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.about-body__feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: $corp-text-muted;
}

.about-body__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 120, 212, 0.1);
  color: $corp-blue;
  font-size: 12px;
  flex-shrink: 0;
}

.about-body__photo {
  display: block;
  width: 100%;
  border-radius: 16px;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  object-position: center 30%;
  box-shadow: 0 16px 48px rgba(0, 60, 120, 0.12);
}

@media (max-width: 1024px) {
  .about-body__inner {
    grid-template-columns: 1fr;
  }

  .about-body__media {
    order: -1;
  }
}

@media (max-width: 640px) {
  .about-body__features {
    grid-template-columns: 1fr;
  }
}
</style>

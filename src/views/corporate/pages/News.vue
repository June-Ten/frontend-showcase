<template>
  <div>
    <section class="news-page">
      <div class="corp-container">
        <div class="corp-section-head">
          <p class="corp-eyebrow">新闻中心</p>
          <h2 class="corp-section-title">新闻中心</h2>
          <p class="corp-section-desc corp-section-desc--center">
            了解公司最新动态与行业前沿资讯
          </p>
        </div>
        <div class="news-page__layout">
          <div class="news-page__list">
            <article v-for="item in news" :key="item.title" class="news-item">
              <div class="news-item__thumb" :style="{ background: item.thumbGradient }" />
              <div class="news-item__body">
                <div class="news-item__meta">
                  <span class="news-item__tag">{{ item.tag }}</span>
                  <time :datetime="item.date">{{ item.date }}</time>
                </div>
                <h3 class="news-item__title">{{ item.title }}</h3>
                <p class="news-item__excerpt">{{ item.excerpt }}</p>
              </div>
            </article>
            <a href="#" class="corp-btn corp-btn--outline news-page__more">
              查看全部新闻
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M4 10h12M12 6l4 4-4 4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>
          </div>
          <div class="news-page__visual">
            <img :src="coverImg" alt="" class="news-page__photo" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import coverImg from '../../../assets/img/official_website_cover_bg.png'

const news = [
  {
    tag: '公司新闻',
    date: '2026-06-15',
    title: '智远科技荣获「年度最佳数字化服务商」',
    excerpt: '在第十届中国企业数字化峰会上，智远科技凭借卓越的技术实力与客户口碑获得殊荣。',
    thumbGradient: 'linear-gradient(135deg, #0c4a9e, #38bdf8)',
  },
  {
    tag: '产品发布',
    date: '2026-05-28',
    title: '发布新一代 AI 智能分析平台 3.0',
    excerpt: '新版本支持多模态数据分析，推理速度提升 2 倍，已面向企业客户开放试用。',
    thumbGradient: 'linear-gradient(135deg, #312e81, #6366f1)',
  },
  {
    tag: '战略合作',
    date: '2026-05-10',
    title: '与某头部车企达成战略合作',
    excerpt: '双方将在智能网联、自动驾驶数据平台等领域展开深度合作。',
    thumbGradient: 'linear-gradient(135deg, #134e6f, #38a3c9)',
  },
]
</script>

<style lang="scss" scoped>
@use '../corporate.scss' as *;

.news-page {
  padding: 100px 0 120px;
  background: $corp-bg-white;
}

.news-page__layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: start;
}

.news-page__list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.news-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-radius: 12px;
  @include corp-glass-light(10px, rgba(255, 255, 255, 0.9));
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 12px 36px rgba(0, 60, 120, 0.08);
  }
}

.news-item__thumb {
  flex-shrink: 0;
  width: 120px;
  height: 90px;
  border-radius: 8px;
}

.news-item__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: $corp-text-muted;

  time {
    color: $corp-blue;
    font-weight: 500;
  }
}

.news-item__tag {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 120, 212, 0.08);
  color: $corp-blue;
  font-weight: 500;
}

.news-item__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: $corp-blue-text;
  line-height: 1.4;
}

.news-item__excerpt {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: $corp-text-muted;
}

.news-page__more {
  align-self: flex-start;
  margin-top: 8px;
}

.news-page__visual {
  position: sticky;
  top: 100px;
}

.news-page__photo {
  display: block;
  width: 100%;
  border-radius: 16px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: center;
  box-shadow: 0 20px 56px rgba(0, 60, 120, 0.15);
}

@media (max-width: 1024px) {
  .news-page__layout {
    grid-template-columns: 1fr;
  }

  .news-page__visual {
    position: static;
    order: -1;
  }

  .news-page__photo {
    aspect-ratio: 16 / 9;
  }
}

@media (max-width: 640px) {
  .news-item {
    flex-direction: column;
  }

  .news-item__thumb {
    width: 100%;
    height: 140px;
  }
}
</style>

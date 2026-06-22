<template>
  <div>
    <section class="products-page">
      <div class="corp-container">
        <div class="corp-section-head">
          <p class="corp-eyebrow">产品与服务</p>
          <h2 class="corp-section-title">产品与服务</h2>
          <p class="corp-section-desc corp-section-desc--center">
            以领先的技术和优质的服务，助力客户成功
          </p>
        </div>
        <div class="products-page__grid">
          <article v-for="product in products" :key="product.title" class="product-card">
            <div class="product-card__visual" :style="{ background: product.gradient }">
              <span class="product-card__visual-icon" aria-hidden="true">{{ product.icon }}</span>
            </div>
            <div class="product-card__body">
              <div class="product-card__icon" aria-hidden="true" v-html="product.svgIcon" />
              <h3 class="product-card__title">{{ product.title }}</h3>
              <p class="product-card__desc">{{ product.desc }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const products = [
  {
    title: '云计算',
    desc: '弹性可扩展的云基础设施，支持混合云与私有云部署，助力企业降本增效。',
    icon: '☁',
    gradient: 'linear-gradient(160deg, #0c4a9e 0%, #38bdf8 60%, #e0f2fe 100%)',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none"><path d="M10 22h14a4 4 0 000-8 5 5 0 00-9.8-1.2A4 4 0 0010 22z" stroke="#0078d4" stroke-width="1.5"/></svg>`,
  },
  {
    title: '大数据',
    desc: '实时数据采集、清洗与分析，可视化报表助力管理层科学决策。',
    icon: '◈',
    gradient: 'linear-gradient(160deg, #1e3a8a 0%, #2563eb 50%, #93c5fd 100%)',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none"><circle cx="8" cy="20" r="3" stroke="#0078d4" stroke-width="1.5"/><circle cx="16" cy="12" r="3" stroke="#0078d4" stroke-width="1.5"/><circle cx="24" cy="18" r="3" stroke="#0078d4" stroke-width="1.5"/><path d="M11 18l3-4 5 2 5-5" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    title: 'AI 人工智能',
    desc: '机器学习与自然语言处理技术，赋能智能客服、风控与推荐系统。',
    icon: '◎',
    gradient: 'linear-gradient(160deg, #312e81 0%, #6366f1 50%, #c7d2fe 100%)',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none"><rect x="8" y="10" width="16" height="14" rx="3" stroke="#0078d4" stroke-width="1.5"/><circle cx="13" cy="16" r="1.5" fill="#0078d4"/><circle cx="19" cy="16" r="1.5" fill="#0078d4"/><path d="M13 20h6" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"/><path d="M16 6v4M12 8h8" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    title: '信息安全',
    desc: '全方位安全防护体系，涵盖身份认证、数据加密与威胁检测。',
    icon: '⬡',
    gradient: 'linear-gradient(160deg, #0f172a 0%, #1e40af 55%, #60a5fa 100%)',
    svgIcon: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 4l9 4v7c0 5.5-3.8 9.5-9 11-5.2-1.5-9-5.5-9-11V8l9-4z" stroke="#0078d4" stroke-width="1.5"/><path d="M12 16l3 3 6-6" stroke="#0078d4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
]
</script>

<style lang="scss" scoped>
@use '../corporate.scss' as *;

.products-page {
  padding: 100px 0 120px;
  background: $corp-bg-white;
}

.products-page__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.product-card {
  border-radius: 14px;
  overflow: hidden;
  @include corp-glass-light(10px, rgba(255, 255, 255, 0.95));
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(0, 60, 120, 0.12);
  }
}

.product-card__visual {
  position: relative;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-card__visual-icon {
  font-size: 48px;
  opacity: 0.35;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.product-card__body {
  padding: 24px 20px 28px;
  @include corp-glass-light(14px, rgba(255, 255, 255, 0.82));
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  margin-top: -24px;
  position: relative;
  border-radius: 14px 14px 0 0;
}

.product-card__icon {
  width: 36px;
  height: 36px;
  margin-bottom: 12px;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.product-card__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: $corp-blue-text;
}

.product-card__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: $corp-text-muted;
}

@media (max-width: 1024px) {
  .products-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .products-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>

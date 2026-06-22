<template>
  <div>
    <section class="contact-page">
      <div class="corp-container">
        <div class="corp-section-head">
          <p class="corp-eyebrow">联系我们</p>
          <h2 class="corp-section-title">联系我们</h2>
          <p class="corp-section-desc corp-section-desc--center">
            期待与您合作，共创美好未来
          </p>
        </div>
        <div class="contact-page__layout">
          <div class="contact-page__info">
            <ul class="contact-page__list">
              <li v-for="item in contactItems" :key="item.label" class="contact-page__item">
                <div class="contact-page__icon" aria-hidden="true" v-html="item.icon" />
                <div>
                  <span class="contact-page__label">{{ item.label }}</span>
                  <span class="contact-page__value">{{ item.value }}</span>
                </div>
              </li>
            </ul>
            <div class="contact-page__social">
              <a
                v-for="social in socials"
                :key="social.label"
                href="#"
                class="contact-page__social-link"
                :aria-label="social.label"
                @click.prevent
              >
                <span v-html="social.icon" />
              </a>
            </div>
          </div>
          <div class="contact-page__map">
            <div class="contact-map">
              <svg viewBox="0 0 400 320" class="contact-map__svg" aria-hidden="true">
                <rect width="400" height="320" fill="#e8f4fc" />
                <path
                  d="M0 120 Q80 80 160 100 T320 90 L400 110 L400 320 L0 320 Z"
                  fill="#d0e8f8"
                />
                <path
                  d="M0 200 Q100 170 200 190 T400 180 L400 320 L0 320 Z"
                  fill="#b8ddf0"
                />
                <line x1="0" y1="80" x2="400" y2="80" stroke="#c5dce8" stroke-width="8" />
                <line x1="120" y1="0" x2="120" y2="320" stroke="#c5dce8" stroke-width="6" />
                <line x1="280" y1="0" x2="280" y2="320" stroke="#c5dce8" stroke-width="6" />
                <line x1="0" y1="160" x2="400" y2="160" stroke="#c5dce8" stroke-width="4" />
                <rect x="60" y="40" width="40" height="30" rx="2" fill="#c5dce8" opacity="0.6" />
                <rect x="200" y="50" width="50" height="35" rx="2" fill="#c5dce8" opacity="0.6" />
                <rect x="300" y="100" width="45" height="40" rx="2" fill="#c5dce8" opacity="0.6" />
                <rect x="140" y="200" width="55" height="45" rx="2" fill="#c5dce8" opacity="0.6" />
              </svg>
              <div class="contact-map__pin" aria-hidden="true">
                <svg viewBox="0 0 24 36" fill="none">
                  <path
                    d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
                    fill="#0078d4"
                  />
                  <circle cx="12" cy="12" r="5" fill="#fff" />
                </svg>
              </div>
              <p class="contact-map__label">智远科技总部 · 上海张江</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const contactItems = [
  {
    label: '服务热线',
    value: '400-888-6688',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M6.5 4h3l1.5 5-2 1.5a12 12 0 005 5L15.5 14l5 1.5v3a2 2 0 01-2.2 2A16 16 0 014 6.2 2 2 0 016 4z" stroke="currentColor" stroke-width="1.5"/></svg>`,
  },
  {
    label: '商务邮箱',
    value: 'business@zhiyuan-tech.com',
    icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 8l9 6 9-6" stroke="currentColor" stroke-width="1.5"/></svg>`,
  },
  {
    label: '总部地址',
    value: '上海市浦东新区张江高科技园区科苑路 88 号',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
  },
]

const socials = [
  {
    label: 'LinkedIn',
    icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 11v5M8 8v.01M12 16v-3a2 2 0 014 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    label: 'WeChat',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 18c-4 0-7-2.5-7-5.5S5 7 9 7s7 2.5 7 5.5c0 1.5-.8 2.8-2 3.8L16 18l-3.2-1.5C12.1 17.8 10.6 18 9 18z" stroke="currentColor" stroke-width="1.5"/><circle cx="7" cy="11" r="1" fill="currentColor"/><circle cx="11" cy="11" r="1" fill="currentColor"/></svg>`,
  },
  {
    label: 'Weibo',
    icon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M8 14c2 1.5 5 1.5 7 0M9 10h.01M15 10h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
]
</script>

<style lang="scss" scoped>
@use '../corporate.scss' as *;

.contact-page {
  padding: 100px 0 120px;
  background: $corp-bg-white;
}

.contact-page__layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 64px;
  align-items: start;
}

.contact-page__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.contact-page__item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.contact-page__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(0, 120, 212, 0.08);
  color: $corp-blue;

  :deep(svg) {
    width: 22px;
    height: 22px;
  }
}

.contact-page__label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $corp-blue;
}

.contact-page__value {
  font-size: 15px;
  color: $corp-text;
  line-height: 1.5;
}

.contact-page__social {
  display: flex;
  gap: 12px;
  margin-top: 40px;
}

.contact-page__social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(0, 120, 212, 0.15);
  color: $corp-blue;
  text-decoration: none;
  transition:
    background 0.2s,
    border-color 0.2s;

  :deep(svg) {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(0, 120, 212, 0.06);
    border-color: $corp-blue;
  }
}

.contact-map {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 60, 120, 0.12);
}

.contact-map__svg {
  display: block;
  width: 100%;
  height: auto;
}

.contact-map__pin {
  position: absolute;
  top: 38%;
  left: 52%;
  transform: translate(-50%, -100%);
  width: 32px;
  filter: drop-shadow(0 4px 8px rgba(0, 120, 212, 0.4));

  svg {
    width: 100%;
    height: auto;
  }
}

.contact-map__label {
  position: absolute;
  bottom: 16px;
  left: 16px;
  margin: 0;
  padding: 8px 14px;
  border-radius: 8px;
  @include corp-glass-light(10px, rgba(255, 255, 255, 0.9));
  font-size: 13px;
  font-weight: 500;
  color: $corp-blue-text;
}

@media (max-width: 1024px) {
  .contact-page__layout {
    grid-template-columns: 1fr;
    gap: 48px;
  }
}
</style>

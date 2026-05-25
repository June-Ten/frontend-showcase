export default {
  plugins: {
    // 自动添加浏览器前缀（-webkit-、-moz- 等）
    autoprefixer: {},
    // 将 px 转换为 rem，配合 flexible.ts 动态根字号实现适配
    'postcss-pxtorem': {
      rootValue: 16, // 设计稿基准：16px = 1rem（对应 1920 宽度）
      propList: ['*'], // 所有 CSS 属性都参与转换
      selectorBlackList: ['html'], // html 根字号由 JS 设置，不参与转换
      minPixelValue: 2, // 小于 2px 的值不转换（如 1px 边框）
    },
  },
}

export const corporateNavItems = [
  { label: '首页', path: '/corporate' },
  { label: '关于我们', path: '/corporate/about' },
  { label: '产品与服务', path: '/corporate/products' },
  { label: '解决方案', path: '/corporate/solutions' },
  { label: '新闻中心', path: '/corporate/news' },
  { label: '加入我们', path: '/corporate/careers' },
  { label: '联系我们', path: '/corporate/contact' },
] as const

export const footerLinks = [
  {
    title: '产品服务',
    links: ['云计算', '大数据', '人工智能', '企业安全'],
  },
  {
    title: '关于公司',
    links: ['公司简介', '发展历程', '加入我们', '投资者关系'],
  },
  {
    title: '支持',
    links: ['帮助中心', '技术文档', '服务条款', '隐私政策'],
  },
]

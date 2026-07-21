import { createRouter ,createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/home/index.vue')
  },
  {
    path: '/visualization',
    name: 'Visualization',
    component: () => import('../views/visualization/index.vue')
  },
  {
    path: '/equity',
    name: 'Equity',
    component: () => import('../views/equity/index.vue')
  },
  {
    path: '/equity-compact-box',
    name: 'EquityPenetration',
    component: () => import('../views/equity-compact-box/index.vue')
  },
  {
    path: '/compliance-mindmap',
    name: 'ComplianceMindmap',
    component: () => import('../views/compliance-mindmap/index.vue')
  },
  {
    path: '/equity-d3',
    name: 'EquityD3',
    component: () => import('../views/equityD3/index.vue')
  },
  {
    path: '/sign',
    name: 'Sign',
    component: () => import('../views/sign/index.vue')
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/chat/index.vue')
  },
  {
    path: '/corporate',
    component: () => import('../views/corporate/CorporateLayout.vue'),
    children: [
      {
        path: '',
        name: 'Corporate',
        component: () => import('../views/corporate/pages/Home.vue'),
      },
      {
        path: 'about',
        name: 'CorporateAbout',
        component: () => import('../views/corporate/pages/About.vue'),
      },
      {
        path: 'products',
        name: 'CorporateProducts',
        component: () => import('../views/corporate/pages/Products.vue'),
      },
      {
        path: 'solutions',
        name: 'CorporateSolutions',
        component: () => import('../views/corporate/pages/Solutions.vue'),
      },
      {
        path: 'news',
        name: 'CorporateNews',
        component: () => import('../views/corporate/pages/News.vue'),
      },
      {
        path: 'careers',
        name: 'CorporateCareers',
        component: () => import('../views/corporate/pages/Careers.vue'),
      },
      {
        path: 'contact',
        name: 'CorporateContact',
        component: () => import('../views/corporate/pages/Contact.vue'),
      },
    ],
  },
]

export const router = createRouter(
  {
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
  }
)
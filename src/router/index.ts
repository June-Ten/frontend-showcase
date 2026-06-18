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
    path: '/equity-d3',
    name: 'EquityD3',
    component: () => import('../views/equityD3/index.vue')
  },
  {
    path: '/sign',
    name: 'Sign',
    component: () => import('../views/sign/index.vue')
  }
]

export const router = createRouter(
  {
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
  }
)
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
    name: 'EquityCompactBox',
    component: () => import('../views/equityCompactBox/index.vue')
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
    path: '/g6-test',
    name: 'G6Test',
    component: () => import('../views/g6Test/index.vue')
  }
]

export const router = createRouter(
  {
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
  }
)
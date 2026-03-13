import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'

const AUTH_FLAG = 'vboost_token'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const token = sessionStorage.getItem(AUTH_FLAG)

  if (to.meta.requiresAuth) {
    if (!token) {
      next({ name: 'login' })
      return
    }
    try {
      const res = await fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        sessionStorage.removeItem(AUTH_FLAG)
        next({ name: 'login' })
        return
      }
    } catch {
      // Network error during navigation — allow through, heartbeat will retry
    }
    next()
    return
  }

  if (to.name === 'login' && token) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export { AUTH_FLAG }
export default router

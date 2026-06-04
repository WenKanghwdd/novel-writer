/**
 * Vue Router — 路由配置
 *
 * 路由：
 * - /login : 登录/注册
 * - / : 项目列表页（需登录）
 * - /writer/:id : 写作页面（需登录）
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/',
    name: 'ProjectList',
    component: () => import('@/views/ProjectList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/writer/:id',
    name: 'Writer',
    component: () => import('@/views/Writer.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

/** 路由守卫：未登录用户跳转到登录页 */
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      next('/login')
      return
    }
  }
  // 已登录用户访问登录页 → 跳首页
  if (to.path === '/login') {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      next('/')
      return
    }
  }
  next()
})

export default router

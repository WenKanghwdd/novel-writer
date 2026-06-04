/**
 * Vue Router — 路由配置
 *
 * 只有两个路由：
 * - / : 项目列表页（首页）
 * - /writer/:id : 写作页面，:id 是项目 ID
 */
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'ProjectList',
    component: () => import('@/views/ProjectList.vue'),
  },
  {
    path: '/writer/:id',
    name: 'Writer',
    component: () => import('@/views/Writer.vue'),
    props: true, // 将路由参数 :id 作为 props 传入组件
  },
]

// 使用 Hash 模式（兼容性好，直接打开 dist/index.html 也能工作）
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router

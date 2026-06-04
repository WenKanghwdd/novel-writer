/**
 * 应用入口
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Naive UI 按需引入——我们使用自动导入方式
// 这里只引入少量全局组件，各页面按需 import 具体组件

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// 注册 Service Worker（PWA 离线支持）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 静默失败，不影响主功能
    })
  })
}

/**
 * 主题管理（亮色/暗色模式）
 */
import { ref, watch } from 'vue'

/** 主题偏好，持久化到 localStorage */
const isDark = ref(localStorage.getItem('novel-writer-theme') === 'dark')

// 同步到 <html> 的 class
function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
}
applyTheme()

watch(isDark, (val) => {
  localStorage.setItem('novel-writer-theme', val ? 'dark' : 'light')
  applyTheme()
})

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
  }

  function setTheme(dark) {
    isDark.value = dark
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
  }
}

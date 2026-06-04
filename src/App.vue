<template>
  <n-message-provider>
    <n-config-provider :theme="naiveTheme" :locale="zhCN" :date-locale="dateZhCN">
      <router-view />
    </n-config-provider>
  </n-message-provider>
</template>

<script setup>
/**
 * App 根组件
 *
 * 集成 Naive UI 暗色主题，所有子页面共享。
 * 主题状态由 stores/theme.js 管理。
 */
import { computed } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui'
import { zhCN, dateZhCN } from 'naive-ui'
import { useTheme } from '@/stores/theme'

const { isDark } = useTheme()

// 根据当前主题切换 Naive UI 主题
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))
</script>

<style>
@import '@/styles/main.css';
</style>

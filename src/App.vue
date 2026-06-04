<template>
  <!-- Naive UI 的 NMessageProvider 提供全局消息提示能力 -->
  <n-message-provider>
    <n-config-provider :theme="null" :locale="zhCN" :date-locale="dateZhCN">
      <router-view />
    </n-config-provider>
  </n-message-provider>
</template>

<script setup>
/**
 * App 根组件
 *
 * 提供 Naive UI 的全局配置（中文语言包）。
 * router-view 渲染当前路由对应的页面。
 */
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import { zhCN, dateZhCN } from 'naive-ui'
</script>

<style>
@import '@/styles/main.css';
</style>

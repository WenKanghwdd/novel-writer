<template>
  <div class="deepseek-sidebar">
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <div class="header-left">
        <n-icon size="18" color="#4f6ef7"><SparklesOutline /></n-icon>
        <span class="header-title">AI 助手</span>
      </div>
      <n-button quaternary circle size="tiny" @click="emitClose">
        <template #icon>
          <n-icon><CloseOutline /></n-icon>
        </template>
      </n-button>
    </div>

    <!-- 操作说明 -->
    <div class="sidebar-body">
      <!-- 大按钮：打开 DeepSeek -->
      <n-button
        type="primary"
        size="large"
        block
        @click="openDeepSeek"
        class="open-btn"
      >
        <template #icon>
          <n-icon size="20"><OpenOutline /></n-icon>
        </template>
        打开 DeepSeek 对话窗口
      </n-button>

      <div class="usage-guide">
        <h4>💡 使用方法</h4>
        <ol>
          <li>
            <strong>复制内容到 AI</strong>
            <p>在编辑器中选中文字，按 <kbd>⌘C</kbd> 复制，粘贴到 DeepSeek 对话框</p>
          </li>
          <li>
            <strong>从 AI 获取建议</strong>
            <p>在 DeepSeek 中生成内容后，复制文字回到编辑器粘贴</p>
          </li>
          <li>
            <strong>常用提示词</strong>
            <p class="prompt-example">"帮我把这段对话改得更自然：……"</p>
            <p class="prompt-example">"帮我扩写这个场景：……"</p>
            <p class="prompt-example">"分析这段文字的情感节奏"</p>
          </li>
        </ol>
      </div>

      <div class="quick-links">
        <n-button
          quaternary
          size="small"
          tag="a"
          href="https://chat.deepseek.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <template #icon>
            <n-icon size="14"><LinkOutline /></n-icon>
          </template>
          https://chat.deepseek.com/
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * AI 助手侧边栏
 *
 * DeepSeek 不允许在 iframe 中嵌入（X-Frame-Options: DENY），
 * 因此改为新窗口打开方式。
 *
 * 用户手动复制编辑器内容到 DeepSeek 对话框，
 * 或从 DeepSeek 复制建议到编辑器。
 */
import { NButton, NIcon } from 'naive-ui'
import {
  CloseOutline,
  SparklesOutline,
  OpenOutline,
  LinkOutline,
} from '@vicons/ionicons5'

const emit = defineEmits(['close'])

/** 在新窗口打开 DeepSeek */
function openDeepSeek() {
  window.open('https://chat.deepseek.com/', '_blank', 'noopener,noreferrer')
}

function emitClose() {
  emit('close')
}
</script>

<style scoped>
.deepseek-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 主体 */
.sidebar-body {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 打开按钮 */
.open-btn {
  font-size: 15px;
  padding: 14px 0;
}

/* 使用指南 */
.usage-guide {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}
.usage-guide h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.usage-guide ol {
  padding-left: 20px;
}
.usage-guide li {
  margin-bottom: 12px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}
.usage-guide li strong {
  color: #333;
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}
.usage-guide li p {
  font-size: 13px;
  color: #666;
}
kbd {
  background: #eee;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 11px;
  font-family: inherit;
}
.prompt-example {
  background: #f0f0f0;
  border-radius: 4px;
  padding: 6px 10px;
  margin: 4px 0;
  font-size: 12px;
  color: #555;
  font-style: italic;
}

/* 快捷链接 */
.quick-links {
  margin-top: auto;
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
</style>

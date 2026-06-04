<template>
  <div class="writer-page">
    <!-- ========== 顶部导航栏 ========== -->
    <n-layout-header bordered class="writer-header">
      <div class="header-left">
        <n-button text size="medium" @click="goBack">
          <template #icon>
            <n-icon size="20"><ArrowBackOutline /></n-icon>
          </template>
          返回
        </n-button>
        <span class="project-title">{{ store.currentProject?.title || '加载中...' }}</span>

        <!-- 展开/收起左侧目录 -->
        <n-button
          quaternary
          size="small"
          @click="showChapterPanel = !showChapterPanel"
          :type="showChapterPanel ? 'primary' : 'default'"
        >
          <template #icon>
            <n-icon size="18"><ListOutline /></n-icon>
          </template>
          目录
        </n-button>

        <!-- 展开/收起 AI 侧边栏 -->
        <n-button
          quaternary
          size="small"
          @click="showAIPanel = !showAIPanel"
          :type="showAIPanel ? 'primary' : 'default'"
        >
          <template #icon>
            <n-icon size="18"><SparklesOutline /></n-icon>
          </template>
          AI 助手
        </n-button>

        <!-- 暗色模式切换 -->
        <n-button
          quaternary
          size="small"
          @click="theme.toggleTheme()"
        >
          <template #icon>
            <n-icon size="16">
              <MoonOutline v-if="!theme.isDark.value" />
              <SunnyOutline v-else />
            </n-icon>
          </template>
        </n-button>

        <!-- 查找替换 -->
        <n-button
          quaternary
          size="small"
          @click="showFindReplace = !showFindReplace"
          :type="showFindReplace ? 'primary' : 'default'"
        >
          <template #icon>
            <n-icon size="16"><SearchOutline /></n-icon>
          </template>
          查找
        </n-button>
      </div>
      <div class="header-right">
        <!-- 保存状态指示 -->
        <span class="save-status" :style="{ color: saveStatus.color }">
          <n-icon size="14">
            <CheckmarkCircleOutline v-if="saveStatus.type === 'saved'" />
            <SyncOutline v-else-if="saveStatus.type === 'saving'" />
            <AlertCircleOutline v-else />
          </n-icon>
          {{ saveStatus.text }}
        </span>
      </div>
    </n-layout-header>

    <!-- ========== 主体布局（三栏） ========== -->
    <div class="writer-body">
      <!-- 左侧：章节目录树 -->
      <transition name="slide-left">
        <aside v-if="showChapterPanel" class="chapter-panel">
          <ChapterTree
            :chapters="store.chapters"
            :active-id="store.activeChapterId"
            @select="store.setActiveChapter"
            @add="handleAddChapter"
            @delete="handleDeleteChapter"
            @move-up="(id) => store.moveChapterUp(id)"
            @move-down="(id) => store.moveChapterDown(id)"
            @indent="(id) => store.indentChapter(id)"
            @outdent="(id) => store.outdentChapter(id)"
            @reorder="(updates) => store.batchReorderChapters(updates)"
          />
        </aside>
      </transition>

      <!-- 中间：Markdown 编辑器 -->
      <main class="editor-panel" :class="{ 'sidebar-open': showAIPanel }">
        <!-- 没有选中章节 -->
        <n-empty
          v-if="!store.activeChapter"
          description="请从左侧目录选择或创建一个章节"
          class="empty-editor"
        />

        <!-- 编辑器 -->
        <template v-else>
          <!-- 章节标题 -->
          <div class="chapter-title-bar">
            <n-input
              v-model:value="editingTitle"
              placeholder="章节标题"
              size="small"
              :bordered="false"
              class="title-input"
              @blur="handleTitleBlur"
              @keyup.enter="$event.target.blur()"
            />
          </div>

          <!-- 查找替换栏 -->
          <FindReplace
            :visible="showFindReplace"
            :vditor="vditorInstance"
            @close="showFindReplace = false"
          />

          <!-- Markdown 编辑器 -->
          <div class="editor-container" ref="editorContainer"></div>
        </template>
      </main>

      <!-- 右侧：DeepSeek AI 侧边栏 -->
      <transition name="slide-right">
        <aside v-if="showAIPanel" class="ai-panel">
          <DeepSeekSidebar @close="showAIPanel = false" />
        </aside>
      </transition>
    </div>
  </div>
</template>

<script setup>
/**
 * 写作页面
 *
 * 三栏布局：
 *   左侧 — 章节树
 *   中间 — Vditor Markdown 编辑器
 *   右侧 — DeepSeek AI 助手（iframe 嵌入）
 *
 * 主要职责：
 * - 初始化/加载项目及章节数据
 * - 管理 Vditor 编辑器实例
 * - 实现自动保存（编辑后 10 秒）
 */
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useProjectStore } from '@/stores/project'
import { useTheme } from '@/stores/theme'
import { projectsApi } from '@/lib/supabase'
import ChapterTree from '@/components/ChapterTree.vue'
// Vditor 核心 CSS（必须引入，否则工具栏样式不生效）
import 'vditor/dist/index.css'
import DeepSeekSidebar from '@/components/DeepSeekSidebar.vue'
import FindReplace from '@/components/FindReplace.vue'
import {
  NButton,
  NEmpty,
  NIcon,
  NInput,
  NLayoutHeader,
} from 'naive-ui'
import {
  ArrowBackOutline,
  ListOutline,
  SparklesOutline,
  CheckmarkCircleOutline,
  SyncOutline,
  AlertCircleOutline,
  SearchOutline,
  MoonOutline,
  SunnyOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  id: { type: String, required: true },
})

const router = useRouter()
const route = useRoute()
const message = useMessage()
const store = useProjectStore()
const theme = useTheme()

// ========== 编辑器状态 ==========
const showChapterPanel = ref(true) // 左侧目录面板
const showAIPanel = ref(false)     // 右侧 AI 面板
const showFindReplace = ref(false) // 查找替换栏
const editorContainer = ref(null)  // Vditor 挂载点
let vditorInstance = null          // Vditor 实例引用
const editingTitle = ref('')       // 当前编辑的章节标题
let saveTimer = null               // 自动保存定时器
let isDirty = false                // 内容是否被修改

// 保存状态指示
const saveStatus = ref({
  type: 'saved',  // 'saved' | 'saving' | 'dirty'
  text: '已保存',
  color: '#52c41a',
})

// ========== 初始化 ==========
onMounted(async () => {
  try {
    // 获取项目信息
    const [project] = await Promise.all([
      projectsApi.list().then((list) => list.find((p) => p.id === props.id)),
    ])
    if (!project) {
      message.error('项目不存在')
      router.push('/')
      return
    }
    await store.openProject(project)

    // 如果有关联的章节，初始化编辑器
    if (store.activeChapter) {
      editingTitle.value = store.activeChapter.title
    }
  } catch (err) {
    console.error('加载项目失败:', err)
    message.error('加载失败：' + (err.message || '未知错误'))
  }

  // 键盘快捷键
  window.addEventListener('keydown', handleKeyDown)
})

// Ctrl+H / Cmd+H 打开查找替换
function handleKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
    e.preventDefault()
    showFindReplace.value = !showFindReplace.value
  }
  // Esc 关闭查找替换
  if (e.key === 'Escape' && showFindReplace.value) {
    showFindReplace.value = false
  }
}

onBeforeUnmount(() => {
  // 组件卸载前保存并销毁编辑器
  if (saveTimer) clearTimeout(saveTimer)
  if (vditorInstance) {
    vditorInstance.destroy()
    vditorInstance = null
  }
  window.removeEventListener('keydown', handleKeyDown)
})

// ========== 监听章节切换：重新初始化编辑器 ==========
watch(
  () => store.activeChapterId,
  async (newId, oldId) => {
    if (!newId) return

    // 切换前先保存当前内容
    if (oldId && isDirty) {
      await triggerSave()
    }

    // 重置脏状态
    isDirty = false

    // 更新标题
    if (store.activeChapter) {
      editingTitle.value = store.activeChapter.title
    }

    // 等待 DOM 更新后初始化/切换编辑器内容
    await nextTick()
    initOrSwitchEditor()
  }
)

// ========== Vditor 编辑器 ==========

/** 初始化或切换编辑器内容 */
async function initOrSwitchEditor() {
  const container = editorContainer.value
  if (!container || !store.activeChapter) return

  // 如果已有实例，先销毁
  if (vditorInstance) {
    vditorInstance.destroy()
    vditorInstance = null
  }

  // 动态导入 Vditor（因为它比较大，生产构建时拆分包）
  const Vditor = (await import('vditor')).default

  vditorInstance = new Vditor(container, {
    // 初始内容
    value: store.activeChapter.content || '',
    // 模式：所见即所得（也可设为 'markdown' 双栏或 'ir' 即时渲染）
    mode: 'ir',
    // 大纲
    outline: false,
    // 工具栏配置
    toolbar: [
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'list',
      'ordered-list',
      'check',
      '|',
      'quote',
      'link',
      'table',
      'code-block',
      '|',
      'undo',
      'redo',
      '|',
      'preview',
      'fullscreen',
      'edit-mode',
      {
        name: 'help',
        hotkey: '⌘H',
      },
    ],
    // 上传（暂时不实现图片上传）
    upload: {
      accept: '',
      handler() {},
    },
    // 缓存（不用，我们用 Supabase 保存）
    cache: {
      enable: false,
    },
    // 输入事件——标记为脏，启动自动保存
    input: () => {
      if (!isDirty) {
        isDirty = true
        saveStatus.value = { type: 'dirty', text: '未保存', color: '#faad14' }
      }
      scheduleAutoSave()
    },
    // 获取焦点：如果之前未触发 input，也启动定时器
    focus: () => {
      if (isDirty) {
        scheduleAutoSave()
      }
    },
    height: '100%',
    placeholder: '开始写作...',
    tab: '\t',
    // 使用 CDN 加载 Vditor 的资源文件（i18n、样式等）
    cdn: 'https://cdn.jsdelivr.net/npm/vditor@3.11.2',
    theme: theme.isDark.value ? 'dark' : 'classic',
  })

  // 初始化后立即应用暗色主题（如果已开启）
  if (theme.isDark.value) {
    try {
      vditorInstance.setTheme('dark')
    } catch {}
  }
}

// ========== 自动保存逻辑 ==========

/** 安排自动保存（每次输入后重置 10 秒计时器） */
function scheduleAutoSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    triggerSave()
  }, 10_000) // 10 秒
}

/** 执行保存 */
async function triggerSave() {
  if (!store.activeChapter || !vditorInstance) return

  const chapterId = store.activeChapterId.value
  if (!chapterId) return

  saveStatus.value = { type: 'saving', text: '保存中...', color: '#1890ff' }
  isDirty = false

  try {
    // 从 Vditor 获取最新内容
    const content = vditorInstance.getValue()
    const title = editingTitle.value.trim() || '未命名章节'

    await store.saveChapter(chapterId, {
      title,
      content,
    })
    saveStatus.value = { type: 'saved', text: '已保存', color: '#52c41a' }
  } catch (err) {
    console.error('自动保存失败:', err)
    saveStatus.value = { type: 'error', text: '保存失败', color: '#ff4d4f' }
    // 标记为脏，下次编辑重试
    isDirty = true
  } finally {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  }
}

// ========== 事件处理 ==========

/** 返回项目列表 */
function goBack() {
  // 如果有未保存内容，先保存
  if (isDirty) {
    triggerSave()
  }
  store.closeProject()
  router.push('/')
}

/** 章节标题失焦时保存 */
function handleTitleBlur() {
  if (!store.activeChapter) return
  const newTitle = editingTitle.value.trim() || '未命名章节'
  if (newTitle !== store.activeChapter.title) {
    // 标题改变直接保存
    store.saveChapter(store.activeChapterId.value, { title: newTitle }).catch((err) => {
      message.error('保存标题失败')
    })
  }
}

/** 新增章节 */
async function handleAddChapter() {
  try {
    await store.addChapter({ title: '新章节' })
    // store.addChapter 会自动设置 activeChapterId
    // 等待编辑器初始化
    await nextTick()
    editingTitle.value = store.activeChapter?.title || '新章节'
  } catch (err) {
    message.error('新增章节失败')
  }
}

/** 删除章节 */
async function handleDeleteChapter(id) {
  const chapter = store.chapters.find((c) => c.id === id)
  if (!chapter) return
  const confirm = window.confirm(`确认删除「${chapter.title}」？`)
  if (!confirm) return
  try {
    await store.removeChapter(id)
    message.success('已删除')
  } catch (err) {
    message.error('删除失败')
  }
}

// 监听暗色模式切换，同步 Vditor 主题
watch(
  () => theme.isDark.value,
  (dark) => {
    if (vditorInstance) {
      try {
        vditorInstance.setTheme(dark ? 'dark' : 'classic')
      } catch {}
    }
    // 更新 writer-page 背景色
    const el = document.querySelector('.writer-page')
    if (el) {
      el.style.backgroundColor = dark ? '#1a1a2e' : '#ffffff'
    }
  }
)
</script>

<style scoped>
.writer-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  overflow: hidden;
}

/* ========== 导航栏 ========== */
.writer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.project-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.save-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-right: 8px;
}

/* ========== 主体 ========== */
.writer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* ========== 左侧章节面板 ========== */
.chapter-panel {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid var(--border-color);
  background: var(--bg-panel);
  overflow-y: auto;
  flex-shrink: 0;
}

/* ========== 中间编辑器 ========== */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
.editor-panel.sidebar-open {
  /* 当右侧 AI 面板打开时，编辑器宽度会被 flex 自动压缩 */
}
.chapter-title-bar {
  padding: 12px 24px 0;
  flex-shrink: 0;
}
.title-input {
  font-size: 20px !important;
  font-weight: 600 !important;
}
.title-input :deep(.n-input__input) {
  font-size: 20px !important;
  font-weight: 600 !important;
}
.editor-container {
  flex: 1;
  padding: 8px 24px 24px;
  overflow: visible;
}
.editor-container :deep(.vditor-toolbar__item) {
  /* 工具栏提示框不受容器裁剪 */
}
.empty-editor {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

/* ========== 右侧 AI 面板 ========== */
.ai-panel {
  width: 420px;
  min-width: 420px;
  border-left: 1px solid var(--border-color);
  background: var(--bg-white);
  flex-shrink: 0;
  overflow: hidden;
}

/* ========== 过渡动画 ========== */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: width 0.2s ease, min-width 0.2s ease;
}
.slide-left-enter-from,
.slide-left-leave-to {
  width: 0;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
}
.slide-left-enter-to,
.slide-left-leave-from {
  width: 260px;
  min-width: 260px;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: width 0.2s ease, min-width 0.2s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  width: 0;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
}
.slide-right-enter-to,
.slide-right-leave-from {
  width: 420px;
  min-width: 420px;
}
</style>

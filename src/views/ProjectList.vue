<template>
  <div class="project-list-page">
    <!-- 顶部导航栏 -->
    <n-layout-header bordered class="header">
      <div class="header-inner">
        <h1 class="logo">📖 哈哈哈</h1>
        <n-button type="primary" size="medium" @click="showNewDialog = true">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          新建项目
        </n-button>
      </div>
    </n-layout-header>

    <!-- 项目列表内容区 -->
    <n-layout-content class="content">
      <!-- 加载状态 -->
      <div v-if="store.loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <!-- 空状态 -->
      <n-empty
        v-else-if="store.projects.length === 0"
        description="还没有项目，点击上方按钮创建一个"
        class="empty-state"
      />

      <!-- 项目卡片网格 -->
      <div v-else class="project-grid">
        <div
          v-for="project in store.projects"
          :key="project.id"
          class="project-card"
          @click="openProject(project)"
        >
          <n-card
            :title="project.title"
            size="small"
            hoverable
            class="card"
          >
            <!-- 简介 -->
            <p class="synopsis">
              {{ project.synopsis || '暂无简介' }}
            </p>

            <!-- 元信息 -->
            <div class="meta">
              <span class="meta-item">
                <n-icon size="14"><TimeOutline /></n-icon>
                更新于 {{ formatDate(project.updated_at) }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <template #action>
              <n-space justify="end">
                <n-button
                  size="tiny"
                  quaternary
                  type="warning"
                  @click.stop="handleRename(project)"
                >
                  <template #icon>
                    <n-icon><CreateOutline /></n-icon>
                  </template>
                  重命名
                </n-button>
                <n-button
                  size="tiny"
                  quaternary
                  type="error"
                  @click.stop="handleDelete(project)"
                >
                  <template #icon>
                    <n-icon><TrashOutline /></n-icon>
                  </template>
                  删除
                </n-button>
              </n-space>
            </template>
          </n-card>
        </div>
      </div>
    </n-layout-content>

    <!-- 新建项目弹窗 -->
    <n-modal
      v-model:show="showNewDialog"
      title="新建项目"
      preset="card"
      style="width: 480px"
      :mask-closable="false"
      :close-on-esc="true"
    >
      <n-form
        ref="formRef"
        :model="newProject"
        :rules="formRules"
        label-placement="top"
      >
        <n-form-item label="项目标题" path="title">
          <n-input
            v-model:value="newProject.title"
            placeholder="输入小说标题"
            maxlength="100"
            show-count
            autofocus
          />
        </n-form-item>
        <n-form-item label="故事简介（可选）" path="synopsis">
          <n-input
            v-model:value="newProject.synopsis"
            type="textarea"
            placeholder="简要描述这个故事..."
            :rows="3"
            maxlength="500"
            show-count
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showNewDialog = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="handleCreate">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 重命名弹窗 -->
    <n-modal
      v-model:show="showRenameDialog"
      title="重命名项目"
      preset="card"
      style="width: 420px"
    >
      <n-form label-placement="top">
        <n-form-item label="新标题">
          <n-input
            v-model:value="renameTitle"
            placeholder="输入新标题"
            maxlength="100"
            show-count
            autofocus
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showRenameDialog = false">取消</n-button>
          <n-button type="primary" @click="handleRenameConfirm">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
/**
 * 项目列表页
 *
 * 展示所有小说项目，提供新建、重命名、删除和进入编辑功能。
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useProjectStore } from '@/stores/project'
import {
  NButton,
  NCard,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NLayoutContent,
  NLayoutHeader,
  NModal,
  NIcon,
  NSpace,
  NSpin,
} from 'naive-ui'
import {
  AddOutline,
  TimeOutline,
  CreateOutline,
  TrashOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const store = useProjectStore()

// 新建项目状态
const showNewDialog = ref(false)
const creating = ref(false)
const newProject = ref({ title: '', synopsis: '' })

// 重命名状态
const showRenameDialog = ref(false)
const renameTarget = ref(null)
const renameTitle = ref('')

// 表单验证规则
const formRules = {
  title: [{ required: true, message: '请输入项目标题', trigger: 'blur' }],
}

/** 加载项目列表 */
onMounted(() => {
  store.loadProjects()
})

/** 进入写作页面 */
function openProject(project) {
  router.push({ name: 'Writer', params: { id: project.id } })
}

/** 创建新项目 */
async function handleCreate() {
  if (!newProject.value.title.trim()) {
    message.warning('请输入项目标题')
    return
  }
  creating.value = true
  try {
    const project = await store.createProject({
      title: newProject.value.title.trim(),
      synopsis: newProject.value.synopsis.trim(),
    })
    message.success('项目创建成功')
    showNewDialog.value = false
    newProject.value = { title: '', synopsis: '' }
    // 创建后直接进入
    router.push({ name: 'Writer', params: { id: project.id } })
  } catch (err) {
    console.error('创建失败:', err)
    message.error('创建失败：' + (err.message || '未知错误'))
  } finally {
    creating.value = false
  }
}

/** 打开重命名弹窗 */
function handleRename(project) {
  renameTarget.value = project
  renameTitle.value = project.title
  showRenameDialog.value = true
}

/** 确认重命名 */
async function handleRenameConfirm() {
  if (!renameTitle.value.trim()) {
    message.warning('请输入标题')
    return
  }
  try {
    await store.updateProject(renameTarget.value.id, {
      title: renameTitle.value.trim(),
    })
    message.success('重命名成功')
    showRenameDialog.value = false
  } catch (err) {
    message.error('重命名失败：' + (err.message || '未知错误'))
  }
}

/** 删除项目（带确认） */
function handleDelete(project) {
  const dialog = window.confirm(`确认删除项目「${project.title}」？\n所有章节数据将被永久删除，无法恢复。`)
  if (dialog) {
    store.deleteProject(project.id)
      .then(() => message.success('已删除'))
      .catch((err) => message.error('删除失败：' + (err.message || '未知错误')))
  }
}

/** 格式化日期 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.project-list-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  padding: 0 32px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 1px;
}
.content {
  flex: 1;
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
.empty-state {
  padding: 80px 0;
}
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.card {
  cursor: pointer;
}
.synopsis {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  min-height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>

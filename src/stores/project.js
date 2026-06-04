/**
 * Pinia Store — 项目管理
 *
 * 管理当前选中的项目、章节列表，以及编辑器状态。
 * 之所以用 Pinia 而不是 Composition API + props，是因为多个组件
 * （左侧目录树、主编辑器、DeepSeek 侧边栏）需要共享同一个项目上下文。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectsApi, chaptersApi } from '@/lib/supabase'

export const useProjectStore = defineStore('project', () => {
  // ==================== 项目 ====================

  /** 所有项目列表 */
  const projects = ref([])

  /** 当前正在编辑的项目 */
  const currentProject = ref(null)

  /** 是否正在加载 */
  const loading = ref(false)

  // ==================== 章节 ====================

  /** 当前项目的章节列表（扁平数组，渲染树形时转换） */
  const chapters = ref([])

  /** 当前正在编辑的章节 ID */
  const activeChapterId = ref(null)

  /** 当前编辑的章节对象 */
  const activeChapter = computed(() => {
    if (!activeChapterId.value) return null
    return chapters.value.find((c) => c.id === activeChapterId.value) || null
  })

  // ==================== 方法 ====================

  /** 加载所有项目 */
  async function loadProjects(userId) {
    loading.value = true
    try {
      projects.value = await projectsApi.list(userId)
    } finally {
      loading.value = false
    }
  }

  /** 创建新项目，创建后自动生成一个初始章节 */
  async function createProject({ userId, title, synopsis }) {
    const project = await projectsApi.create({ userId, title, synopsis })
    // 创建一个默认章节
    await chaptersApi.create({
      project_id: project.id,
      title: '第一章',
      order_index: 0,
    })
    projects.value.unshift(project)
    return project
  }

  /** 更新项目 */
  async function updateProject(id, fields) {
    const updated = await projectsApi.update(id, fields)
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      projects.value[idx] = { ...projects.value[idx], ...updated }
    }
  }

  /** 删除项目 */
  async function deleteProject(id) {
    await projectsApi.remove(id)
    projects.value = projects.value.filter((p) => p.id !== id)
    if (currentProject.value?.id === id) {
      currentProject.value = null
      chapters.value = []
    }
  }

  /** 进入项目（加载章节） */
  async function openProject(project) {
    currentProject.value = project
    chapters.value = await chaptersApi.list(project.id)
    // 默认选中第一个章节
    if (chapters.value.length > 0 && !activeChapterId.value) {
      activeChapterId.value = chapters.value[0].id
    }
  }

  /** 退出项目 */
  function closeProject() {
    currentProject.value = null
    chapters.value = []
    activeChapterId.value = null
  }

  /** 创建新章节 */
  async function addChapter({ parent_id = null, title = '新章节' }) {
    if (!currentProject.value) return null
    const maxOrder = chapters.value
      .filter((c) => c.parent_id === parent_id)
      .reduce((max, c) => Math.max(max, c.order_index), -1)
    const chapter = await chaptersApi.create({
      project_id: currentProject.value.id,
      parent_id,
      title,
      order_index: maxOrder + 1,
    })
    chapters.value.push(chapter)
    activeChapterId.value = chapter.id
    return chapter
  }

  /** 更新章节（含自动保存） */
  async function saveChapter(id, fields) {
    const updated = await chaptersApi.update(id, fields)
    const idx = chapters.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      chapters.value[idx] = { ...chapters.value[idx], ...updated }
    }
    // 同时更新项目的 updated_at
    if (currentProject.value) {
      await projectsApi.update(currentProject.value.id, {
        updated_at: new Date().toISOString(),
      })
      currentProject.value.updated_at = new Date().toISOString()
      // 同步更新 projects 列表中的 updated_at
      const pIdx = projects.value.findIndex((p) => p.id === currentProject.value.id)
      if (pIdx !== -1) {
        projects.value[pIdx].updated_at = new Date().toISOString()
      }
    }
  }

  /** 删除章节 */
  async function removeChapter(id) {
    await chaptersApi.remove(id)
    chapters.value = chapters.value.filter((c) => c.id !== id)
    if (activeChapterId.value === id) {
      activeChapterId.value = chapters.value.length > 0 ? chapters.value[0].id : null
    }
  }

  /** 切换活动章节 */
  function setActiveChapter(id) {
    activeChapterId.value = id
  }

  /** 批量重排章节（拖拽或按钮排序后调用） */
  async function batchReorderChapters(updates) {
    // updates: [{ id, order_index, parent_id? }]
    await chaptersApi.batchUpdateOrder(updates)
    // 重新加载章节列表
    if (currentProject.value) {
      chapters.value = await chaptersApi.list(currentProject.value.id)
    }
  }

  /** 上移章节（交换 index） */
  async function moveChapterUp(id) {
    const sorted = [...chapters.value].sort((a, b) => a.order_index - b.order_index)
    const idx = sorted.findIndex((c) => c.id === id)
    if (idx <= 0) return
    // 同一 parent 内交换
    const current = sorted[idx]
    const above = sorted[idx - 1]
    if (current.parent_id !== above.parent_id) return // 不同层级不交换

    await batchReorderChapters([
      { id: current.id, order_index: above.order_index, parent_id: current.parent_id },
      { id: above.id, order_index: current.order_index, parent_id: above.parent_id },
    ])
  }

  /** 下移章节 */
  async function moveChapterDown(id) {
    const sorted = [...chapters.value].sort((a, b) => a.order_index - b.order_index)
    const idx = sorted.findIndex((c) => c.id === id)
    if (idx < 0 || idx >= sorted.length - 1) return
    const current = sorted[idx]
    const below = sorted[idx + 1]
    if (current.parent_id !== below.parent_id) return

    await batchReorderChapters([
      { id: current.id, order_index: below.order_index, parent_id: current.parent_id },
      { id: below.id, order_index: current.order_index, parent_id: below.parent_id },
    ])
  }

  /** 降级（增加缩进：parent 设为前一个同级章节） */
  async function indentChapter(id) {
    const sorted = [...chapters.value].sort((a, b) => a.order_index - b.order_index)
    const idx = sorted.findIndex((c) => c.id === id)
    if (idx <= 0) return
    const current = sorted[idx]
    const prev = sorted[idx - 1]

    // 将当前章节的 parent 设为前一个章节
    current.parent_id = prev.id
    await chaptersApi.update(id, { parent_id: prev.id })
    // 重排序：将该章节移到子目录最末
    const siblings = chapters.value
      .filter((c) => c.parent_id === prev.id)
      .sort((a, b) => a.order_index - b.order_index)
    const updates = siblings.map((c, i) => ({ id: c.id, order_index: i }))
    await batchReorderChapters(updates)
  }

  /** 升级（减少缩进：parent 设为父章节的 parent） */
  async function outdentChapter(id) {
    const current = chapters.value.find((c) => c.id === id)
    if (!current || !current.parent_id) return

    const parent = chapters.value.find((c) => c.id === current.parent_id)
    current.parent_id = parent ? parent.parent_id : null
    await chaptersApi.update(id, { parent_id: current.parent_id })
    // 重排序
    if (currentProject.value) {
      chapters.value = await chaptersApi.list(currentProject.value.id)
    }
  }

  return {
    // 状态
    projects,
    currentProject,
    chapters,
    activeChapterId,
    activeChapter,
    loading,
    // 方法
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    openProject,
    closeProject,
    addChapter,
    saveChapter,
    removeChapter,
    setActiveChapter,
  }
})

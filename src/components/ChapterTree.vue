<template>
  <div class="chapter-tree">
    <!-- 面板标题 -->
    <div class="panel-header">
      <span class="panel-title">章节目录</span>
      <n-button size="tiny" quaternary @click="emitAdd">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        新增
      </n-button>
    </div>

    <!-- 章节列表 -->
    <div class="tree-list" v-if="items.length > 0">
      <div
        v-for="(chapter, idx) in items"
        :key="chapter.id"
        class="tree-item"
        :class="{
          active: chapter.id === activeId,
          'is-child': chapter.depth > 0,
          'drag-over-top': dragOverTarget === chapter.id && dragOverPos === 'top',
          'drag-over-bottom': dragOverTarget === chapter.id && dragOverPos === 'bottom',
        }"
        :style="{ paddingLeft: 12 + chapter.depth * 20 + 'px' }"
        draggable="true"
        @click="emitSelect(chapter.id)"
        @dragstart="handleDragStart($event, chapter)"
        @dragover="handleDragOver($event, chapter, idx)"
        @drop="handleDrop($event, chapter, idx)"
        @dragend="handleDragEnd"
      >
        <!-- 序号 -->
        <span class="item-index">{{ chapter.depth > 0 ? '└' : idx + 1 }}</span>

        <!-- 图标 -->
        <n-icon size="14" class="item-icon">
          <DocumentTextOutline />
        </n-icon>

        <!-- 标题 -->
        <span class="item-title">{{ chapter.title }}</span>

        <!-- 操作按钮组 -->
        <span class="item-actions" @click.stop>
          <!-- 上移 -->
          <n-button
            size="tiny"
            quaternary
            circle
            :disabled="idx === 0"
            @click="emitMoveUp(chapter.id)"
            title="上移"
          >
            <template #icon><n-icon size="12"><ChevronUpOutline /></n-icon></template>
          </n-button>
          <!-- 下移 -->
          <n-button
            size="tiny"
            quaternary
            circle
            :disabled="idx === items.length - 1"
            @click="emitMoveDown(chapter.id)"
            title="下移"
          >
            <template #icon><n-icon size="12"><ChevronDownOutline /></n-icon></template>
          </n-button>
          <!-- 降级（增加缩进） -->
          <n-button
            size="tiny"
            quaternary
            circle
            :disabled="chapter.depth >= 3"
            @click="emitIndent(chapter.id)"
            title="降级"
          >
            <template #icon><n-icon size="12"><ArrowForwardOutline /></n-icon></template>
          </n-button>
          <!-- 升级（减少缩进） -->
          <n-button
            size="tiny"
            quaternary
            circle
            :disabled="chapter.depth === 0"
            @click="emitOutdent(chapter.id)"
            title="升级"
          >
            <template #icon><n-icon size="12"><ArrowBackOutline /></n-icon></template>
          </n-button>
          <!-- 删除 -->
          <n-button
            size="tiny"
            quaternary
            circle
            @click="emitDelete(chapter.id)"
            title="删除"
          >
            <template #icon><n-icon size="12"><CloseOutline /></n-icon></template>
          </n-button>
        </span>
      </div>
    </div>

    <!-- 空状态 -->
    <n-empty v-else description="暂无章节" class="tree-empty" />
  </div>
</template>

<script setup>
/**
 * 章节目录树组件
 *
 * 功能：
 * - 点击选择章节
 * - 拖拽排序（拖到其他章节上方/下方）
 * - 上下箭头按钮微调顺序
 * - 左右箭头调整层级（降级/升级）
 * - 新增/删除章节
 */
import { computed, ref } from 'vue'
import { NButton, NEmpty, NIcon } from 'naive-ui'
import {
  AddOutline,
  CloseOutline,
  DocumentTextOutline,
  ChevronUpOutline,
  ChevronDownOutline,
  ArrowForwardOutline,
  ArrowBackOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  chapters: { type: Array, default: () => [] },
  activeId: { type: String, default: null },
})

const emit = defineEmits([
  'select',
  'add',
  'delete',
  'move-up',
  'move-down',
  'indent',
  'outdent',
  'reorder',
])

// ========== 展平树（按顺序 + depth） ==========
const items = computed(() => {
  const result = []
  const map = new Map()

  for (const ch of props.chapters) {
    if (!map.has(ch.parent_id)) map.set(ch.parent_id, [])
    map.get(ch.parent_id).push(ch)
  }

  function walk(parentIds, depth) {
    const children = []
    for (const pid of parentIds) {
      const kids = map.get(pid) || []
      children.push(...kids)
    }
    children.sort((a, b) => a.order_index - b.order_index)
    for (const child of children) {
      result.push({ ...child, depth })
      walk([child.id], depth + 1)
    }
  }

  walk([null], 0)
  return result
})

// ========== 拖拽 ==========
const dragData = ref(null)
const dragOverTarget = ref(null)
const dragOverPos = ref(null) // 'top' | 'bottom'

function handleDragStart(event, chapter) {
  dragData.value = chapter
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', chapter.id)
}

function handleDragOver(event, chapter, idx) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  dragOverTarget.value = chapter.id

  const rect = event.currentTarget.getBoundingClientRect()
  const y = event.clientY - rect.top
  dragOverPos.value = y < rect.height / 2 ? 'top' : 'bottom'
}

function handleDrop(event, targetChapter, targetIdx) {
  event.preventDefault()
  const source = dragData.value
  if (!source || source.id === targetChapter.id) {
    handleDragEnd()
    return
  }

  // 计算目标 position（插入在目标之前或之后）
  const insertBefore = dragOverPos.value === 'top'
  // 重新计算所有 order_index
  const newOrder = items.value
    .filter((c) => c.id !== source.id) // 去掉拖动的章节
  const insertAt = newOrder.findIndex((c) => c.id === targetChapter.id)
  if (insertAt === -1) { handleDragEnd(); return }
  const finalIdx = insertBefore ? insertAt : insertAt + 1
  newOrder.splice(finalIdx, 0, source)

  // 生成带 order_index 的更新列表
  const updates = newOrder.map((c, i) => ({
    id: c.id,
    order_index: i,
  }))

  emit('reorder', updates)
  handleDragEnd()
}

function handleDragEnd() {
  dragData.value = null
  dragOverTarget.value = null
  dragOverPos.value = null
}

// ========== 事件转发 ==========
function emitSelect(id) { emit('select', id) }
function emitAdd() { emit('add') }
function emitDelete(id) { emit('delete', id) }
function emitMoveUp(id) { emit('move-up', id) }
function emitMoveDown(id) { emit('move-down', id) }
function emitIndent(id) { emit('indent', id) }
function emitOutdent(id) { emit('outdent', id) }
</script>

<style scoped>
.chapter-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  border-bottom: 1px solid var(--border-light);
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.tree-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.tree-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
  position: relative;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
}
.tree-item:hover {
  background: var(--bg-hover);
}
.tree-item.active {
  background: var(--bg-active);
  color: #3a8a5c;
}
.tree-item.active .item-title {
  font-weight: 600;
}
.tree-item.drag-over-top {
  border-top-color: #8FC9A6;
}
.tree-item.drag-over-bottom {
  border-bottom-color: #8FC9A6;
}
.item-index {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 16px;
  text-align: right;
  flex-shrink: 0;
}
.item-icon {
  flex-shrink: 0;
  opacity: 0.5;
}
.item-title {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.item-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.1s;
}
.tree-item:hover .item-actions {
  opacity: 1;
}
.tree-empty {
  padding: 40px 0;
}
</style>

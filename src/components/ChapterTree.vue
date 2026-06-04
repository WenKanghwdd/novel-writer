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
    <div class="tree-list" v-if="chapters.length > 0">
      <div
        v-for="chapter in flatList"
        :key="chapter.id"
        class="tree-item"
        :class="{
          active: chapter.id === activeId,
          'is-child': chapter.depth > 0,
        }"
        :style="{ paddingLeft: 12 + chapter.depth * 20 + 'px' }"
        draggable="true"
        @click="emitSelect(chapter.id)"
        @dragstart="handleDragStart($event, chapter)"
        @dragover="handleDragOver($event, chapter)"
        @drop="handleDrop($event, chapter)"
        @dragend="handleDragEnd"
      >
        <!-- 图标 -->
        <n-icon size="14" class="item-icon">
          <DocumentTextOutline />
        </n-icon>

        <!-- 标题 -->
        <span class="item-title">{{ chapter.title }}</span>

        <!-- 删除按钮 -->
        <n-button
          size="tiny"
          quaternary
          circle
          class="item-delete"
          @click.stop="emitDelete(chapter.id)"
        >
          <template #icon>
            <n-icon size="12"><CloseOutline /></n-icon>
          </template>
        </n-button>
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
 * 展示项目的章节结构（扁平的树，通过缩进表示层级）。
 * 支持：
 * - 点击选择章节
 * - 拖拽排序（简单的交换 order_index）
 * - 新增/删除章节
 *
 * 注意：目前实现的是单级章节，parent_id 预留但 UI 简化。
 * 未来可以扩展为真正的树形拖拽。
 */
import { computed, ref } from 'vue'
import { NButton, NEmpty, NIcon } from 'naive-ui'
import {
  AddOutline,
  CloseOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  /** 章节列表（扁平数组，含 parent_id） */
  chapters: { type: Array, default: () => [] },
  /** 当前选中章节 ID */
  activeId: { type: String, default: null },
})

const emit = defineEmits(['select', 'add', 'delete'])

// ========== 将扁平章节转换为带缩进深度的层级列表 ==========
const flatList = computed(() => {
  const result = []
  const map = new Map()

  // 先按 parent_id 分组
  for (const ch of props.chapters) {
    if (!map.has(ch.parent_id)) {
      map.set(ch.parent_id, [])
    }
    map.get(ch.parent_id).push(ch)
  }

  // 递归展平（广度优先）
  function walk(parentIds, depth) {
    const children = []
    for (const pid of parentIds) {
      const kids = map.get(pid) || []
      children.push(...kids)
    }
    // 按 order_index 排序
    children.sort((a, b) => a.order_index - b.order_index)
    for (const child of children) {
      result.push({ ...child, depth })
      walk([child.id], depth + 1)
    }
  }

  // 从根级开始（parent_id = null）
  walk([null], 0)
  return result
})

// ========== 拖拽排序状态 ==========
const dragData = ref(null)
const dragOverId = ref(null)

function handleDragStart(event, chapter) {
  dragData.value = chapter
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', chapter.id)
}

function handleDragOver(event, chapter) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  dragOverId.value = chapter.id
}

function handleDrop(event, chapter) {
  event.preventDefault()
  dragOverId.value = null
  // 拖拽排序功能暂不实现真正的排序持久化
  // 目前只完成 UI 层面的拖拽交互，真正的排序更新未来通过
  // 批量更新 order_index 来实现
}

function handleDragEnd() {
  dragData.value = null
  dragOverId.value = null
}

function emitSelect(id) {
  emit('select', id)
}
function emitAdd() {
  emit('add')
}
function emitDelete(id) {
  emit('delete', id)
}
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
  border-bottom: 1px solid #eee;
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.tree-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
  position: relative;
}
.tree-item:hover {
  background: #f0f2f5;
}
.tree-item.active {
  background: #e6f4ff;
  color: #1677ff;
}
.tree-item.active .item-title {
  font-weight: 600;
}
.tree-item.is-child {
  /* 缩进通过 style paddingLeft 控制 */
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
}
.item-delete {
  opacity: 0;
  flex-shrink: 0;
}
.tree-item:hover .item-delete {
  opacity: 1;
}
.tree-empty {
  padding: 40px 0;
}
</style>

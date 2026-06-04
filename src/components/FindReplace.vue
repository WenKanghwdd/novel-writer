<template>
  <div class="find-replace-bar" v-if="visible">
    <div class="fr-row">
      <input
        ref="findInput"
        v-model="findText"
        placeholder="查找…"
        class="fr-input"
        @keydown.enter="findNext"
        @input="findNext"
      />
      <span class="fr-count">{{ matchCount > 0 ? `${currentMatch}/${matchCount}` : '0/0' }}</span>
      <button class="fr-btn" @click="findPrev" title="上一个 (Shift+Enter)">▲</button>
      <button class="fr-btn" @click="findNext" title="下一个 (Enter)">▼</button>
      <button
        class="fr-btn fr-btn-close"
        @click="close"
        title="关闭 (Esc)"
      >✕</button>
    </div>
    <div class="fr-row">
      <input
        v-model="replaceText"
        placeholder="替换为…"
        class="fr-input"
        @keydown.enter="replaceOne"
      />
      <button class="fr-btn fr-btn-primary" @click="replaceOne">替换</button>
      <button class="fr-btn fr-btn-primary" @click="replaceAll">全部替换</button>
    </div>
  </div>
</template>

<script setup>
/**
 * 查找替换组件
 *
 * 直接操作 Vditor 实例，通过 getValue/setValue 实现查找替换。
 * 当前查找位置通过记录光标位置前的匹配次数来定位。
 */
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** 由父组件传入的 Vditor 实例引用 */
  vditor: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const findInput = ref(null)
const findText = ref('')
const replaceText = ref('')
const matchCount = ref(0)
const currentMatch = ref(0)

/** 查找所有匹配位置 */
function findAllMatches(text, search) {
  if (!search) return []
  const positions = []
  let idx = 0
  while (true) {
    const pos = text.indexOf(search, idx)
    if (pos === -1) break
    positions.push(pos)
    idx = pos + search.length
  }
  return positions
}

/** 获取光标在全文中的位置 */
function getCursorOffset() {
  const v = props.vditor
  if (!v) return 0
  try {
    // Vditor IR 模式获取选区
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return 0
    const range = selection.getRangeAt(0)
    // 用整段文本计算光标位置
    const content = v.getValue()
    const preRange = document.createRange()
    preRange.selectNodeContents(range.startContainer)
    preRange.setEnd(range.startContainer, range.startOffset)
    return preRange.toString().length
  } catch {
    return 0
  }
}

/** 跳转到第几个匹配 */
function jumpToMatch(matchIndex) {
  const v = props.vditor
  if (!v || !findText.value) return

  const content = v.getValue()
  const positions = findAllMatches(content, findText.value)
  matchCount.value = positions.length

  if (matchIndex < 0 || matchIndex >= positions.length) return
  currentMatch.value = matchIndex + 1

  // 选中匹配文本（通过操作 DOM）
  const pos = positions[matchIndex]
  const sel = window.getSelection()
  if (!sel) return

  // 在 Vditor 内容中查找文本节点并选中
  const editorEl = v.vditor.editor.element || document.querySelector('.vditor-ir')
  if (!editorEl) return

  let nodeCount = 0
  let found = false

  function walkTextNodes(node) {
    if (found) return
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      const textLen = text.length
      if (nodeCount + textLen >= pos) {
        // 该匹配在 textNode 内
        const offsetInNode = pos - nodeCount
        const matchLen = findText.value.length
        const range = document.createRange()
        range.setStart(node, offsetInNode)
        range.setEnd(node, Math.min(offsetInNode + matchLen, textLen))
        sel.removeAllRanges()
        sel.addRange(range)
        // 滚到选中位置
        node.parentElement?.scrollIntoView?.({ block: 'center' })
        found = true
        return
      }
      nodeCount += textLen
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < node.childNodes.length; i++) {
        walkTextNodes(node.childNodes[i])
        if (found) return
      }
    }
  }

  walkTextNodes(editorEl)

  if (!found) {
    // 回退：使用 Vditor API 选中
    try {
      v.focus()
      // 用 setSelection 或类似方法
    } catch {}
  }
}

/** 查找下一个 */
function findNext() {
  if (!findText.value) return
  const content = props.vditor?.getValue() || ''
  const positions = findAllMatches(content, findText.value)
  matchCount.value = positions.length

  if (positions.length === 0) {
    currentMatch.value = 0
    return
  }

  const cursorOffset = getCursorOffset()

  // 从当前光标后找第一个匹配，否则回到第一个
  let nextIdx = positions.findIndex((p) => p >= cursorOffset + 1)
  if (nextIdx === -1) nextIdx = 0
  if (nextIdx >= positions.length) nextIdx = 0

  jumpToMatch(nextIdx)
}

/** 查找上一个 */
function findPrev() {
  if (!findText.value) return
  const content = props.vditor?.getValue() || ''
  const positions = findAllMatches(content, findText.value)
  matchCount.value = positions.length

  if (positions.length === 0) {
    currentMatch.value = 0
    return
  }

  const cursorOffset = getCursorOffset()
  let prevIdx = positions.findLastIndex((p) => p < cursorOffset - 1)
  if (prevIdx === -1) prevIdx = positions.length - 1

  jumpToMatch(prevIdx)
}

/** 替换当前 */
function replaceOne() {
  const v = props.vditor
  if (!v || !findText.value) return
  const content = v.getValue()
  const positions = findAllMatches(content, findText.value)

  if (positions.length === 0) return

  const cursorOffset = getCursorOffset()
  let currentIdx = positions.findLastIndex((p) => p <= cursorOffset)
  if (currentIdx === -1) currentIdx = 0

  // 替换
  const pos = positions[currentIdx]
  const newContent =
    content.slice(0, pos) +
    replaceText.value +
    content.slice(pos + findText.value.length)
  v.setValue(newContent)

  // 完成后跳转到下一个匹配
  nextTick(() => findNext())
}

/** 全部替换 */
function replaceAll() {
  const v = props.vditor
  if (!v || !findText.value) return

  const content = v.getValue()
  const escaped = findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'g')
  const newContent = content.replace(regex, replaceText.value)
  v.setValue(newContent)

  matchCount.value = 0
  currentMatch.value = 0
}

/** 关闭 */
function close() {
  emit('close')
}

// 监听 visible，打开时自动聚焦
watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        findInput.value?.focus()
        findInput.value?.select()
      })
    }
  }
)
</script>

<style scoped>
.find-replace-bar {
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.fr-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.fr-input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  outline: none;
  background: var(--bg-white);
  color: var(--text-primary);
  min-width: 0;
}
.fr-input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}
.fr-count {
  font-size: 11px;
  color: #999;
  min-width: 40px;
  text-align: center;
  flex-shrink: 0;
}
.fr-btn {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-white);
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.4;
  color: var(--text-primary);
  flex-shrink: 0;
}
.fr-btn:hover {
  background: var(--bg-hover);
}
.fr-btn-primary {
  background: #1677ff;
  color: #fff;
  border-color: #1677ff;
}
.fr-btn-primary:hover {
  background: #4096ff;
}
.fr-btn-close {
  border: none;
  background: transparent;
  font-size: 14px;
  padding: 3px 6px;
}
.fr-btn-close:hover {
  background: #e8e8e8;
}
</style>

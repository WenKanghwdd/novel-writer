<template>
  <n-dropdown
    trigger="click"
    :options="menuOptions"
    @select="handleExport"
  >
    <n-button quaternary size="small">
      <template #icon>
        <n-icon size="16"><DownloadOutline /></n-icon>
      </template>
      导出
    </n-button>
  </n-dropdown>
</template>

<script setup>
/**
 * 导出按钮
 *
 * 支持导出当前章节或全部章节为 .md / .docx
 */
import { computed } from 'vue'
import { NButton, NIcon, NDropdown, useMessage } from 'naive-ui'
import { DownloadOutline } from '@vicons/ionicons5'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

const props = defineProps({
  /** 当前章节内容 */
  currentContent: { type: String, default: '' },
  /** 当前章节标题 */
  currentTitle: { type: String, default: '' },
  /** 全部章节列表（导出全部时用） */
  allChapters: { type: Array, default: () => [] },
  /** 项目标题 */
  projectTitle: { type: String, default: '' },
})

const message = useMessage()

// 下拉菜单选项
const menuOptions = [
  {
    label: '当前章节 → .md',
    key: 'chapter-md',
  },
  {
    label: '当前章节 → .docx',
    key: 'chapter-docx',
  },
  {
    type: 'divider',
    key: 'div1',
  },
  {
    label: '全部章节 → .md',
    key: 'all-md',
  },
  {
    label: '全部章节 → .docx',
    key: 'all-docx',
  },
]

/** 导出入口 */
function handleExport(key) {
  switch (key) {
    case 'chapter-md':
      exportChapterMd()
      break
    case 'chapter-docx':
      exportChapterDocx()
      break
    case 'all-md':
      exportAllMd()
      break
    case 'all-docx':
      exportAllDocx()
      break
  }
}

/** 当前章节 → Markdown */
function exportChapterMd() {
  const title = props.currentTitle || '未命名章节'
  const content = `# ${title}\n\n${props.currentContent}`
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${title}.md`)
  message.success('已导出 Markdown')
}

/** 当前章节 → Word */
async function exportChapterDocx() {
  try {
    const doc = new Document({
      title: props.currentTitle,
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: props.currentTitle, bold: true, size: 32 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            ...markdownToDocxParagraphs(props.currentContent),
          ],
        },
      ],
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${props.currentTitle || '未命名章节'}.docx`)
    message.success('已导出 Word')
  } catch (err) {
    message.error('导出失败：' + (err.message || ''))
  }
}

/** 全部章节 → Markdown */
function exportAllMd() {
  const sorted = [...props.allChapters].sort((a, b) => a.order_index - b.order_index)
  let content = `# ${props.projectTitle || '小说合集'}\n\n`
  for (const ch of sorted) {
    content += `## ${ch.title}\n\n${ch.content || ''}\n\n---\n\n`
  }
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${props.projectTitle || '小说合集'}.md`)
  message.success('已导出 Markdown')
}

/** 全部章节 → Word */
async function exportAllDocx() {
  try {
    const sorted = [...props.allChapters].sort((a, b) => a.order_index - b.order_index)
    const children = [
      new Paragraph({
        children: [new TextRun({ text: props.projectTitle || '小说合集', bold: true, size: 36 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
    ]

    for (const ch of sorted) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, bold: true, size: 28 })],
          spacing: { before: 400, after: 200 },
        })
      )
      children.push(...markdownToDocxParagraphs(ch.content || ''))
      // 章节间分页
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', size: 1 })],
          pageBreakBefore: true,
        })
      )
    }

    const doc = new Document({
      title: props.projectTitle,
      sections: [{ children }],
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${props.projectTitle || '小说合集'}.docx`)
    message.success('已导出 Word')
  } catch (err) {
    message.error('导出失败：' + (err.message || ''))
  }
}

/**
 * 简易 Markdown 转 docx 段落
 * 支持：普通段落、标题（# ##）、粗体、列表
 */
function markdownToDocxParagraphs(md) {
  if (!md) return []
  const lines = md.split('\n')
  const paragraphs = []

  for (const line of lines) {
    const trimmed = line.trim()

    // 空行
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: 120 } }))
      continue
    }

    // 标题 h1
    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.slice(2), bold: true, size: 28 })],
          spacing: { before: 300, after: 200 },
        })
      )
      continue
    }
    // 标题 h2
    if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.slice(3), bold: true, size: 24 })],
          spacing: { before: 200, after: 150 },
        })
      )
      continue
    }
    // 标题 h3
    if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.slice(4), bold: true, size: 22 })],
          spacing: { before: 150, after: 100 },
        })
      )
      continue
    }

    // 无序列表
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.slice(2) })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      )
      continue
    }
    // 有序列表
    if (/^\d+\.\s/.test(trimmed)) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/^\d+\.\s/, '') })],
          numbering: { reference: 'default', level: 0 },
          spacing: { after: 60 },
        })
      )
      continue
    }

    // 普通段落（处理粗体）
    const runs = parseBoldText(trimmed)
    paragraphs.push(
      new Paragraph({
        children: runs,
        spacing: { after: 120 },
      })
    )
  }

  return paragraphs
}

/** 解析 **粗体** 文本 */
function parseBoldText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true, size: 21 })
    }
    return new TextRun({ text: part, size: 21 })
  })
}
</script>

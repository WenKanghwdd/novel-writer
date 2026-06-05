/**
 * 字数统计工具
 *
 * 中文：每个汉字算 1 字
 * 英文/数字：按空格分词，每个连续字母/数字序列算 1 词
 * 标点符号、空白字符不计
 */

export function countWords(text) {
  if (!text || typeof text !== 'string') return 0

  let count = 0

  // 中文汉字（CJK 统一表意文字 + 扩展 A + 兼容表意文字）
  const chineseChars = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g)
  if (chineseChars) count += chineseChars.length

  // 英文单词和数字（连续的字母或数字，含撇号如 don't）
  const englishWords = text.match(/[a-zA-Z0-9]+(?:[''][a-zA-Z0-9]+)*/g)
  if (englishWords) count += englishWords.length

  return count
}

/**
 * 格式化字数（如 12345 → "12,345字"）
 */
export function formatWordCount(count) {
  if (!count || count === 0) return '0 字'
  return count.toLocaleString() + ' 字'
}

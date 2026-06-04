/**
 * Supabase 客户端初始化
 *
 * 所有数据库操作均通过此客户端执行。
 * 环境变量从 .env 文件读取（VITE_ 前缀自动暴露给前端）。
 */
import { createClient } from '@supabase/supabase-js'

// 从环境变量读取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] 缺少配置！请创建 .env 文件，参考 .env.example 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
  )
}

// 创建 Supabase 客户端
// 单用户开发模式，直接使用 anon key（RLS 已设为允许所有）
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false, // 单用户模式，不保存登录态
      autoRefreshToken: false,
    },
  }
)

/** 当前硬编码的用户 ID（后续改为多用户后从 auth 获取） */
export const DEV_USER_ID = 'local-dev-user'

/**
 * 项目数据库操作
 */
export const projectsApi = {
  /** 获取所有项目，按更新时间降序 */
  async list() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', DEV_USER_ID)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  },

  /** 创建新项目 */
  async create({ title, synopsis = '' }) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: DEV_USER_ID, title, synopsis })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** 更新项目基本信息 */
  async update(id, fields) {
    const { data, error } = await supabase
      .from('projects')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** 删除项目（章节会通过外键 CASCADE 自动删除） */
  async remove(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },
}

/**
 * 章节数据库操作
 */
export const chaptersApi = {
  /** 获取某项目所有章节，按排序索引升序 */
  async list(projectId) {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
    if (error) throw error
    return data
  },

  /** 创建新章节 */
  async create({ project_id, parent_id = null, title = '未命名章节', order_index = 0 }) {
    const { data, error } = await supabase
      .from('chapters')
      .insert({ project_id, parent_id, title, order_index })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** 更新章节内容（用于自动保存） */
  async update(id, fields) {
    const { data, error } = await supabase
      .from('chapters')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /** 批量更新排序（拖拽后调用） */
  async batchUpdateOrder(updates) {
    // updates: [{ id, order_index, parent_id }]
    for (const item of updates) {
      const { error } = await supabase
        .from('chapters')
        .update({ order_index: item.order_index, parent_id: item.parent_id })
        .eq('id', item.id)
      if (error) throw error
    }
  },

  /** 删除章节 */
  async remove(id) {
    const { error } = await supabase.from('chapters').delete().eq('id', id)
    if (error) throw error
  },
}

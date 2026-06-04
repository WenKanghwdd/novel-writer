/**
 * Supabase 客户端 + API 封装
 *
 * 支持 Supabase Auth 登录/注册，
 * 所有数据库操作用当前登录用户。
 */
import { createClient } from '@supabase/supabase-js'

// 从环境变量读取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] 缺少配置！请创建 .env 文件'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,       // 保持登录状态
      autoRefreshToken: true,     // 自动刷新 token
      detectSessionInUrl: true,   // 检测 OAuth 回调
    },
  }
)

// ==================== 认证 API ====================

export const authApi = {
  /** 注册 */
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  },

  /** 登录 */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /** 退出 */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /** 获取当前用户 */
  getUserId() {
    return supabase.auth.getUser().then(({ data }) => data.user?.id || null)
  },

  /** 监听登录状态变化 */
  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session?.user || null)
    })
  },
}

// ==================== 项目 API ====================

export const projectsApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create({ userId, title, synopsis = '' }) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, title, synopsis })
      .select()
      .single()
    if (error) throw error
    return data
  },

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

  async remove(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },
}

// ==================== 章节 API ====================

export const chaptersApi = {
  async list(projectId) {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
    if (error) throw error
    return data
  },

  async create({ project_id, parent_id = null, title = '未命名章节', order_index = 0 }) {
    const { data, error } = await supabase
      .from('chapters')
      .insert({ project_id, parent_id, title, order_index })
      .select()
      .single()
    if (error) throw error
    return data
  },

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

  async batchUpdateOrder(updates) {
    for (const item of updates) {
      const { error } = await supabase
        .from('chapters')
        .update({ order_index: item.order_index, parent_id: item.parent_id })
        .eq('id', item.id)
      if (error) throw error
    }
  },

  async remove(id) {
    const { error } = await supabase.from('chapters').delete().eq('id', id)
    if (error) throw error
  },
}

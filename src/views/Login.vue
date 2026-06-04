<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="logo">📖 哈哈哈</h1>
      <p class="subtitle">小说写作管理工具</p>

      <n-tabs type="line" animated :value="tab" @update:value="tab = $event">
        <!-- 登录 -->
        <n-tab-pane name="login" tab="登录">
          <n-form label-placement="top" size="large">
            <n-form-item label="邮箱">
              <n-input v-model:value="email" placeholder="your@email.com" />
            </n-form-item>
            <n-form-item label="密码">
              <n-input
                v-model:value="password"
                type="password"
                show-password-on="click"
                placeholder="密码"
                @keyup.enter="handleSignIn"
              />
            </n-form-item>
            <n-button
              type="primary"
              block
              size="large"
              :loading="loading"
              @click="handleSignIn"
            >
              登录
            </n-button>
          </n-form>
        </n-tab-pane>

        <!-- 注册 -->
        <n-tab-pane name="signup" tab="注册">
          <n-form label-placement="top" size="large">
            <n-form-item label="邮箱">
              <n-input v-model:value="email" placeholder="your@email.com" />
            </n-form-item>
            <n-form-item label="密码">
              <n-input
                v-model:value="password"
                type="password"
                show-password-on="click"
                placeholder="至少 6 位"
              />
            </n-form-item>
            <n-button
              type="primary"
              block
              size="large"
              :loading="loading"
              @click="handleSignUp"
            >
              注册
            </n-button>
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <!-- 错误提示 -->
      <n-alert v-if="error" type="error" :title="error" closable class="error-alert" />
    </div>
  </div>
</template>

<script setup>
/**
 * 登录/注册页面
 *
 * 使用 Supabase Auth 的 email/password 认证。
 * 登录成功后自动跳转到项目列表页。
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton, NForm, NFormItem, NInput, NTabs, NTabPane,
  NAlert,
} from 'naive-ui'
import { authApi, supabase } from '@/lib/supabase'

const router = useRouter()
const tab = ref('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

/** 检查是否已登录 */
onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    router.push('/')
  }
})

/** 登录 */
async function handleSignIn() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = '请填写邮箱和密码'
    return
  }
  loading.value = true
  try {
    await authApi.signIn(email.value.trim(), password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message || '登录失败'
  } finally {
    loading.value = false
  }
}

/** 注册 */
async function handleSignUp() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = '请填写邮箱和密码'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码至少 6 位'
    return
  }
  loading.value = true
  try {
    await authApi.signUp(email.value.trim(), password.value)
    error.value = '注册成功！请检查邮箱确认（或在 Supabase 中关闭邮箱确认）'
  } catch (err) {
    error.value = err.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  padding: 20px;
}
.login-card {
  width: 400px;
  max-width: 100%;
  background: var(--bg-white);
  border-radius: 12px;
  padding: 40px 32px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}
.logo {
  text-align: center;
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 32px;
}
.error-alert {
  margin-top: 16px;
}
</style>

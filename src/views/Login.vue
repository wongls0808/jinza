<template>
  <div class="login-page">
    <div class="layout">
      <div class="left">
        <img class="illus" src="/illustrations/login-hero.svg" alt="login-illustration" />
        <div class="hero">
          <div class="brand">{{ t('app.title') }}</div>
          <div class="sub">{{ t('login.title') }}</div>
        </div>
      </div>
      <el-card class="login-card card jelly" v-tilt="tiltOpts">
        <el-form @submit.prevent class="login-form" label-position="top">
        <el-form-item :label="t('login.username')">
          <el-input v-model.trim="form.username" :placeholder="t('login.username')">
            <template #prefix><User /></template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('login.password')">
          <el-input v-model.trim="form.password" type="password" show-password :placeholder="t('login.password')">
            <template #prefix><Lock /></template>
          </el-input>
        </el-form-item>
        <div class="actions">
          <el-checkbox v-model="remember">记住我</el-checkbox>
          <div class="spacer"></div>
          <el-button type="primary" :loading="submitting" @click="onSubmit">{{ t('login.submit') }}</el-button>
        </div>
        <div class="hint">使用在 Railway/本地数据库中的用户进行登录</div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const form = ref({ username: '', password: '' })
const remember = ref(true)
const tiltOpts = ref(matchMedia('(max-width: 640px)').matches ? { max: 0, scale: 1 } : { max: 12, scale: 1.02 })
// 监听窗口尺寸变化，移动端禁用 3D 倾斜
if (typeof window !== 'undefined') {
  const m = matchMedia('(max-width: 640px)')
  const update = () => (tiltOpts.value = m.matches ? { max: 0, scale: 1 } : { max: 12, scale: 1.02 })
  m.addEventListener?.('change', update)
}
const submitting = ref(false)
const { t } = useI18n()

const { save } = useAuth()

const onSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning(t('login.username') + '/' + t('login.password') + ' 不能为空')
    return
  }
  submitting.value = true
  try {
  const res = await api.login(form.value.username, form.value.password)
    // Persist token, user, perms
  save({ token: res.token, user: res.user, perms: res.perms, must_change_password: !!res.must_change_password })
  if (!remember.value) {
    // 会话模式：刷新即失效
    sessionStorage.setItem('auth_session', '1')
  } else {
    sessionStorage.removeItem('auth_session')
  }
  const redirect = res.must_change_password ? '/change-password' : (route.query.redirect || '/')
  router.replace(String(redirect))
  ElMessage.success(t('login.title') + '成功')
  } catch (e) {
  try {
    const data = JSON.parse(e.message)
    ElMessage.error('登录失败：' + (data.error || ''))
  } catch {
    ElMessage.error('登录失败：' + (e.message || 'unknown error'))
  }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: calc(100vh - 56px); background: radial-gradient(1200px 600px at 70% -200px, color-mix(in oklab, var(--el-color-primary) 16%, transparent), transparent), var(--el-bg-color-page); padding: 24px 16px; }
.layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: center; max-width: 1100px; margin: 0 auto; }
.left { display: grid; justify-items: center; gap: 10px; }
.illus { width: 100%; max-width: 560px; height: auto; }
.hero { text-align: center; }
.brand { font-size: 22px; font-weight: 700; letter-spacing: .2px; }
.sub { color: var(--el-text-color-secondary); font-size: 13px; margin-top: 2px; }
.login-card { width: 100%; max-width: 420px; }
.login-form { display: grid; gap: 14px; }
.hint { color: var(--el-text-color-secondary); font-size: 12px; text-align: center; margin-top: 8px; }
.actions { display: flex; align-items: center; gap: 10px; }
.spacer { flex: 1; }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .illus { max-width: 420px; }
}
</style>


<template>
  <div class="login-modern-bg">
    <div class="login-modern-center">
      <div class="login-modern-card" v-tilt="tiltOpts">
        <div class="login-modern-logo">
          <!-- 3D SVG 图标，可替换为 IconPark 3D 图标 -->
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="url(#g1)"/><path d="M24 14L34 34H14L24 14Z" fill="url(#g2)"/><defs><radialGradient id="g1" cx="0" cy="0" r="1" gradientTransform="translate(24 24) scale(22)" ><stop stop-color="#4f8cff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="g2" x1="24" y1="14" x2="24" y2="34" gradientUnits="userSpaceOnUse"><stop stop-color="#4f8cff"/><stop offset="1" stop-color="#a1e3ff"/></linearGradient></defs></svg>
        </div>
        <div class="login-modern-title">{{ t('app.title') }}</div>
        <div class="login-modern-sub">{{ t('login.title') }}</div>
        <el-form @submit.prevent class="login-modern-form" label-position="top">
          <el-form-item :label="t('login.username')">
            <el-input v-model.trim="form.username" :placeholder="t('login.usernamePlaceholder')" size="large" clearable>
              <template #prefix>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" fill="#4f8cff"/><path d="M11 6a3 3 0 110 6 3 3 0 010-6zm0 8c-3.33 0-5 1.67-5 2.5V18h10v-1.5c0-.83-1.67-2.5-5-2.5z" fill="#fff"/></svg>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item :label="t('login.password')">
            <el-input v-model.trim="form.password" type="password" show-password :placeholder="t('login.passwordPlaceholder')" size="large" clearable>
              <template #prefix>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="10" width="14" height="8" rx="2" fill="#4f8cff"/><circle cx="11" cy="14" r="2" fill="#fff"/><rect x="7" y="6" width="8" height="4" rx="2" fill="#a1e3ff"/></svg>
              </template>
            </el-input>
          </el-form-item>
          <div class="login-modern-actions">
            <el-checkbox v-model="remember">{{ t('login.rememberMe') }}</el-checkbox>
            <div class="spacer"></div>
            <el-button type="primary" size="large" :loading="submitting" @click="onSubmit">{{ t('login.submit') }}</el-button>
          </div>
          <div class="login-modern-hint">{{ t('login.hint') }}</div>
        </el-form>
      </div>
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
<style scoped>
.login-modern-bg {
  min-height: 100vh;
  background: linear-gradient(120deg, #e3f0ff 0%, #f8fbff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.login-modern-center {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-modern-card {
  background: rgba(255,255,255,0.85);
  box-shadow: 0 8px 32px rgba(79,140,255,0.12), 0 1.5px 8px rgba(79,140,255,0.08);
  border-radius: 24px;
  padding: 38px 32px 32px 32px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn .7s cubic-bezier(.4,0,.2,1);
}
.login-modern-logo {
  margin-bottom: 18px;
  filter: drop-shadow(0 2px 8px #4f8cff33);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}
.login-modern-card:hover .login-modern-logo {
  transform: scale(1.08) rotateX(12deg) rotateY(-8deg);
}
.login-modern-title {
  font-size: 24px;
  font-weight: 700;
  color: #4f8cff;
  letter-spacing: .2px;
  margin-bottom: 2px;
}
.login-modern-sub {
  color: #6b7b8c;
  font-size: 15px;
  margin-bottom: 18px;
}
.login-modern-form {
  width: 100%;
  display: grid;
  gap: 18px;
}
.login-modern-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.login-modern-hint {
  color: #6b7b8c;
  font-size: 13px;
  text-align: center;
  margin-top: 16px;
}
.spacer { flex: 1; }
@media (max-width: 600px) {
  .login-modern-card {
    padding: 24px 8px 18px 8px;
    border-radius: 16px;
    max-width: 98vw;
  }
  .login-modern-title { font-size: 20px; }
  .login-modern-sub { font-size: 13px; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: none; }
}
</style>
</style>

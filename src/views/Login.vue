<template>
  <div class="login-page compact" :class="{ 'with-video': enableVideo }">
    <div class="video-bg" v-if="enableVideo">
      <video ref="bgVideo" class="bg-video" :src="videoSrc" autoplay muted loop playsinline preload="auto"
             @canplay="onVideoReady" @error="onVideoError"></video>
      <div class="video-overlay"></div>
    </div>
    <div class="login-container">
      <div class="single-panel">
        <div class="lang-toggle" aria-label="language switch">
          <span :class="{active: locale.value==='zh'}" @click="setLang('zh')">CN</span>
          <span class="sep">|</span>
          <span :class="{active: locale.value==='en'}" @click="setLang('en')">EN</span>
        </div>
        <div class="logo-mini">{{ t('app.title') }}</div>
        <el-form @submit.prevent="onSubmit" class="login-form" label-position="top">
          <el-form-item :label="t('login.username')">
            <el-input v-model.trim="form.username" :placeholder="t('login.username')" size="large" autofocus @keyup.enter="focusPassword">
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item :label="t('login.password')">
            <el-input ref="passwordInput" v-model.trim="form.password" type="password" show-password size="large" :placeholder="t('login.password')" @keyup.enter="onSubmit">
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>
          <div class="login-options">
            <el-checkbox v-model="remember">{{ rememberLabel }}</el-checkbox>
          </div>
          <el-button type="primary" :loading="submitting" @click="onSubmit" class="login-button" size="large" round>
            {{ t('login.submit') }}
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const form = ref({ username: '', password: '' })
const remember = ref(true)
const submitting = ref(false)
const passwordInput = ref(null)
const { t, locale } = useI18n()
// 记住我标签：中文界面仅中文，英文界面仅英文
const rememberLabel = computed(()=> t('login.rememberMe'))
const { save } = useAuth()

function setLang(value){
  if(locale.value===value) return
  locale.value = value
  sessionStorage.setItem('lang', value)
  localStorage.setItem('lang', value)
}

const focusPassword = () => { passwordInput.value && passwordInput.value.focus() }

const onSubmit = async () => {
  if(!form.value.username || !form.value.password){
    ElMessage({ message: t('login.errors.missingCredentials'), type:'warning', duration:2000 })
    return
  }
  submitting.value = true
  try {
    const res = await api.login(form.value.username, form.value.password)
    save({ token:res.token, user:res.user, perms:res.perms, must_change_password:!!res.must_change_password }, remember.value)
    if(remember.value){
      localStorage.setItem('remember_auth','1'); sessionStorage.removeItem('auth_session')
    } else {
      localStorage.removeItem('remember_auth'); sessionStorage.setItem('auth_session','1')
    }
    const redirect = res.must_change_password ? '/change-password' : (route.query.redirect || '/')
    if (res.must_change_password) {
      ElMessage({ message: t('login.firstLoginTip'), type:'warning', duration:1800 })
    } else {
      ElMessage({ message: t('login.successEntering'), type:'success', duration:1500 })
    }
    setTimeout(()=>{ window.location.href = redirect === '/' ? '/' : String(redirect) }, 500)
  } catch(e){
    const code = e?.code
    let text = ''
    if (code === 'MISSING_CREDENTIALS') text = t('login.errors.missingCredentials')
    else if (code === 'USER_NOT_FOUND') text = t('login.errors.userNotFound')
    else if (code === 'USER_DISABLED') text = t('login.errors.userDisabled')
    else if (code === 'INVALID_PASSWORD') text = t('login.errors.invalidPassword')
    else {
      // 兼容旧服务：尝试解析 message 为 JSON 或使用原始 message
      try { const data = JSON.parse(e.message); text = data?.error || data?.message || '' } catch { text = e?.message || '' }
    }
  if (!text) text = t('login.errors.defaultError')
  ElMessage({ message: t('login.failedWithMsg', { msg: text }), type:'error', duration:3200 })
  } finally { submitting.value = false }
}

onMounted(()=>{})
const videoSrc = 'https://cdn.marmot-cloud.com/storage/intl_website/2025/07/03/EW8bvlo/globe.mp4'
const bgVideo = ref(null)
const enableVideo = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
function onVideoReady(){}
function onVideoError(){}
</script>

<style scoped>
.video-bg { position:fixed; inset:0; overflow:hidden; z-index:0; }
.bg-video { width:100%; height:100%; object-fit:cover; filter:brightness(.52) saturate(1.15); }
.video-overlay { position:absolute; inset:0; background:radial-gradient(circle at 35% 40%, rgba(255,255,255,0.15), rgba(0,0,0,0.70)); backdrop-filter: blur(2px); }
.login-page { position:relative; z-index:1; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:30px 20px; }
.login-container { position:relative; z-index:2; width:100%; max-width:480px; }
.single-panel { position:relative; width:100%; padding:38px 36px 44px; border-radius:30px; background:rgba(255,255,255,0.065); backdrop-filter:blur(28px) saturate(1.9); -webkit-backdrop-filter:blur(28px) saturate(1.9); box-shadow:0 8px 42px -10px rgba(0,0,0,0.55), 0 2px 6px -2px rgba(0,0,0,0.4); overflow:hidden; }
.single-panel:before { content:""; position:absolute; inset:0; background:linear-gradient(140deg,rgba(255,255,255,0.20),rgba(255,255,255,0.04) 60%,rgba(255,255,255,0.15)); pointer-events:none; }
.single-panel:after { content:""; position:absolute; inset:0; border:1px solid rgba(255,255,255,0.25); border-radius:30px; pointer-events:none; mix-blend-mode:overlay; }
.logo-mini { font-size:18px; font-weight:700; letter-spacing:.5px; color:#fff; opacity:.92; margin-bottom:14px; text-shadow:0 2px 6px rgba(0,0,0,0.4); text-align:center; width:100%; }
.login-header, .welcome-text, .login-subtext { display:none; }
.login-form { display:flex; flex-direction:column; gap:18px; }
.login-form :deep(.el-form-item__label){ color:#fff; font-weight:600; letter-spacing:.5px; font-size:13px; }
.login-form :deep(.el-input__wrapper){ background:rgba(255,255,255,0.22) !important; box-shadow:0 0 0 1px rgba(255,255,255,0.30) inset, 0 2px 4px -1px rgba(0,0,0,0.35); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); border-radius:14px; transition:box-shadow .25s, background .25s; }
.login-form :deep(.el-input__wrapper:hover){ box-shadow:0 0 0 1px rgba(255,255,255,0.55) inset, 0 2px 6px -1px rgba(0,0,0,0.45); }
.login-form :deep(.is-focus.el-input__wrapper){ box-shadow:0 0 0 2px rgba(var(--el-color-primary-rgb),.85) inset, 0 3px 10px -2px rgba(var(--el-color-primary-rgb),.55); background:rgba(255,255,255,0.30) !important; }
.login-form :deep(.el-input__inner){ color:#fff; font-weight:600; letter-spacing:.5px; }
.login-form :deep(.el-input__prefix){ color:#fff; }
.login-form :deep(.el-checkbox__label){ color:#fff; font-weight:500; }
.login-options { display:flex; justify-content:space-between; align-items:center; margin:0; }
.login-button { width:100%; height:48px; margin-top:4px; font-size:15px; font-weight:700; letter-spacing:1px; background:linear-gradient(135deg,var(--el-color-primary), var(--el-color-primary-dark-2)); border:none; box-shadow:0 6px 18px -4px rgba(0,0,0,0.55), 0 2px 6px -2px rgba(0,0,0,0.4); transition:transform .2s, filter .2s; }
.login-button:hover { filter:brightness(1.08); }
.login-button:active { transform:translateY(1px); }
.login-footer, .system-info, .lang-selector { display:none !important; }
.lang-toggle { position:absolute; top:14px; right:18px; font-size:12px; font-weight:600; letter-spacing:.5px; color:rgba(255,255,255,0.55); user-select:none; display:flex; align-items:center; gap:6px; }
.lang-toggle span { cursor:pointer; transition:color .25s, text-shadow .25s; }
.lang-toggle span.active { color:#fff; text-shadow:0 0 6px rgba(255,255,255,0.6); }
.lang-toggle .sep { opacity:.4; cursor:default; }
.with-video .single-panel { animation: panelFadeIn .9s cubic-bezier(.22,.98,.34,1.02) both; }
@keyframes panelFadeIn { 0% { opacity:0; transform:translateY(34px) scale(.97); } 55% { opacity:1; transform:translateY(0) scale(1.01);} 100% { opacity:1; transform:translateY(0) scale(1);} }
@media (max-width:600px){ .single-panel { padding:34px 28px 40px; border-radius:26px; } .welcome-text{ font-size:26px; } }
@media (max-width:420px){ .single-panel { padding:30px 22px 36px; } .welcome-text{ font-size:24px; } }
</style>

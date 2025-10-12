<template>
  <div class="login-page">
    <div class="layout">
      <div class="left">
        <img 
          class="illus" 
          src="/illustrations/login-hero.svg" 
          alt="login-illustration" 
          loading="lazy"
        />
        <div class="hero">
          <h1 class="brand">{{ t('app.title') }}</h1>
          <p class="sub">{{ t('login.title') }}</p>
        </div>
      </div>

      <el-card class="login-card card jelly" v-tilt="tiltOptions">
        <el-form 
          ref="formRef"
          :model="form"
          :rules="formRules"
          @submit.prevent="handleSubmit"
          class="login-form"
          label-position="top"
        >
          <el-form-item :label="t('login.username')" prop="username">
            <el-input
              v-model.trim="form.username"
              :placeholder="t('login.username')"
              :disabled="submitting"
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <User class="input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item :label="t('login.password')" prop="password">
            <el-input
              v-model.trim="form.password"
              type="password"
              show-password
              :placeholder="t('login.password')"
              :disabled="submitting"
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <Lock class="input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <div class="actions">
            <el-checkbox v-model="remember" :disabled="submitting">
              {{ t('login.rememberMe') }}
            </el-checkbox>
            <div class="spacer"></div>
            <el-button 
              type="primary" 
              :loading="submitting" 
              @click="handleSubmit"
              native-type="submit"
            >
              {{ t('login.submit') }}
            </el-button>
          </div>

          <div class="hint">
            {{ t('login.hint') }}
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { User, Lock } from '@element-plus/icons-vue'

// Composables
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { save } = useAuth()

// Refs
const formRef = ref()
const submitting = ref(false)
const remember = ref(true)
const mediaQuery = ref(null)

// Reactive data
const form = reactive({
  username: '',
  password: ''
})

// Computed
const tiltOptions = computed(() => {
  const isMobile = mediaQuery.value?.matches ?? false
  return isMobile ? { max: 0, scale: 1 } : { max: 12, scale: 1.02 }
})

// Form validation rules
const formRules = {
  username: [
    { required: true, message: t('login.usernameRequired'), trigger: 'blur' },
    { min: 2, message: t('login.usernameMinLength'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('login.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('login.passwordMinLength'), trigger: 'blur' }
  ]
}

// Methods
const handleMediaQueryChange = () => {
  // Trigger computed property update
  mediaQuery.value = matchMedia('(max-width: 640px)')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    await performLogin()
  } catch (error) {
    // Validation failed, do nothing as errors are shown automatically
    console.log('Form validation failed:', error)
  }
}

const performLogin = async () => {
  submitting.value = true
  
  try {
    const response = await api.login(form.username, form.password)
    
    // Persist authentication data
    save({ 
      token: response.token, 
      user: response.user, 
      perms: response.perms, 
      must_change_password: !!response.must_change_password 
    })
    
    // Handle session storage based on remember preference
    if (!remember.value) {
      sessionStorage.setItem('auth_session', '1')
    } else {
      sessionStorage.removeItem('auth_session')
    }
    
    // Determine redirect path
    const redirectPath = response.must_change_password 
      ? '/change-password' 
      : (route.query.redirect || '/')
    
    // Navigate and show success message
    await router.replace(String(redirectPath))
    ElMessage.success(t('login.success'))
    
  } catch (error) {
    handleLoginError(error)
  } finally {
    submitting.value = false
  }
}

const handleLoginError = (error) => {
  let errorMessage = t('login.unknownError')
  
  try {
    const errorData = JSON.parse(error.message)
    errorMessage = errorData.error || errorData.message || t('login.failed')
  } catch {
    errorMessage = error.message || t('login.failed')
  }
  
  ElMessage.error(`${t('login.failed')}: ${errorMessage}`)
}

// Lifecycle
onMounted(() => {
  // Set up media query listener
  mediaQuery.value = matchMedia('(max-width: 640px)')
  
  if (mediaQuery.value.addEventListener) {
    mediaQuery.value.addEventListener('change', handleMediaQueryChange)
  }
})

onUnmounted(() => {
  // Clean up media query listener
  if (mediaQuery.value?.removeEventListener) {
    mediaQuery.value.removeEventListener('change', handleMediaQueryChange)
  }
})
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 56px);
  background: 
    radial-gradient(
      1200px 600px at 70% -200px,
      color-mix(in oklab, var(--el-color-primary) 16%, transparent),
      transparent
    ),
    var(--el-bg-color-page);
  padding: 24px 16px;
}

.layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
}

.left {
  display: grid;
  justify-items: center;
  gap: 16px;
}

.illus {
  width: 100%;
  max-width: 560px;
  height: auto;
  transition: transform 0.3s ease;
}

.hero {
  text-align: center;
}

.brand {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin: 0;
  color: var(--el-text-color-primary);
}

.sub {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 8px 0 0 0;
}

.login-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.login-form {
  display: grid;
  gap: 20px;
}

.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  margin-top: 12px;
  line-height: 1.4;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spacer {
  flex: 1;
}

.input-icon {
  color: var(--el-text-color-secondary);
}

/* Responsive design */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .illus {
    max-width: 420px;
  }
  
  .brand {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px 12px;
  }
  
  .layout {
    gap: 20px;
  }
  
  .illus {
    max-width: 320px;
  }
  
  .login-card {
    max-width: 100%;
  }
  
  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .spacer {
    display: none;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .illus,
  .login-card {
    transition: none;
  }
}
</style>
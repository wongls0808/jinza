<template>
  <div class="login-page">
    <div class="login-container">
      <div class="left-panel">
        <div class="brand-container">
          <h1 class="brand-name">{{ t('app.title') }}</h1>
          <p class="brand-tagline">{{ t('login.tagline') }}</p>
        </div>
        <img class="login-illustration" src="/illustrations/login-hero.svg" alt="login-illustration" />
        <div class="features-list">
          <div class="feature-item">
            <el-icon><Document /></el-icon>
            <span>{{ t('login.feature1') }}</span>
          </div>
          <div class="feature-item">
            <el-icon><Setting /></el-icon>
            <span>{{ t('login.feature2') }}</span>
          </div>
          <div class="feature-item">
            <el-icon><UserFilled /></el-icon>
            <span>{{ t('login.feature3') }}</span>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="login-header">
          <h2 class="welcome-text">{{ t('login.welcome') }}</h2>
          <p class="login-subtext">{{ t('login.title') }} {{ t('login.continueText') }}</p>
        </div>
        
        <el-card class="login-form-card" shadow="hover" :body-style="{padding: '30px'}">
          <el-form @submit.prevent="onSubmit" class="login-form" label-position="top">
            <el-form-item :label="t('login.username')">
              <el-input 
                v-model.trim="form.username" 
                :placeholder="t('login.username')"
                size="large"
                autofocus
                @keyup.enter="focusPassword">
                <template #prefix><el-icon><User /></el-icon></template>
              </el-input>
            </el-form-item>
            
            <el-form-item :label="t('login.password')">
              <el-input 
                ref="passwordInput"
                v-model.trim="form.password" 
                type="password" 
                show-password 
                size="large"
                :placeholder="t('login.password')"
                @keyup.enter="onSubmit">
                <template #prefix><el-icon><Lock /></el-icon></template>
              </el-input>
            </el-form-item>
            
            <div class="login-options">
              <el-checkbox v-model="remember">{{ t('login.rememberMe') }}</el-checkbox>
            </div>
            
            <el-button 
              type="primary" 
              :loading="submitting" 
              @click="onSubmit" 
              class="login-button"
              size="large"
              round>
              {{ t('login.submit') }}
            </el-button>
          </el-form>
          
          <div class="login-footer">
            <div class="system-info">
              <span>{{ t('login.systemVersion') }} v1.0.0</span>
              <span>© {{ new Date().getFullYear() }} {{ t('login.systemName') }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Lock, 
  Document, 
  Setting, 
  UserFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const form = ref({ username: '', password: '' })
const remember = ref(true)
const submitting = ref(false)
const passwordInput = ref(null)
const { t } = useI18n()

const { save } = useAuth()

// 在用户名输入后按回车键，聚焦到密码输入框
const focusPassword = () => {
  if (passwordInput.value) {
    passwordInput.value.focus()
  }
}

const onSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage({
      message: t('login.username') + '/' + t('login.password') + ' 不能为空',
      type: 'warning',
      duration: 2000
    })
    return
  }
  
  submitting.value = true
  
  try {
    const res = await api.login(form.value.username, form.value.password)
    
    // 保存登录信息
    save({ 
      token: res.token, 
      user: res.user, 
      perms: res.perms, 
      must_change_password: !!res.must_change_password 
    })
    
    // 记住登录状态设置
    if (!remember.value) {
      // 会话模式：刷新即失效
      sessionStorage.setItem('auth_session', '1')
    } else {
      sessionStorage.removeItem('auth_session')
    }
    
    // 处理重定向
    const redirect = res.must_change_password 
      ? '/change-password' 
      : (route.query.redirect || '/')
    
    // 登录成功动画和提示
    ElMessage({
      message: '登录成功，正在进入系统...',
      type: 'success',
      duration: 1500
    })
    
    // 延迟跳转以显示成功消息
    setTimeout(() => {
      router.replace(String(redirect))
    }, 500)
    
  } catch (e) {
    try {
      const data = JSON.parse(e.message)
      ElMessage({
        message: '登录失败：' + (data.error || ''),
        type: 'error',
        duration: 3000
      })
    } catch {
      ElMessage({
        message: '登录失败：' + (e.message || '服务器连接错误'),
        type: 'error',
        duration: 3000
      })
    }
  } finally {
    submitting.value = false
  }
}

// 页面加载完成后自动聚焦用户名输入框
onMounted(() => {
  // 这里可以添加页面加载动画效果
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--el-color-primary-light-7) 0%, var(--el-color-primary-light-9) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 600px;
  background: var(--el-bg-color);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.left-panel {
  flex: 1;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  color: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.brand-container {
  position: relative;
  z-index: 2;
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.brand-tagline {
  margin: 8px 0 0;
  font-size: 16px;
  opacity: 0.8;
}

.login-illustration {
  width: 90%;
  max-width: 500px;
  margin: 30px auto;
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.15));
  position: relative;
  z-index: 2;
}

.features-list {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  position: relative;
  z-index: 2;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  font-size: 16px;
  transition: transform 0.3s, background 0.3s;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-3px);
}

.right-panel {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--el-bg-color);
}

.login-header {
  margin-bottom: 30px;
  text-align: center;
}

.welcome-text {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
}

.login-subtext {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 8px 0 0;
}

.login-form-card {
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05) !important;
  background-color: var(--el-bg-color-overlay);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 5px 0;
}

.login-button {
  width: 100%;
  height: 48px;
  margin-top: 10px;
  font-size: 16px;
  letter-spacing: 1px;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
    max-width: 500px;
  }
  
  .left-panel {
    padding: 30px;
  }
  
  .login-illustration {
    width: 70%;
    margin: 20px auto;
  }
  
  .features-list {
    display: none;
  }
  
  .right-panel {
    padding: 30px;
  }
}

@media (max-width: 576px) {
  .login-page {
    padding: 10px;
  }
  
  .login-container {
    box-shadow: none;
    border-radius: 0;
  }
  
  .left-panel {
    padding: 20px;
  }
  
  .right-panel {
    padding: 20px;
  }
  
  .login-form-card {
    box-shadow: none !important;
  }
}
</style>

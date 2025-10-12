<template>
  <div class="app">
    <el-header height="56px" class="topbar">
      <div class="left-spacer">
        <!-- 左侧留空区域 -->
      </div>
      
      <!-- 居中的导航菜单 - 自动延伸 -->
      <div class="nav-menu">
        <el-menu 
          mode="horizontal" 
          :default-active="activeMenu"
          :background-color="navBgColor"
          text-color="#ffffff"
          active-text-color="#ffffff"
          router
          @select="handleSelect">
          <el-menu-item index="home" :route="{name: 'home'}">
            <el-icon><HomeFilled /></el-icon>
            <span>{{ t('home.title') }}</span>
          </el-menu-item>
          <el-menu-item index="customers" :route="{name: 'customers'}" v-if="has('view_customers')">
            <el-icon><UserFilled /></el-icon>
            <span>{{ t('customers.title') }}</span>
          </el-menu-item>
          <el-menu-item index="banks" :route="{name: 'banks'}" v-if="has('view_banks')">
            <el-icon><OfficeBuilding /></el-icon>
            <span>{{ t('banks.title') }}</span>
          </el-menu-item>
          <el-menu-item index="accounts" :route="{name: 'accounts'}" v-if="has('view_accounts')">
            <el-icon><Box /></el-icon>
            <span>{{ t('accounts.title') }}</span>
          </el-menu-item>
          <el-menu-item index="users" :route="{name: 'users'}" v-if="has('manage_users')">
            <el-icon><User /></el-icon>
            <span>{{ t('home.users') }}</span>
          </el-menu-item>
          <el-menu-item index="settings" :route="{name: 'settings'}" v-if="has('view_settings')">
            <el-icon><Setting /></el-icon>
            <span>{{ t('settings.title') }}</span>
          </el-menu-item>
        </el-menu>
      </div>
      
      <!-- 语言切换移至最右侧 -->
      <div class="right">
        <el-select v-model="lang" size="small" @change="onLangChange" style="width:110px">
          <el-option label="中文" value="zh" />
          <el-option label="English" value="en" />
        </el-select>
      </div>
    </el-header>
    <el-main class="view">
      <router-view />
    </el-main>
  </div>
  
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { 
  Document, 
  Setting, 
  Box, 
  UserFilled, 
  HomeFilled,
  OfficeBuilding,
  User
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const { state, logout: doLogout, has } = useAuth()
const authed = computed(() => !!state.token)
const logout = () => { doLogout(); router.replace('/login') }
const { locale, t } = useI18n()
const lang = ref(locale.value)
function onLangChange(v) { localStorage.setItem('lang', v); locale.value = v }
watch(locale, (v) => lang.value = v)
const isLogin = computed(() => route.name === 'login')

// 导航菜单相关
const activeMenu = computed(() => {
  return route.name || 'home'
})

const navBgColor = computed(() => {
  return 'transparent' // 透明背景，使用顶部导航栏的背景色
})

// 菜单项选中处理
function handleSelect(key) {
  console.log('导航到:', key)
}
</script>

<style scoped>
.app { min-height: 100vh; background: var(--el-bg-color-page); }
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: linear-gradient(90deg, var(--el-color-primary) 0%, color-mix(in oklab, var(--el-color-primary) 88%, #fff) 100%);
  color: var(--el-color-white);
  box-shadow: 0 2px 10px rgba(0,0,0,.06);
}
.left-spacer {
  flex: 0 0 40px; /* 左侧留白较小 */
}
.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}
.right { 
  display: flex; 
  gap: 12px; 
  align-items: center;
  flex: 0 0 120px; /* 右侧只保留语言切换，宽度减小 */
  justify-content: flex-end; /* 确保右对齐 */
}
.view { padding: 20px; }
.view.view--full { padding: 0; }

/* 导航菜单样式覆盖 */
:deep(.el-menu) {
  border-bottom: none !important;
  background-color: transparent !important;
}
:deep(.el-menu--horizontal > .el-menu-item) {
  color: rgba(255, 255, 255, 0.85);
  height: 56px;
  line-height: 56px;
  border-bottom: none;
}
:deep(.el-menu--horizontal > .el-menu-item:hover) {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}
:deep(.el-menu--horizontal > .el-menu-item.is-active) {
  color: white;
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.15);
  border-bottom: 2px solid white;
}
</style>
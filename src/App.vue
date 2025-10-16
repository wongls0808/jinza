<template>
  <div class="app">
    <!-- 顶部导航栏，仅在非登录页时显示 -->
    <el-header v-if="!isLogin" height="56px" class="topbar">
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
          :ellipsis="false"
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
          <el-menu-item index="transactions" :route="{name: 'transactions'}" v-if="has('view_transactions')">
            <el-icon><Document /></el-icon>
            <span>{{ t('transactions.title') }}</span>
          </el-menu-item>
          <el-menu-item index="fx" :route="{name: 'fx'}" v-if="has('view_fx')">
            <el-icon><Document /></el-icon>
            <span>{{ t('fx.title') }}</span>
          </el-menu-item>
          <el-menu-item index="fx-buy" :route="{name: 'fx-buy'}" v-if="has('view_fx')">
            <el-icon><Document /></el-icon>
            <span>{{ t('buyfx.title') }}</span>
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
        <div class="lang-switch" role="group" aria-label="Language switch">
          <button type="button" class="lang" :class="{ active: lang === 'zh' }" @click="setLang('zh')">中文</button>
          <span class="sep">|</span>
          <button type="button" class="lang" :class="{ active: lang === 'en' }" @click="setLang('en')">English</button>
        </div>
        <button v-if="authed" type="button" class="logout" @click="logout" aria-label="Logout">{{ t('app.logout') }}</button>
      </div>
    </el-header>
    <el-main class="view">
      <router-view />
    </el-main>
  </div>
  
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
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

// 增强登出功能，确保完全清除会话
const logout = () => { 
  doLogout(); 
  sessionStorage.removeItem('auth_user'); // 确保清除会话存储
  router.replace('/login') 
}

// 验证会话有效性
const validateSession = () => {
  const sessionData = sessionStorage.getItem('auth_user')
  if (!sessionData && !route.meta.public) {
    console.log('会话无效，重定向到登录页')
    router.replace('/login')
    return false
  }
  return true
}

// 在组件挂载时验证会话
onMounted(() => {
  validateSession()
  // 初始化 html lang，确保与当前语言一致
  try { document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en' } catch {}
})

const { locale, t } = useI18n()
const lang = ref(locale.value)
function onLangChange(v) { 
  // 同时保存在sessionStorage和localStorage中
  sessionStorage.setItem('lang', v);
  localStorage.setItem('lang', v);
  locale.value = v;
  try { document.documentElement.lang = v === 'zh' ? 'zh-CN' : 'en' } catch {}
}
// 供按钮使用的封装方法，避免重复切换
function setLang(v) {
  if (v !== lang.value) onLangChange(v)
}
watch(locale, (v) => {
  lang.value = v
  try { document.documentElement.lang = v === 'zh' ? 'zh-CN' : 'en' } catch {}
})
const isLogin = computed(() => route.name === 'login')

// 当前选中的菜单项
const activeMenu = computed(() => {
  return route.name || 'home'
})

// 导航背景色
const navBgColor = computed(() => 'transparent') // 透明背景，使用顶部导航栏的背景色

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
  position: sticky;
  top: 0;
  z-index: 2020; /* 高于下拉/弹层(2000)，低于对话框(2001+) */
}
.left-spacer {
  flex: 0 0 40px; /* 左侧留白较小 */
}
.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center; /* 居中排列 */
  overflow-x: auto; /* 超出时允许横向滚动，不再折叠为下拉 */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.right { 
  display: flex; 
  gap: 12px; 
  align-items: center;
  flex: 0 0 auto; /* 固定显示，不折叠为更多菜单 */
  justify-content: flex-end; /* 确保右对齐 */
}
.view { padding: 20px; }
.view.view--full { padding: 0; }

/* 导航菜单样式覆盖 */
:deep(.el-menu) {
  border-bottom: none !important;
  background-color: transparent !important;
  flex-wrap: nowrap; /* 始终单行显示 */
}
:deep(.el-menu--horizontal > .el-menu-item) {
  color: rgba(255, 255, 255, 0.85);
  height: 56px;
  line-height: 56px;
  border-bottom: none;
  padding: 0 12px; /* 收紧两侧内边距，提高可视项数量 */
  flex: 0 0 auto; /* 禁止被收缩，配合横向滚动 */
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

/* 语言切换样式 */
.lang-switch { display: inline-flex; align-items: center; user-select: none; }
.lang-switch .sep { margin: 0 8px; color: rgba(255,255,255,0.6); }
.lang-switch .lang {
  background: transparent;
  border: none;
  padding: 4px 6px;
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  font-weight: 600;
}
.lang-switch .lang:hover { color: #fff; text-decoration: underline; }
.lang-switch .lang.active { color: #fff; font-weight: 800; }

/* 顶部栏注销按钮（与白色文字背景协调） */
.logout {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 700;
  cursor: pointer;
}
.logout:hover { border-color: #fff; background: rgba(255,255,255,0.12); }
</style>
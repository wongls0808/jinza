<template>
  <div class="app">
    <el-header height="56px" class="topbar">
      <div class="brand" @click="$router.push('/')">{{ t('app.title') }}</div>
      <div class="right">
        <el-select v-model="lang" size="small" @change="onLangChange" style="width:110px">
          <el-option label="中文" value="zh" />
          <el-option label="English" value="en" />
        </el-select>
        <el-switch v-model="dark" active-text="🌙" inactive-text="🌞" @change="onThemeChange" />
        <el-button v-if="authed" size="small" type="danger" @click="logout">{{ t('app.logout') }}</el-button>
      </div>
    </el-header>
    <el-main class="view">
      <router-view />
    </el-main>
  </div>
  
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { state, logout: doLogout } = useAuth()
const authed = computed(() => !!state.token)
const logout = () => { doLogout(); router.replace('/login') }
const { locale, t } = useI18n()
const { isDark, set } = useTheme()
const lang = ref(locale.value)
const dark = ref(isDark.value)
function onLangChange(v) { localStorage.setItem('lang', v); locale.value = v }
function onThemeChange(v) { set(!!v) }
watch(isDark, (v) => dark.value = v)
watch(locale, (v) => lang.value = v)
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
.brand { font-weight: 700; letter-spacing: .2px; cursor: pointer; }
.right { display: flex; gap: 12px; align-items: center; }
.view { padding: 20px; }
</style>
<template>
  <div class="app">
    <header class="topbar">
      <div class="brand" @click="$router.push('/')">企业管理系统</div>
      <nav>
        <a v-if="authed" @click="logout">退出登录</a>
      </nav>
    </header>
    <main class="view">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { state, logout: doLogout } = useAuth()
const authed = computed(() => !!state.token)
const logout = () => { doLogout(); router.replace('/login') }
</script>

<style scoped>
.app { min-height: 100vh; background: #fafafa; }
.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #111827;
  color: #fff;
}
.brand { font-weight: 600; cursor: pointer; }
nav a { cursor: pointer; color: #fff; text-decoration: none; }
.view { padding: 16px; }
</style>
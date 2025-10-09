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

const router = useRouter()
const authed = computed(() => {
  try { return !!JSON.parse(localStorage.getItem('auth_user')) } catch { return false }
})
const logout = () => {
  localStorage.removeItem('auth_user')
  router.replace('/login')
}
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
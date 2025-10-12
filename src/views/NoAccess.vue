<template>
  <NavBar :activePage="'noaccess'" :username="username" @navigate="onNavigate" />
  <div class="no-access">
    <el-result icon="warning" title="暂无可访问的功能模块" sub-title="请联系管理员为你的账号分配权限">
      <template #extra>
        <div class="actions">
          <el-button type="primary" @click="toHome">返回首页</el-button>
          <el-button @click="logout">退出登录</el-button>
        </div>
      </template>
    </el-result>
  </div>
  
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const router = useRouter()
const { logout: doLogout, state } = useAuth()
function toHome() { router.replace('/') }
function logout() { doLogout(); router.replace('/login') }
function onNavigate(page) {
  // 可根据需要实现页面跳转逻辑
}
const username = computed(() => state.user?.username || '用户')
</script>

<style scoped>
.no-access { min-height: calc(100vh - 56px); display: grid; place-items: center; padding: 24px; }
.actions { display: flex; gap: 12px; justify-content: center; }
</style>

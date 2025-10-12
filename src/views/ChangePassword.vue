<template>
  <NavBar :activePage="'settings'" :username="username" @navigate="onNavigate" />
  <div class="change-pass">
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div></div>
      </div>
      <h2>首次登录需修改密码</h2>
      <form @submit.prevent="submit">
        <label>
          旧密码
          <input v-model.trim="oldPassword" type="password" placeholder="请输入旧密码" />
        </label>
        <label>
          新密码
          <input v-model.trim="newPassword" type="password" placeholder="至少8位，含大小写与数字" />
        </label>
        <label>
          确认新密码
          <input v-model.trim="confirm" type="password" placeholder="再次输入新密码" />
        </label>
        <button :disabled="submitting">{{ submitting ? '提交中...' : '提交' }}</button>
        <p v-if="error" class="err">{{ error }}</p>
        <ul v-if="reasons.length" class="reasons">
          <li v-for="r in reasons" :key="r">{{ r }}</li>
        </ul>
      </form>
    </div>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const oldPassword = ref('')
const newPassword = ref('')
const confirm = ref('')
const submitting = ref(false)
const error = ref('')
const reasons = ref([])
function onNavigate(page) {
  // 可根据需要实现页面跳转逻辑
}
const { state } = useAuth()
const username = computed(() => state.user?.username || '用户')

async function submit() {
  error.value = ''
  reasons.value = []
  if (!oldPassword.value || !newPassword.value) {
    error.value = '请填写完整'
    ElMessage.warning(error.value)
    return
  }
  if (newPassword.value !== confirm.value) {
    error.value = '两次输入密码不一致'
    ElMessage.warning(error.value)
    return
  }
  submitting.value = true
  try {
  await api.changePassword(oldPassword.value, newPassword.value)
    // 将本地 must_change_password 状态清除，避免后续守卫误判
    try {
      const raw = localStorage.getItem('auth_user')
      if (raw) {
        const d = JSON.parse(raw)
        d.must_change_password = false
        localStorage.setItem('auth_user', JSON.stringify(d))
      }
    } catch {}
  ElMessage.success('密码已更新，请重新登录')
    localStorage.removeItem('auth_user')
    router.replace('/login')
  } catch (e) {
    try {
      const data = JSON.parse(e.message)
      error.value = data.error || '更新失败'
      reasons.value = data.reasons || []
      ElMessage.error(error.value)
    } catch {
      error.value = e.message || '更新失败'
      ElMessage.error(error.value)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.change-pass { min-height: 100vh; display: grid; place-items: center; background: #f5f7fa; }
.card { width: 380px; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
form { display: grid; gap: 12px; }
label { display: grid; gap: 6px; font-size: 14px; color: #333; }
input { height: 38px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 12px; outline: none; }
button { height: 40px; border: none; border-radius: 8px; background: #3b82f6; color: #fff; cursor: pointer; }
.err { color: #b91c1c; font-size: 13px; }
.reasons { color: #b45309; font-size: 12px; margin: 0; padding-left: 18px; }
</style>

<template>
  <div class="login-page">
    <div class="card">
      <h2>登录</h2>
      <form @submit.prevent="onSubmit">
        <label>
          用户名
          <input v-model.trim="form.username" placeholder="请输入用户名" />
        </label>
        <label>
          密码
          <input v-model.trim="form.password" type="password" placeholder="请输入密码" />
        </label>
        <button :disabled="submitting">{{ submitting ? '登录中...' : '登录' }}</button>
  <p class="hint">使用在 Railway/本地数据库中的用户进行登录</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()

const form = ref({ username: '', password: '' })
const submitting = ref(false)

const { save } = useAuth()

const onSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    alert('请输入用户名和密码')
    return
  }
  submitting.value = true
  try {
    const res = await api.login(form.value.username, form.value.password)
    // Persist token, user, perms
    save({ token: res.token, user: res.user, perms: res.perms })
    const redirect = route.query.redirect || '/'
    router.replace(String(redirect))
  } catch (e) {
    alert('登录失败：' + (e.message || 'unknown error'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f5f7fa;
}
.card {
  width: 360px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
}
form { display: grid; gap: 12px; }
label { display: grid; gap: 6px; font-size: 14px; color: #333; }
input {
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 12px;
  outline: none;
}
input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
button {
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
}
.hint { color: #666; font-size: 12px; text-align: center; margin-top: 4px; }
</style>

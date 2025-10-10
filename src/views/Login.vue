<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">{{ t('login.title') }}</div>
      </template>
      <el-form @submit.prevent class="login-form" label-position="top">
        <el-form-item :label="t('login.username')">
          <el-input v-model.trim="form.username" :placeholder="t('login.username')" />
        </el-form-item>
        <el-form-item :label="t('login.password')">
          <el-input v-model.trim="form.password" type="password" :placeholder="t('login.password')" />
        </el-form-item>
        <el-button type="primary" :loading="submitting" @click="onSubmit">{{ t('login.submit') }}</el-button>
        <div class="hint">使用在 Railway/本地数据库中的用户进行登录</div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const form = ref({ username: '', password: '' })
const submitting = ref(false)
const { t } = useI18n()

const { save } = useAuth()

const onSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning(t('login.username') + '/' + t('login.password') + ' 不能为空')
    return
  }
  submitting.value = true
  try {
  const res = await api.login(form.value.username, form.value.password)
    // Persist token, user, perms
  save({ token: res.token, user: res.user, perms: res.perms, must_change_password: !!res.must_change_password })
  const redirect = res.must_change_password ? '/change-password' : (route.query.redirect || '/')
  router.replace(String(redirect))
  ElMessage.success(t('login.title') + '成功')
  } catch (e) {
  try {
    const data = JSON.parse(e.message)
    ElMessage.error('登录失败：' + (data.error || ''))
  } catch {
    ElMessage.error('登录失败：' + (e.message || 'unknown error'))
  }
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
  background: var(--el-bg-color-page, #f5f7fa);
}
.login-card { width: 420px; }
.login-form { display: grid; gap: 12px; }
.card-header { font-weight: 600; }
.hint { color: var(--el-text-color-secondary); font-size: 12px; text-align: center; margin-top: 8px; }
</style>

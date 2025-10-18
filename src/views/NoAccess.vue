<template>
  <div class="no-access">
    <el-result icon="warning" :title="$t('noAccess.title')" :sub-title="$t('noAccess.subtitle')">
      <template #extra>
        <div class="actions">
              <el-button type="primary" @click="toHome">{{ $t('common.backHome') }}</el-button>
              <el-button @click="logout">{{ $t('app.logout') }}</el-button>
        </div>
      </template>
    </el-result>
  </div>
  
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { logout: doLogout } = useAuth()

function toHome() { router.replace('/') }
function logout() { doLogout(); router.replace('/login') }
</script>

<style scoped>
.no-access { min-height: calc(100vh - 56px); display: grid; place-items: center; padding: 24px; }
.actions { display: flex; gap: 12px; justify-content: center; }
</style>

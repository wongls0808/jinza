<template>
  <NavBar :activePage="'dashboard'" :username="username" @navigate="onNavigate" />
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>仪表盘</h1>
      <div class="welcome">欢迎回来，{{ username }}</div>
    </div>
    <div class="dashboard-content">
      <el-row :gutter="24">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-title">用户总数</div>
            <div class="stat-value">{{ stats.users }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-title">客户总数</div>
            <div class="stat-value">{{ stats.customers }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-title">收款账户</div>
            <div class="stat-value">{{ stats.accounts }}</div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="24" style="margin-top:32px;">
        <el-col :span="24">
          <el-card>
            <div class="chart-title">近30天收支趋势</div>
            <div class="chart-placeholder">[图表占位]</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { api } from '@/api'

const { state } = useAuth()
const username = computed(() => state.user?.username || '用户')
function onNavigate(page) {
  // 可根据需要实现页面跳转逻辑
}
const stats = ref({ users: 0, customers: 0, accounts: 0 })

async function loadStats() {
  // 可根据实际 API 替换
  stats.value.users = (await api.users.list()).length || 0
  stats.value.customers = (await api.customers.list()).length || 0
  stats.value.accounts = (await api.accounts.list({ page:1, pageSize:1 })).total || 0
}
onMounted(loadStats)
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
  box-sizing: border-box;
  padding: 0;
}
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 48px 0 48px;
}
.dashboard-header h1 {
  font-size: 2.4rem;
  font-weight: 800;
  color: #4f8cff;
}
.dashboard-header .welcome {
  font-size: 1.2rem;
  color: #2b3a55;
  font-weight: 500;
}
  .dashboard-page {
    min-height: 100vh;
    width: 100vw;
    background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
    box-sizing: border-box;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
  }
  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32px 0 0 0;
    width: 100%;
    max-width: 1200px;
  }
  .dashboard-content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 0;
  }
.chart-title {
  font-size: 1.1rem;
  color: #3b4890;
  margin-bottom: 12px;
}
.chart-placeholder {
  height: 220px;
  background: #f3f6fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0b7c3;
  font-size: 1.2rem;
}
</style>

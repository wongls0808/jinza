<template>
  <div class="transactions-stats">
    <div class="header-row">
      <h1>{{ t('transactions.statsPageTitle') }}</h1>
      <el-button type="default" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        {{ t('transactions.backToList') }}
      </el-button>
    </div>

    <el-card class="filters" shadow="never">
      <el-form :model="filters" label-width="120px">
        <el-form-item :label="t('transactions.dateRange')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            :start-placeholder="t('transactions.startDate')"
            :end-placeholder="t('transactions.endDate')"
            value-format="YYYY-MM-DD"
            style="width: 100%" />
        </el-form-item>
        <div class="filter-actions">
          <el-button @click="clearFilters">{{ t('transactions.clear') }}</el-button>
          <el-button type="primary" @click="fetchStats">{{ t('transactions.apply') }}</el-button>
        </div>
      </el-form>
    </el-card>

    <div class="stats-panel">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-title">{{ t('transactions.totalTransactions') }}</div>
            <div class="stat-value">{{ stats.summary?.totalTransactions || 0 }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-title">{{ t('transactions.totalCredit') }}</div>
            <div class="stat-value positive">{{ formatCurrency(stats.summary?.totalCredit) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-title">{{ t('transactions.totalDebit') }}</div>
            <div class="stat-value negative">{{ formatCurrency(stats.summary?.totalDebit) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-title">{{ t('transactions.netBalance') }}</div>
            <div class="stat-value" :class="stats.summary?.netBalance >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(stats.summary?.netBalance) }}
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
  
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const router = useRouter()
const { t } = useI18n()

const stats = ref({ summary: {}, monthly: [], categories: [] })
const filters = reactive({ startDate: '', endDate: '' })
const dateRange = ref([])

watch(dateRange, (val) => {
  if (val && val.length === 2) {
    filters.startDate = val[0] || ''
    filters.endDate = val[1] || ''
  } else {
    filters.startDate = ''
    filters.endDate = ''
  }
})

const fetchStats = async () => {
  try {
    const params = {}
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    const data = await api.transactions.stats(params)
    stats.value = data || { summary: {}, monthly: [], categories: [] }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error(t('transactions.fetchFailed'))
  }
}

const goBack = () => router.push({ name: 'transactions' })
const clearFilters = () => { dateRange.value = []; filters.startDate = ''; filters.endDate = ''; fetchStats() }

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0.00'
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => { fetchStats() })
</script>

<style scoped>
.transactions-stats { padding: 20px; }
.header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.filters { margin-bottom: 16px; }
.filter-actions { display: flex; gap: 8px; justify-content: flex-end; }
.stats-panel { margin-top: 8px; }
.stat-card { text-align: center; }
.stat-title { font-size: 14px; color: #909399; }
.stat-value { font-size: 24px; font-weight: bold; margin-top: 8px; }
.positive { color: #67C23A; }
.negative { color: #F56C6C; }
</style>

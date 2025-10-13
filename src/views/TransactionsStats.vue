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

    <!-- 表2：复制表1（交易列表）结构，但逻辑隔离 -->
    <el-table
      v-loading="loading"
      :data="transactions"
      style="width: 100%; margin-top: 20px;"
      border
      stripe>

      <el-table-column type="selection" width="55" />

      <el-table-column :label="t('transactions.transactionDate')" prop="trn_date" sortable width="140">
        <template #default="scope">{{ formatDate(scope.row.trn_date) }}</template>
      </el-table-column>
      <el-table-column :label="t('transactions.accountNumber')" prop="account_number" sortable width="160" />

      <el-table-column :label="t('transactions.bankName')" prop="bank_name" sortable width="160">
        <template #default="scope">
          <div class="bank-display">
            <img v-if="getBankLogo(scope.row)" :src="getBankLogo(scope.row)" :alt="scope.row.bank_name" class="bank-logo" @error="e => e.target.style.display = 'none'" />
            <span v-else>{{ scope.row.bank_name || '-' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column :label="t('transactions.accountName')" prop="account_name" sortable width="180">
        <template #default="scope">{{ scope.row.account_name || '-' }}</template>
      </el-table-column>

      <el-table-column :label="t('transactions.chequeRefNo')" prop="cheque_ref_no" width="160" />

      <!-- 改为匹配列：关联人（使用 reference 字段） -->
      <el-table-column :label="t('transactions.relationPerson')" prop="reference" show-overflow-tooltip width="200" />

      <!-- 新增：关联对象（显示匹配目标名称） -->
      <el-table-column :label="t('transactions.relationObject')" prop="match_target_name" show-overflow-tooltip width="200">
        <template #default="scope">{{ scope.row.match_target_name || '-' }}</template>
      </el-table-column>

      <el-table-column :label="t('transactions.debitAmount')" prop="debit_amount" align="right" sortable width="140">
        <template #default="scope"><span class="negative">{{ formatCurrency(scope.row.debit_amount) }}</span></template>
      </el-table-column>
      <el-table-column :label="t('transactions.creditAmount')" prop="credit_amount" align="right" sortable width="140">
        <template #default="scope"><span class="positive">{{ formatCurrency(scope.row.credit_amount) }}</span></template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:currentPage="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
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
const transactions = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, total: 0, pages: 0 })
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
    // 同步加载列表数据（表2自身独立取数）
    await fetchTransactions()
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error(t('transactions.fetchFailed'))
  }
}

const fetchTransactions = async () => {
  loading.value = true
  try {
  const params = { page: pagination.page, pageSize: pagination.pageSize, status: 'matched' }
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    const data = await api.transactions.list(params)
    transactions.value = Array.isArray(data?.data) ? data.data.map(normalizeRow) : []
    pagination.total = data.pagination.total
    pagination.pages = data.pagination.pages
  } catch (e) {
    console.error('获取交易列表失败:', e)
    ElMessage.error(t('transactions.fetchFailed'))
  } finally { loading.value = false }
}

const handleSizeChange = (size) => { pagination.pageSize = size; fetchTransactions() }
const handleCurrentChange = (page) => { pagination.page = page; fetchTransactions() }

const goBack = () => router.push({ name: 'transactions' })
const clearFilters = () => { dateRange.value = []; filters.startDate = ''; filters.endDate = ''; fetchStats() }

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0.00'
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => { fetchStats() })

// 将不同来源的字段标准化为表格使用的统一结构
function normalizeRow(row) {
  const r = row || {}
  const dateVal = r.trn_date || r.transaction_date || r.date || r.trnDate
  const acctNo = r.account_number || r.accountNumber || r.account || ''
  const bankName = r.bank_name || r.bankName || r.bank_zh || r.bank_en || r.bank || ''
  const acctName = r.account_name || r.accountName || ''
  const refNo = r.cheque_ref_no || r.chequeRefNo || r.ref_no || r.refNo || ''
  const refCombined = r.reference
    || [r.reference1, r.reference2, r.reference3].filter(Boolean).join(' ').trim()
    || [r.reference_1, r.reference_2, r.reference_3].filter(Boolean).join(' ').trim()
    || ''
  const debit = (r.debit_amount ?? r.debitAmount ?? 0)
  const credit = (r.credit_amount ?? r.creditAmount ?? 0)

  // 透传 logo/code 以供渲染
  const bank_logo = r.bank_logo
  const bank_code = r.bank_code || r.bankCode

  return {
    ...r,
    trn_date: dateVal,
    account_number: acctNo,
    bank_name: bankName,
    account_name: acctName,
    cheque_ref_no: refNo,
  reference: String(refCombined || '').replace(/\s+/g,' ').replace(/x{3,}/gi,'').trim(),
    debit_amount: Number(String(debit).toString().replace(/,/g,'')) || 0,
    credit_amount: Number(String(credit).toString().replace(/,/g,'')) || 0,
    bank_logo,
    bank_code
  }
}

// 与列表页一致的日期格式化
function formatDate(date) {
  if (!date) return '-'
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return String(date)
  const d = new Date(date)
  if (isNaN(d)) return String(date)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

// 获取银行logo，与列表页保持一致逻辑
function getBankLogo(row) {
  if (!row) return ''
  if (row.bank_logo) return row.bank_logo
  if (row.bank_code) return `/banks/${String(row.bank_code).toLowerCase()}.svg`
  return ''
}
</script>

<style scoped>
.transactions-stats { padding: 20px; }
.header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.filters { margin-bottom: 16px; }
.filter-actions { display: flex; gap: 8px; justify-content: flex-end; }
.stats-panel { margin-top: 8px; }
.stat-card { text-align: center; }
.bank-display { display: flex; align-items: center; }
.bank-logo { height: 24px; max-width: 100px; object-fit: contain; }
.pagination { margin-top: 20px; display: flex; justify-content: center; }
.stat-title { font-size: 14px; color: #909399; }
.stat-value { font-size: 24px; font-weight: bold; margin-top: 8px; }
.positive { color: #67C23A; }
.negative { color: #F56C6C; }
</style>

<template>
  <div class="transactions-view">
    <h1>{{ t('transactions.title') }}</h1>
    
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            :placeholder="t('transactions.searchPlaceholder')"
            @keyup.enter="handleSearch"
            clearable
            @clear="handleSearch">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        
        <el-col :span="18">
          <el-button-group>
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              {{ t('transactions.addTransaction') }}
            </el-button>
            <el-button @click="showImportDialog">
              <el-icon><Upload /></el-icon>
              {{ t('transactions.importTransactions') }}
            </el-button>
            <el-button @click="exportTransactions">
              <el-icon><Download /></el-icon>
              {{ t('transactions.exportTransactions') }}
            </el-button>
            <el-button @click="showFiltersDialog" type="info">
              <el-icon><Filter /></el-icon>
              {{ t('transactions.advancedFilter') }}
            </el-button>
            <el-button @click="handleBatchDelete" type="danger" :disabled="!multipleSelection.length">
              <el-icon><Delete /></el-icon>
              {{ t('transactions.batchDelete') }}
            </el-button>
            <el-button @click="handleMatch" type="success">
              <el-icon><Connection /></el-icon>
              {{ t('transactions.match') }}
            </el-button>
          </el-button-group>
        </el-col>
        
        <el-col :span="6" class="text-right">
          <el-switch
            v-model="showStats"
            :inactive-text="t('transactions.showStats')"
            @change="toggleStats" />
        </el-col>
      </el-row>
    </div>
    
    <!-- 统计信息面板 -->
    <div v-if="showStats" class="stats-panel">
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
      
      <el-row :gutter="20" class="chart-row">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>{{ t('transactions.monthlyTrend') }}</span>
              </div>
            </template>
            <div id="monthlyChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 过滤条件标签 -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="filter-label">{{ t('transactions.activeFilters') }}:</span>
      <el-tag
        v-if="filters.startDate"
        closable
        @close="removeFilter('startDate')">
        {{ t('transactions.fromDate') }}: {{ filters.startDate }}
      </el-tag>
      <el-tag
        v-if="filters.endDate"
        closable
        @close="removeFilter('endDate')">
        {{ t('transactions.toDate') }}: {{ filters.endDate }}
      </el-tag>
      <el-tag
        v-if="filters.account"
        closable
        @close="removeFilter('account')">
        {{ t('transactions.account') }}: {{ filters.account }}
      </el-tag>
      <el-tag
        v-if="filters.category"
        closable
        @close="removeFilter('category')">
        {{ t('transactions.category') }}: {{ filters.category }}
      </el-tag>
      <el-tag
        v-if="filters.minAmount"
        closable
        @close="removeFilter('minAmount')">
        {{ t('transactions.minAmount') }}: {{ filters.minAmount }}
      </el-tag>
      <el-tag
        v-if="filters.maxAmount"
        closable
        @close="removeFilter('maxAmount')">
        {{ t('transactions.maxAmount') }}: {{ filters.maxAmount }}
      </el-tag>
      
      <el-button link @click="clearAllFilters">{{ t('transactions.clearAllFilters') }}</el-button>
    </div>
    
    <!-- 交易表格 -->
    <el-table
      v-loading="loading"
      :data="transactions"
      style="width: 100%; margin-top: 20px;"
      @row-dblclick="handleRowDblClick"
      @selection-change="handleSelectionChange"
      border
      stripe>
      
      <el-table-column type="selection" width="55" />
      
      <el-table-column :label="t('transactions.accountNumber')" prop="account_number" sortable />

      <el-table-column :label="t('transactions.bankName')" prop="bank_name" sortable>
        <template #default="scope">
          <div class="bank-display">
            <img
              v-if="getBankLogo(scope.row)"
              :src="getBankLogo(scope.row)"
              :alt="scope.row.bank_name"
              class="bank-logo"
              @error="e => e.target.style.display = 'none'" />
            <span v-else>{{ scope.row.bank_name || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column :label="t('transactions.accountName')" prop="account_name" sortable>
        <template #default="scope">
          {{ scope.row.account_name || '-' }}
        </template>
      </el-table-column>
      
      <el-table-column :label="t('transactions.transactionDate')" prop="trn_date" sortable width="140">
        <template #default="scope">
          {{ formatDate(scope.row.trn_date) }}
        </template>
      </el-table-column>
      
      <el-table-column :label="t('transactions.chequeRefNo')" prop="cheque_ref_no" />
      
      <el-table-column :label="t('transactions.transactionDescription')" prop="transaction_description" show-overflow-tooltip />
      
      <el-table-column :label="t('transactions.debitAmount')" prop="debit_amount" align="right" sortable width="140">
        <template #default="scope">
          <span class="negative">{{ formatCurrency(scope.row.debit_amount) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column :label="t('transactions.creditAmount')" prop="credit_amount" align="right" sortable width="140">
        <template #default="scope">
          <span class="positive">{{ formatCurrency(scope.row.credit_amount) }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="t('transactions.reference')" prop="reference" show-overflow-tooltip />
      
      <el-table-column label="" width="100">
        <template #default="scope">
          <el-dropdown trigger="click">
            <el-button type="primary" text size="small">
              {{ t('common.actions') }}
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleView(scope.row)">
                  <el-icon><View /></el-icon>
                  {{ t('common.view') }}
                </el-dropdown-item>
                <el-dropdown-item @click="handleEdit(scope.row)">
                  <el-icon><Edit /></el-icon>
                  {{ t('common.edit') }}
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" divided>
                  <el-icon><Delete /></el-icon>
                  {{ t('common.delete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页控件 -->
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
    
    <!-- 新增/编辑交易对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('transactions.editTransaction') : t('transactions.addTransaction')"
      width="600px"
      :close-on-click-modal="false">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="left">
        
        <el-form-item :label="t('transactions.accountNumber')" prop="account_number">
          <el-select 
            v-model="form.account_number"
            filterable
            @change="handleAccountChange"
            placeholder="选择收款账户"
            style="width: 100%">
            <el-option
              v-for="account in accounts"
              :key="account.bank_account"
              :label="`${account.bank_account} (${account.account_name})`"
              :value="account.bank_account">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ account.bank_account }}</span>
                <span style="font-size: 0.85em; margin-left: 8px;">
                  {{ account.account_name }}
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('transactions.bankName')" prop="bank_name">
          <div class="bank-display">
            <img v-if="selectedBankLogo" :src="selectedBankLogo" alt="Bank Logo" class="bank-logo" />
            <span v-else>{{ form.bank_name }}</span>
          </div>
        </el-form-item>
        
        <el-form-item :label="t('transactions.accountName')" prop="account_name">
          <el-input v-model="form.account_name" disabled />
        </el-form-item>
        
        <el-form-item :label="t('transactions.transactionDate')" prop="trn_date">
          <el-date-picker
            v-model="form.trn_date"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD" />
        </el-form-item>
        
        <el-form-item :label="t('transactions.chequeRefNo')" prop="cheque_ref_no">
          <el-input v-model="form.cheque_ref_no" />
        </el-form-item>
        
        <el-form-item :label="t('transactions.transactionDescription')" prop="transaction_description">
          <el-input v-model="form.transaction_description" type="textarea" rows="2" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('transactions.debitAmount')" prop="debit_amount">
              <el-input-number
                v-model="form.debit_amount"
                :precision="2"
                :step="100"
                :min="0"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item :label="t('transactions.creditAmount')" prop="credit_amount">
              <el-input-number
                v-model="form.credit_amount"
                :precision="2"
                :step="100"
                :min="0"
                style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">{{ t('transactions.reference') }}</el-divider>
        
        <el-form-item :label="t('transactions.reference')" prop="reference">
          <el-input v-model="form.reference" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ t('common.save') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 高级筛选对话框 -->
    <el-dialog
      v-model="filtersDialogVisible"
      :title="t('transactions.advancedFilter')"
      width="500px">
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
        
        <el-form-item :label="t('transactions.account')">
          <el-input v-model="filters.account" />
        </el-form-item>
        
        <el-form-item :label="t('transactions.amountRange')">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-input-number
                v-model="filters.minAmount"
                :placeholder="t('transactions.min')"
                :precision="2"
                :min="0"
                style="width: 100%" />
            </el-col>
            <el-col :span="12">
              <el-input-number
                v-model="filters.maxAmount"
                :placeholder="t('transactions.max')"
                :precision="2"
                :min="0"
                style="width: 100%" />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="clearAllFilters">{{ t('transactions.clearFilters') }}</el-button>
          <el-button type="primary" @click="applyFilters">{{ t('transactions.applyFilters') }}</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      :title="t('transactions.importTransactions')"
      width="650px">
      <el-tabs v-model="importTab">
        <el-tab-pane :label="t('transactions.uploadFile')" name="upload">
          <div class="upload-area">
            <el-upload
              class="transaction-upload"
              drag
              action=""
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="fileList"
              accept=".csv,.xls,.xlsx">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                {{ t('transactions.dropFiles') }} <em>{{ t('transactions.clickUpload') }}</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  {{ t('transactions.supportedFormats') }}
                </div>
              </template>
            </el-upload>
          </div>
          
          <div v-if="previewData.length > 0" class="preview-section">
            <h4>{{ t('transactions.dataPreview') }}</h4>
            <el-table :data="previewData.slice(0, 5)" border size="small" max-height="250">
              <el-table-column 
                v-for="header in previewHeaders" 
                :key="header" 
                :prop="header" 
                :label="header" />
            </el-table>
            <div class="preview-info">{{ t('transactions.showingPreview', { count: 5, total: previewData.length }) }}</div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane :label="t('transactions.downloadTemplate')" name="template">
          <div class="template-info">
            <p>{{ t('transactions.templateInfo') }}</p>
            <el-button type="primary" @click="downloadTemplate">
              <el-icon><download /></el-icon>
              {{ t('transactions.downloadTemplate') }}
            </el-button>
          </div>
          
          <div class="template-format">
            <h4>{{ t('transactions.requiredColumns') }}</h4>
            <ul>
              <li><strong>{{ t('transactions.accountNumber') }}</strong>: {{ t('transactions.accountNumberDesc') }}</li>
              <li><strong>{{ t('transactions.transactionDate') }}</strong>: {{ t('transactions.transactionDateDesc') }}</li>
            </ul>
            
            <h4>{{ t('transactions.optionalColumns') }}</h4>
            <ul>
              <li><strong>{{ t('transactions.chequeRefNo') }}</strong>: {{ t('transactions.chequeRefNoDesc') }}</li>
              <li><strong>{{ t('transactions.debitAmount') }}</strong>: {{ t('transactions.debitAmountDesc') }}</li>
              <li><strong>{{ t('transactions.creditAmount') }}</strong>: {{ t('transactions.creditAmountDesc') }}</li>
              <li><strong>{{ t('transactions.reference') }}</strong>: {{ t('transactions.referencesDesc') }}</li>
            </ul>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button 
            type="primary" 
            @click="submitImport" 
            :disabled="!previewData.length || importSubmitting"
            :loading="importSubmitting">
            {{ importSubmitting ? t('transactions.importing') : t('transactions.importNow') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看交易详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="t('transactions.transactionDetail')"
      width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="t('transactions.accountNumber')">
          {{ currentTransaction.account_number }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.bankName')">
          {{ currentTransaction.bank_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.accountName')">
          {{ currentTransaction.account_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.transactionDate')">
          {{ formatDate(currentTransaction.trn_date) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.chequeRefNo')">
          {{ currentTransaction.cheque_ref_no || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.transactionDescription')">
          {{ currentTransaction.transaction_description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.debitAmount')">
          <span class="negative">{{ formatCurrency(currentTransaction.debit_amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.creditAmount')">
          <span class="positive">{{ formatCurrency(currentTransaction.credit_amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.reference')">
          {{ currentTransaction.reference || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.createdBy')">
          {{ currentTransaction.createdBy || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('transactions.createdAt')">
          {{ currentTransaction.createdAt || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">{{ t('common.close') }}</el-button>
          <el-button type="primary" @click="handleEdit(currentTransaction)">{{ t('common.edit') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import Papa from 'papaparse'
import * as echarts from 'echarts/core'
import { api } from '@/api'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer
])

const { t } = useI18n()

// 数据和状态
const transactions = ref([])
const loading = ref(false)
const searchQuery = ref('')
const multipleSelection = ref([])
const accounts = ref([])
const selectedBankLogo = ref('')
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  pages: 0
})
const sort = ref('transaction_date')
const order = ref('desc')
const showStats = ref(false)
const stats = ref({ summary: {}, monthly: [], categories: [] })
const filters = reactive({
  startDate: '',
  endDate: '',
  account: '',
  category: '',
  minAmount: null,
  maxAmount: null
})
const dateRange = ref([])

// 计算属性
const hasActiveFilters = computed(() => {
  return filters.startDate || filters.endDate || filters.account || 
         filters.category || filters.minAmount || filters.maxAmount
})

// 对话框状态
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const filtersDialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const importSubmitting = ref(false)
const importTab = ref('upload')
const currentTransaction = ref({})
const fileList = ref([])
const previewData = ref([])
const previewHeaders = ref([])

// 表单相关
const formRef = ref(null)
const form = reactive({
  id: null,
  account_number: '',
  trn_date: '',
  cheque_ref_no: '',
  transaction_description: '',
  debit_amount: 0,
  credit_amount: 0,
  bank_name: '',
  account_name: '',
  reference: ''
})

const rules = {
  account_number: [
    { required: true, message: t('transactions.accountNumberRequired'), trigger: 'blur' }
  ],
  trn_date: [
    { required: true, message: t('transactions.transactionDateRequired'), trigger: 'change' }
  ],
  debit_amount: [
    { type: 'number', min: 0, message: t('transactions.debitAmountMin'), trigger: 'change' }
  ],
  credit_amount: [
    { type: 'number', min: 0, message: t('transactions.creditAmountMin'), trigger: 'change' }
  ]
}

// 图表实例
let monthlyChart = null
let categoryChart = null

// 类别选项
const categoryOptions = ref([
  '收入',
  '支出',
  '转账',
  '贷款',
  '投资',
  '退款',
  '其他'
])

// 监听日期范围变化
watch(dateRange, (newVal) => {
  if (newVal) {
    filters.startDate = newVal[0] || ''
    filters.endDate = newVal[1] || ''
  } else {
    filters.startDate = ''
    filters.endDate = ''
  }
})

// 方法
const fetchTransactions = async () => {
  loading.value = true
  
  try {
    // 开发环境提示
    if (process.env.NODE_ENV === 'development') {
      console.log('开发环境提示：请确保已配置数据库连接')
    }
    
    // 构建查询参数
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: sort.value,
      order: order.value
    }
    
    if (searchQuery.value) {
      params.searchTerm = searchQuery.value
    }
    
    if (filters.startDate) {
      params.startDate = filters.startDate
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate
    }
    
    if (filters.account) {
      params.account = filters.account
    }
    
    if (filters.category) {
      params.category = filters.category
    }
    
    if (filters.minAmount) {
      params.minAmount = filters.minAmount
    }
    
    if (filters.maxAmount) {
      params.maxAmount = filters.maxAmount
    }
    
    // 使用API获取数据
    const data = await api.transactions.list(params)
    
    transactions.value = data.data
    pagination.total = data.pagination.total
    pagination.pages = data.pagination.pages
    
    if (showStats.value) {
      await fetchStats()
    }
  } catch (error) {
    console.error('获取交易数据失败:', error)
    
    // 提供更详细的错误信息
    if (error.message && error.message.includes('DATABASE_URL')) {
      ElMessage({
        message: '数据库连接错误：请确保数据库已正确配置',
        type: 'error',
        duration: 5000
      })
    } else {
      ElMessage.error(t('transactions.fetchFailed'))
    }
    // 移除了开发环境的测试数据
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    // 构建查询参数
    const params = {}
    
    if (filters.startDate) {
      params.startDate = filters.startDate
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate
    }
    
    if (filters.account) {
      params.account = filters.account
    }
    
    if (filters.category) {
      params.category = filters.category
    }
    
    // 使用API获取统计数据
    const data = await api.transactions.stats(params)
    stats.value = data
    
    // 延迟一下再渲染图表，确保DOM已经准备好
    setTimeout(() => {
      renderCharts()
    }, 100)
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error(t('transactions.statsFetchFailed'))
  }
}

const renderCharts = () => {
  // 渲染月度趋势图
  if (monthlyChart) {
    monthlyChart.dispose()
  }
  
  const monthlyEl = document.getElementById('monthlyChart')
  if (monthlyEl) {
    monthlyChart = echarts.init(monthlyEl)
    
  const months = (stats.value.monthly || []).map(item => item.month)
  const debitData = (stats.value.monthly || []).map(item => Number(item.debit) || 0)
  const creditData = (stats.value.monthly || []).map(item => Number(item.credit) || 0)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: [t('transactions.debitAmount'), t('transactions.creditAmount')]
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: t('transactions.debitAmount'),
          type: 'bar',
          stack: 'total',
          color: '#F56C6C',
          data: debitData
        },
        {
          name: t('transactions.creditAmount'),
          type: 'bar',
          stack: 'total',
          color: '#67C23A',
          data: creditData
        }
      ]
    }
    
    monthlyChart.setOption(option)
  }
  
  // 渲染类别饼图
  if (categoryChart) {
    categoryChart.dispose()
  }
  
  const categoryEl = document.getElementById('categoryChart')
  if (categoryEl) {
    categoryChart = echarts.init(categoryEl)
    
    const categoryData = (stats.value.categories || []).map(item => ({
      name: item.category || t('transactions.uncategorized'),
      value: Number(item.count) || 0
    }))
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: t('transactions.totalTransactions'),
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold'
            }
          },
          data: categoryData
        }
      ]
    }
    
    categoryChart.setOption(option)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchTransactions()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchTransactions()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchTransactions()
}

const toggleStats = () => {
  if (showStats.value) {
    fetchStats()
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const showImportDialog = () => {
  importTab.value = 'upload'
  fileList.value = []
  previewData.value = []
  previewHeaders.value = []
  importDialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    account_number: '',
    trn_date: new Date().toISOString().split('T')[0],
    cheque_ref_no: '',
    transaction_description: '',
    debit_amount: 0,
    credit_amount: 0,
    bank_name: '',
    account_name: '',
    reference: ''
  })
  selectedBankLogo.value = ''
  
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleView = (row) => {
  currentTransaction.value = { ...row }
  viewDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  viewDialogVisible.value = false
  
  Object.assign(form, {
    id: row.id,
    account_number: row.account_number,
    trn_date: row.trn_date,
    cheque_ref_no: row.cheque_ref_no || '',
    transaction_description: row.transaction_description || '',
    debit_amount: Number(row.debit_amount) || 0,
    credit_amount: Number(row.credit_amount) || 0,
    bank_name: row.bank_name || '',
    account_name: row.account_name || '',
    reference: row.reference || ''
  })
  // 编辑态：回填银行 Logo
  if (row.bank_logo) {
    selectedBankLogo.value = row.bank_logo
  } else if (row.bank_code) {
    selectedBankLogo.value = `/banks/${String(row.bank_code).toLowerCase()}.svg`
  } else {
    selectedBankLogo.value = ''
  }
  
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    t('transactions.deleteConfirmMessage'),
    t('transactions.deleteConfirmTitle'),
    {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await fetch(`/api/transactions/${row.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || response.statusText)
      }
      
      ElMessage.success(t('transactions.deleteSuccess'))
      fetchTransactions()
    } catch (error) {
      console.error('删除交易失败:', error)
      ElMessage.error(t('transactions.deleteFailed'))
    }
  }).catch(() => {})
}

const handleRowDblClick = (row) => {
  handleView(row)
}

// 处理表格多选
const handleSelectionChange = (selection) => {
  multipleSelection.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (!multipleSelection.value.length) {
    ElMessage.warning(t('transactions.selectItemsToDelete'))
    return
  }

  try {
    await ElMessageBox.confirm(t('transactions.confirmBatchDelete'), t('common.warning'), {
      confirmButtonText: t('common.ok'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    
    loading.value = true
    
    const ids = multipleSelection.value.map(item => item.id)
    
  // 调用批量删除 API
  await api.transactions.deleteTransactions(ids)
    
    ElMessage.success(t('transactions.batchDeleteSuccess'))
    fetchTransactions()
  } catch (error) {
    console.error('批量删除失败:', error)
    if (error !== 'cancel') {
      ElMessage.error(t('transactions.batchDeleteFailed'))
    }
  } finally {
    loading.value = false
  }
}

// 匹配功能
const handleMatch = () => {
  ElMessageBox.prompt(t('transactions.enterMatchPattern'), t('transactions.matchTransactions'), {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    inputPattern: /.+/,
    inputErrorMessage: t('transactions.patternRequired'),
    inputPlaceholder: t('transactions.matchPatternPlaceholder')
  }).then(({ value }) => {
    // 保存用户输入的匹配模式
    const pattern = value.trim()
    
    // 显示匹配开始的消息
    ElMessage({
      type: 'info',
      message: t('transactions.matchingStarted', { pattern }),
      duration: 3000
    })
    
    // 设置高级过滤条件，根据匹配模式进行搜索
    searchQuery.value = pattern
    
    // 添加匹配模式到过滤器，这样可以在字段中进行更精确的搜索
    // 这里同时搜索交易说明、参考号和合并的参考字段
    const advancedFilters = {
      searchQuery: pattern,
      searchFields: ['transaction_description', 'cheque_ref_no', 'reference'],
      exactMatch: false
    }
    
  // 保存高级过滤设置
  Object.assign(filters, advancedFilters)
    
    // 执行搜索
    handleSearch()
    
    // 显示过滤提示
    ElMessage({
      type: 'success',
      message: t('transactions.matchResultsShown'),
      duration: 5000
    })
  }).catch(() => {})
}

// 获取账户列表
const fetchAccounts = async () => {
  try {
    accounts.value = await api.requestAccounts()
  } catch (error) {
    console.error('获取账户列表失败:', error)
    ElMessage.error(t('transactions.fetchAccountsFailed'))
  }
}

// 账户选择变更时自动填充银行和账户名
const handleAccountChange = (accountNumber) => {
  const selectedAccount = accounts.value.find(a => a.bank_account === accountNumber)
  if (selectedAccount) {
    form.bank_name = selectedAccount.bank_zh || selectedAccount.bank_en
    form.account_name = selectedAccount.account_name
    
    // 设置银行logo
    if (selectedAccount.bank_logo) {
      selectedBankLogo.value = selectedAccount.bank_logo
    } else if (selectedAccount.bank_code) {
      selectedBankLogo.value = `/banks/${String(selectedAccount.bank_code).toLowerCase()}.svg`
    } else {
      selectedBankLogo.value = ''
    }
  } else {
    form.bank_name = ''
    form.account_name = ''
    selectedBankLogo.value = ''
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      const data = {
        account_number: form.account_number,
        transaction_date: form.trn_date,
        cheque_ref_no: form.cheque_ref_no,
        description: form.transaction_description,
        debit_amount: form.debit_amount,
        credit_amount: form.credit_amount,
        reference: form.reference
      }
      
      if (isEdit.value) {
        await api.transactions.update(form.id, data)
      } else {
        await api.transactions.create(data)
      }
      
      ElMessage.success(
        isEdit.value ? t('transactions.updateSuccess') : t('transactions.createSuccess')
      )
      
      dialogVisible.value = false
      fetchTransactions()
    } catch (error) {
      console.error('保存交易失败:', error)
      const baseMsg = isEdit.value ? t('transactions.updateFailed') : t('transactions.createFailed')
      const detail = (error && error.message) ? `: ${error.message}` : ''
      ElMessage.error(`${baseMsg}${detail}`)
    } finally {
      submitting.value = false
    }
  })
}

const showFiltersDialog = () => {
  // 同步日期范围
  dateRange.value = filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : []
  filtersDialogVisible.value = true
}

const applyFilters = () => {
  pagination.page = 1
  filtersDialogVisible.value = false
  fetchTransactions()
}

const clearAllFilters = () => {
  Object.assign(filters, {
    startDate: '',
    endDate: '',
    account: '',
    category: '',
    minAmount: null,
    maxAmount: null
  })
  dateRange.value = []
  
  if (filtersDialogVisible.value) {
    filtersDialogVisible.value = false
  }
  
  pagination.page = 1
  fetchTransactions()
}

const removeFilter = (filterName) => {
  filters[filterName] = filterName.includes('Amount') ? null : ''
  
  if ((filterName === 'startDate' || filterName === 'endDate') && dateRange.value) {
    dateRange.value = filterName === 'startDate' ? [null, filters.endDate] : [filters.startDate, null]
    if (!filters.startDate && !filters.endDate) {
      dateRange.value = []
    }
  }
  
  pagination.page = 1
  fetchTransactions()
}

const exportTransactions = async () => {
  try {
    // 构建查询参数
    const params = {}
    
    if (filters.startDate) {
      params.startDate = filters.startDate
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate
    }
    
    if (filters.account) {
      params.account = filters.account
    }
    
    if (filters.category) {
      params.category = filters.category
    }
    
    // 使用API获取导出数据
    const data = await api.transactions.export(params)
    
    if (!data || data.length === 0) {
      ElMessage.warning(t('transactions.noDataToExport'))
      return
    }
    
    // 使用PapaParse转换为CSV
    const csv = Papa.unparse(data, { header: true })
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success(t('transactions.exportSuccess'))
  } catch (error) {
    console.error('导出交易数据失败:', error)
    ElMessage.error(t('transactions.exportFailed'))
  }
}

const handleFileChange = (file) => {
  if (!file || !file.raw) {
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length) {
            previewData.value = results.data
            previewHeaders.value = results.meta.fields
            
            // 检查是否包含必要字段
            const hasRequiredFields = checkRequiredFields(results.meta.fields)
            if (!hasRequiredFields) {
              ElMessage.warning(t('transactions.missingRequiredFields'))
            }
          } else {
            previewData.value = []
            previewHeaders.value = []
            ElMessage.warning(t('transactions.emptyFile'))
          }
        },
        error: (error) => {
          console.error('解析CSV文件出错:', error)
          ElMessage.error(t('transactions.parseError'))
        }
      })
    } catch (error) {
      console.error('处理文件时出错:', error)
      ElMessage.error(t('transactions.fileProcessError'))
    }
  }
  reader.readAsText(file.raw)
}

const checkRequiredFields = (fields) => {
  // 检查必要字段
  const requiredFields = ['账号', 'accountNumber', '交易日期', 'transactionDate']
  const normalizedFields = fields.map(f => f.toLowerCase())
  
  return requiredFields.some(field => 
    normalizedFields.includes(field.toLowerCase())
  )
}

const submitImport = async () => {
  if (!previewData.value.length) {
    ElMessage.warning(t('transactions.noDataToImport'))
    return
  }
  
  importSubmitting.value = true
  
  try {
    // 将预览数据转换为后端所需的格式
    const transformedData = previewData.value.map(row => {
      // 处理字段映射，支持中英文字段名
      const transformed = {
        accountNumber: row.accountNumber || row.账号 || row['账号'] || row['Account Number'] || '',
        transactionDate: row.transactionDate || row.交易日期 || row['Transaction Date'] || '',
        chequeRefNo: row.chequeRefNo || row['参考号'] || row['Ref No'] || '',
        description: row.description || row.描述 || row.Description || '',
        debitAmount: row.debitAmount || row.借方金额 || row['Debit Amount'] || 0,
        creditAmount: row.creditAmount || row.贷方金额 || row['Credit Amount'] || 0,
        category: row.category || row.类别 || row.Category || '',
        reference1: row.reference1 || row.参考1 || row['Reference 1'] || '',
        reference2: row.reference2 || row.参考2 || row['Reference 2'] || '',
        reference3: row.reference3 || row.参考3 || row['Reference 3'] || ''
      }
      
      return transformed
    })
    
    const response = await fetch('/api/transactions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: transformedData })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.detail || response.statusText)
    }
    
    const result = await response.json()
    
    importDialogVisible.value = false
    fileList.value = []
    previewData.value = []
    
    ElMessage.success(t('transactions.importSuccess', { count: result.inserted }))
    
    if (result.failed > 0) {
      ElMessage.warning(t('transactions.importPartial', { 
        inserted: result.inserted,
        failed: result.failed
      }))
    }
    
    fetchTransactions()
  } catch (error) {
    console.error('导入交易数据失败:', error)
    ElMessage.error(t('transactions.importFailed'))
  } finally {
    importSubmitting.value = false
  }
}

const downloadTemplate = async () => {
  try {
    const response = await fetch('/api/transactions/template')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || response.statusText)
    }
    
    const data = await response.json()
    
    // 使用PapaParse转换为CSV
    const csv = Papa.unparse(data, { header: true })
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'transactions_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success(t('transactions.templateDownloaded'))
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error(t('transactions.templateDownloadFailed'))
  }
}

// 格式化方法
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0.00'
  // 使用浏览器当前语言环境格式化
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (date) => {
  if (!date) return '-'
  // 若已是 YYYY-MM-DD 则直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return String(date)
  const d = new Date(date)
  if (isNaN(d)) return String(date)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

const getCategoryTagType = (category) => {
  const types = {
    '收入': 'success',
    '支出': 'danger',
    '转账': 'warning',
    '贷款': 'info',
    '投资': 'primary'
  }
  
  return types[category] || ''
}

// 监听窗口大小变化，调整图表大小
const handleResize = () => {
  if (monthlyChart) monthlyChart.resize()
  if (categoryChart) categoryChart.resize()
}

// 生命周期钩子
onMounted(() => {
  try {
    fetchTransactions()
    fetchAccounts()
  } catch (error) {
    console.error('初始化交易管理视图失败:', error)
    ElMessage({
      message: '页面初始化失败，请检查网络连接或联系管理员',
      type: 'error',
      duration: 5000
    })
  }
  window.addEventListener('resize', handleResize)
})

// 在组件卸载时释放资源
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (monthlyChart) monthlyChart.dispose()
  if (categoryChart) categoryChart.dispose()
})

// 辅助：获取银行 Logo（优先 DB 返回，其次按 bank_code 回退静态资源）
function getBankLogo(row) {
  if (!row) return ''
  if (row.bank_logo) return row.bank_logo
  if (row.bank_code) return `/banks/${String(row.bank_code).toLowerCase()}.svg`
  return ''
}
</script>

<style scoped>
.transactions-view {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.bank-display {
  display: flex;
  align-items: center;
}

.bank-logo {
  height: 24px;
  max-width: 100px;
  object-fit: contain;
}

.stats-panel {
  margin-bottom: 20px;
}

.chart-row {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 8px;
}

.positive {
  color: #67C23A;
}

.negative {
  color: #F56C6C;
}

.gray-text {
  color: #909399;
}

.chart-container {
  height: 300px;
}

.active-filters {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.filter-label {
  margin-right: 10px;
  font-weight: bold;
}

.active-filters .el-tag {
  margin-right: 8px;
  margin-bottom: 5px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.upload-area {
  margin-bottom: 20px;
}

.preview-section {
  margin-top: 20px;
}

.preview-info {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.template-info {
  margin-bottom: 20px;
}

.template-format {
  margin-top: 20px;
}

.template-format h4 {
  margin-bottom: 10px;
}

.template-format ul {
  padding-left: 20px;
  margin-bottom: 15px;
}
</style>
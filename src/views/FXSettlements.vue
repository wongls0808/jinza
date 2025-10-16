<template>
  <div class="page">
    <h1>{{ t('fx.settlementHistory') }}</h1>
    <div class="filters">
      <el-select v-model="qCustomerId" filterable clearable :placeholder="t('fx.selectCustomer')" style="min-width:240px">
        <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="(c.abbr ? (c.abbr + ' · ') : '') + c.name" />
      </el-select>
  <el-date-picker v-model="qRange" type="daterange" range-separator="-" :start-placeholder="t('transactions.startDate')" :end-placeholder="t('transactions.endDate')" value-format="YYYY-MM-DD" />
      <el-button type="primary" @click="reload(1)">{{ t('common.search') }}</el-button>
      <el-button @click="resetFilters">{{ t('common.reset') }}</el-button>
      <div style="flex:1"></div>
      <el-button @click="exportCsv('page')">{{ t('common.export') }} ({{ t('common.currentPage') }})</el-button>
      <el-button type="primary" @click="exportCsv('all')">{{ t('common.export') }} ({{ t('common.filtered') }})</el-button>
    </div>
    <el-table :data="rows" border size="small" @header-dragend="onColResize">
      <el-table-column prop="settle_date" column-key="settle_date" :label="t('fx.settleDate')" :width="colW('settle_date', 120)">
        <template #default="{ row }">{{ fmtDate(row.settle_date) }}</template>
      </el-table-column>
      <el-table-column prop="bill_no" column-key="bill_no" :label="t('common.billNo')" :width="colW('bill_no', 180)" />
      <el-table-column prop="customer_abbr" column-key="customer_abbr" :label="t('customers.fields.abbr')" :width="colW('customer_abbr', 120)" />
      <el-table-column prop="customer_name" column-key="customer_name" :label="t('customers.fields.name')" :width="colW('customer_name', 200)" />
      <el-table-column prop="pre_balance_myr" column-key="pre_balance_myr" :label="t('accounts.fields.balance')" :width="colW('pre_balance_myr', 140)" align="right">
        <template #default="{ row }">{{ money(row.pre_balance_myr) }}</template>
      </el-table-column>
      <el-table-column prop="total_base" column-key="total_base" :label="t('fx.selectedBase')" :width="colW('total_base', 140)" align="right">
        <template #default="{ row }">{{ money(row.total_base) }}</template>
      </el-table-column>
      <el-table-column prop="rate" column-key="rate" :label="t('fx.rate')" :width="colW('rate', 110)" align="right" />
      <el-table-column prop="customer_tax_rate" column-key="customer_tax_rate" :label="t('fx.customerTaxRate')" :width="colW('customer_tax_rate', 130)" align="right">
        <template #default="{ row }">{{ Number(row.customer_tax_rate||0).toFixed(2) }}%</template>
      </el-table-column>
      <el-table-column prop="total_settled" column-key="total_settled" :label="t('fx.selectedSettled')" :width="colW('total_settled', 140)" align="right">
        <template #default="{ row }">{{ money0(row.total_settled) }}</template>
      </el-table-column>
      <el-table-column prop="created_by_name" column-key="created_by_name" :label="t('common.createdBy')" :width="colW('created_by_name', 120)" />
      <el-table-column :label="t('common.actions')" width="220" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">{{ t('common.view') }}</el-button>
          <el-button size="small" type="primary" @click="downloadCsv(row)">CSV</el-button>
          <template v-if="has('delete_fx')">
            <el-popconfirm :title="t('common.confirmDelete')" @confirm="removeBill(row)">
              <template #reference>
                <el-button size="small" type="danger">{{ t('common.delete') }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager">
      <el-pagination
        background
        layout="prev, pager, next, sizes, total"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        @current-change="(p)=>reload(p)"
        @size-change="(s)=>{ pageSize = s; reload(1) }"
      />
    </div>

    <el-drawer v-model="drawerVisible" :title="t('common.details')" size="60%">
      <el-skeleton v-if="detailLoading" :rows="4" animated style="padding:8px" />
      <div v-else-if="detail" class="bill">
        <div class="bill-head">
          <div class="row">
            <div class="cell"><span class="k">{{ t('common.billNo') }}</span><span class="v">{{ detail.bill_no }}</span></div>
            <div class="cell"><span class="k">{{ t('fx.settleDate') }}</span><span class="v">{{ fmtDate(detail.settle_date) }}</span></div>
            <div class="cell"><span class="k">{{ t('fx.rate') }}</span><span class="v">{{ Number(detail.rate||0).toFixed(4) }}</span></div>
          </div>
          <div class="row">
            <div class="cell"><span class="k">{{ t('customers.fields.abbr') }}</span><span class="v">{{ detail.customer_abbr || '-' }}</span></div>
            <div class="cell"><span class="k">{{ t('customers.fields.name') }}</span><span class="v">{{ detail.customer_name }}</span></div>
            <div class="cell"><span class="k">{{ t('fx.customerTaxRate') }}</span><span class="v">{{ Number(detail.customer_tax_rate||0).toFixed(2) }}%</span></div>
          </div>
          <div class="row">
            <div class="cell"><span class="k">{{ t('fx.preBalance') }}</span><span class="v">{{ money(detail.pre_balance_myr) }}</span></div>
            <div class="cell"><span class="k">{{ t('fx.selectedBase') }}</span><span class="v">{{ money(detail.total_base) }}</span></div>
            <div class="cell"><span class="k">{{ t('fx.selectedSettled') }}</span><span class="v">{{ money0(detail.total_settled) }}</span></div>
          </div>
          <div class="row">
            <div class="cell"><span class="k">{{ t('common.createdBy') }}</span><span class="v">{{ detail.created_by_name }}</span></div>
            <div class="cell"><span class="k">{{ t('common.createdAt') }}</span><span class="v">{{ fmtDate(detail.created_at) }}</span></div>
            <div class="cell actions"><el-button type="primary" @click="downloadPdf(detail)">PDF</el-button></div>
          </div>
        </div>

        <el-table 
          :data="detail.items || []" 
          border 
          size="small" 
          height="60vh" 
          show-summary 
          :summary-method="summaryMethod"
          @header-dragend="memDetail.onColResize"
        >
          <el-table-column type="index" column-key="idx" :label="t('common.no')" :width="memDetail.colW('idx', 60)" />
          <el-table-column prop="ref_no" column-key="ref_no" :label="t('transactions.chequeRefNo')" :width="memDetail.colW('ref_no', 150)" />
          <el-table-column prop="trn_date" column-key="trn_date" :label="t('transactions.transactionDate')" :width="memDetail.colW('trn_date', 130)">
            <template #default="{ row }">{{ fmtDate(row.trn_date) }}</template>
          </el-table-column>
          <el-table-column prop="bank_name_en" column-key="bank_name_en" :label="t('banks.title')" :width="memDetail.colW('bank_name_en', 160)" />
          <el-table-column prop="account_name" column-key="account_name" :label="t('accounts.fields.accountName')" :width="memDetail.colW('account_name', 220)" />
          <el-table-column prop="account_number" column-key="account_number" :label="t('accounts.fields.bankAccount')" :width="memDetail.colW('account_number', 160)" />
          <el-table-column prop="amount_base" column-key="amount_base" :label="t('fx.baseAmount')" :width="memDetail.colW('amount_base', 120)" align="right">
            <template #default="{ row }">{{ money(row.amount_base) }}</template>
          </el-table-column>
          <el-table-column prop="amount_settled_calc" column-key="amount_settled_calc" :label="t('fx.settledAmount')" :width="memDetail.colW('amount_settled_calc', 140)" align="right">
            <template #default="{ row }">{{ money0(row.amount_settled_calc) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api, request as httpRequest } from '@/api'
import { useTableMemory } from '@/composables/useTableMemory'
import { useAuth } from '@/composables/useAuth'
const { t, locale } = useI18n()
const { has } = useAuth()
const rows = ref([])
const total = ref(0)
const page = ref(1)
let pageSize = 20
const customers = ref([])
const qCustomerId = ref(null)
const qRange = ref([])
const { colW, onColResize } = useTableMemory('fx-settlements')
// 详情表格使用独立的列宽记忆，带上单据ID避免与不同单据冲突
let memDetailInst = useTableMemory('fx-settle-detail')
const memDetail = {
  setId(id){
    const key = `fx-settle-detail:${id || '0'}`
    memDetailInst = useTableMemory(key)
  },
  colW(col, def){ return memDetailInst.colW(col, def) },
  onColResize(newW, oldW, col, evt){ return memDetailInst.onColResize(newW, oldW, col, evt) },
  reset(){ return memDetailInst.reset() }
}
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
function money0(v){ return Math.round(Number(v||0)).toLocaleString() }
async function loadCustomers(){ const res = await api.customers.list({ pageSize: 1000 }); customers.value = res.items || [] }
async function reload(p){
  if (p) page.value = p
  const params = { page: page.value, pageSize }
  if (qCustomerId.value) params.customerId = qCustomerId.value
  if (Array.isArray(qRange.value) && qRange.value.length === 2) {
    params.startDate = qRange.value[0]
    params.endDate = qRange.value[1]
  }
  const res = await api.fx.settlements.list(params)
  if (Array.isArray(res)) { rows.value = res; total.value = res.length }
  else { rows.value = res.items || []; total.value = Number(res.total||0) }
}
function resetFilters(){ qCustomerId.value = null; qRange.value = []; reload(1) }
async function exportCsv(scope){
  const params = {}
  if (scope === 'page') { params.page = page.value; params.pageSize = pageSize; params.scope = 'page' }
  if (qCustomerId.value) params.customerId = qCustomerId.value
  if (Array.isArray(qRange.value) && qRange.value.length === 2) { params.startDate = qRange.value[0]; params.endDate = qRange.value[1] }
  const csv = await api.fx.settlements.exportListCsv(params)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Settlements-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
onMounted(() => { loadCustomers(); reload(1) })

const drawerVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
async function openDetail(row){
  drawerVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const d = await api.fx.settlements.detail(row.id)
    detail.value = d
    // 切换列宽记忆命名空间为该单据
    memDetail.setId && memDetail.setId(d.id)
  } catch (e) {
    ElMessage.error(t('common.loadFailed'))
    drawerVisible.value = false
  } finally {
    detailLoading.value = false
  }
}
async function downloadCsv(row){
  const csv = await api.fx.settlements.exportCsv(row.id)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Settlement-${row.id}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
async function downloadPdf(row){
  try {
    const token = (function(){
      try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
      try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
      return null
    })()
    const headers = { }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const lang = encodeURIComponent(String(locale?.value || ''))
    const urlReq = `${location.origin}/api/fx/settlements/${row.id}/pdf?lang=${lang}`
    const res = await fetch(urlReq, { headers })
    if (!res.ok) throw new Error(await res.text())
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.bill_no || ('Settlement-' + row.id)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch(e) {
    ElMessage.error(t('common.exportFailed'))
  }
}
async function removeBill(row){
  try {
  await httpRequest(`/fx/settlements/${row.id}`, { method: 'DELETE' })
    ElMessage.success(t('common.ok'))
    reload()
  } catch (e) {
    ElMessage.error(t('common.deleteFailed'))
  }
}

function fmtDate(v){
  if (!v) return ''
  // 支持 Date 或字符串，统一输出 YYYY-MM-DD
  try {
    if (typeof v === 'string') return v.slice(0,10)
    if (v.toISOString) return v.toISOString().slice(0,10)
    return String(v).slice(0,10)
  } catch { return String(v).slice(0,10) }
}

function summaryMethod({ data }){
  const sumBase = data.reduce((s, r) => s + Number(r.amount_base||0), 0)
  const sumSettle = data.reduce((s, r) => s + Number(r.amount_settled_calc||0), 0)
  // 列顺序：#，参考号，日期，银行，账户名，账号，马币，折算
  return [t('common.total') || '合计', '', '', '', '', '', money(sumBase), money0(sumSettle)]
}
</script>

<style scoped>
.page { padding: 8px; }
.filters { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.pager { display:flex; justify-content:flex-end; margin-top:8px; }
.head { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:6px; margin-bottom:8px; }
.bill { padding-right: 8px; }
.bill-head { display:flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.bill-head .row { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.bill-head .cell { display:flex; gap:6px; align-items:center; min-height:28px; }
.bill-head .cell .k { color:#666; min-width:110px; }
.bill-head .cell .v { font-weight: 600; }
</style>

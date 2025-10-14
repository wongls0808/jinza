<template>
  <div class="page">
    <h1>{{ t('fx.paymentHistory') }}</h1>
    <div class="filters">
      <el-select v-model="qCustomerId" filterable clearable :placeholder="t('fx.selectCustomer')" style="min-width:240px">
        <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="(c.abbr ? (c.abbr + ' · ') : '') + c.name" />
      </el-select>
      <el-date-picker v-model="qRange" type="daterange" range-separator="-" start-placeholder="Start" end-placeholder="End" value-format="YYYY-MM-DD" />
      <el-select v-model="qStatus" clearable placeholder="状态" style="width:140px">
        <el-option :value="'pending'" label="审核中" />
        <el-option :value="'completed'" label="已完成" />
      </el-select>
      <el-button type="primary" @click="reload(1)">{{ t('common.search') }}</el-button>
      <el-button @click="resetFilters">{{ t('common.reset') }}</el-button>
      <div style="flex:1"></div>
      <el-button @click="exportCsv('page')">{{ t('common.export') }} ({{ t('common.currentPage') }})</el-button>
      <el-button type="primary" @click="exportCsv('all')">{{ t('common.export') }} ({{ t('common.filtered') }})</el-button>
    </div>
    <el-table :data="rows" border size="small" @header-dragend="onColResize">
      <el-table-column :label="t('common.no')" width="60">
        <template #default="{ $index }">{{ (page-1)*pageSize + $index + 1 }}</template>
      </el-table-column>
      <el-table-column prop="pay_date" column-key="pay_date" label="付款日期" :width="colW('pay_date', 120)">
        <template #default="{ row }">{{ fmtDate(row.pay_date) }}</template>
      </el-table-column>
      <el-table-column prop="bill_no" column-key="bill_no" label="单号" :width="colW('bill_no', 180)" />
      <el-table-column prop="customer_name" column-key="customer_name" label="客户" :width="colW('customer_name', 200)" />
      <el-table-column prop="balance_cny" column-key="balance_cny" label="余额(CNY)" :width="colW('balance_cny', 140)" align="right">
        <template #default="{ row }">{{ money(row.balance_cny) }}</template>
      </el-table-column>
      <el-table-column prop="account_name" column-key="account_name" label="账户名称" :width="colW('account_name', 200)" />
      <el-table-column prop="bank_name" column-key="bank_name" label="银行" :width="colW('bank_name', 200)">
        <template #default="{ row }">
          <div class="bank-cell">
            <img v-show="!logoFail[logoKey(row)]" :src="resolveLogo(row)" alt="logo" class="bank-logo" @error="onLogoError($event, row)" />
            <span v-show="logoFail[logoKey(row)]" class="bank-text">{{ (row.bank_code || '').toUpperCase().slice(0,6) }}</span>
            <span class="bank-name">{{ row.bank_name || row.bank_code }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="bank_account" column-key="bank_account" label="银行账户" :width="colW('bank_account', 180)" />
      <el-table-column prop="currency_code" column-key="currency_code" label="币种" :width="colW('currency_code', 100)" />
      <el-table-column prop="amount" column-key="amount" label="金额" :width="colW('amount', 140)" align="right">
        <template #default="{ row }">{{ money(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="created_by_name" column-key="created_by_name" :label="t('common.createdBy')" :width="colW('created_by_name', 120)" />
      <el-table-column prop="status" column-key="status" label="状态" :width="colW('status', 110)">
        <template #default="{ row }">
          <el-tag :type="row.status==='completed' ? 'success' : 'warning'">{{ row.status==='completed' ? '已完成' : '审核中' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="180" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">{{ t('common.view') }}</el-button>
          <el-button size="small" type="success" v-if="row.status==='completed'" @click="downloadPdf(row)">PDF</el-button>
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
            <div class="cell"><span class="k">{{ t('common.billNo') }}</span><span class="v">{{ detail.bill_no || ('Payment-' + detail.id) }}</span></div>
            <div class="cell"><span class="k">{{ t('fx.payDate') }}</span><span class="v">{{ fmtDate(detail.pay_date) }}</span></div>
            <div class="cell"><span class="k">{{ t('common.amount') }}</span><span class="v">{{ money(detailTotal) }}</span></div>
          </div>
          <div class="row">
            <div class="cell"><span class="k">{{ t('customers.fields.name') }}</span><span class="v">{{ detail.customer_name }}</span></div>
            <div class="cell"><span class="k">{{ t('common.createdBy') }}</span><span class="v">{{ detail.created_by_name }}</span></div>
            <div class="cell"><span class="k">{{ t('common.createdAt') }}</span><span class="v">{{ fmtDate(detail.created_at) }}</span></div>
          </div>
          <div class="row">
            <div class="cell actions"><el-button type="primary" @click="downloadCsv(detail)">CSV</el-button></div>
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
          <el-table-column prop="account_name" column-key="account_name" :label="t('accounts.fields.accountName')" :width="memDetail.colW('account_name', 220)" />
          <el-table-column prop="bank_account" column-key="bank_account" :label="t('accounts.fields.bankAccount')" :width="memDetail.colW('bank_account', 200)" />
          <el-table-column prop="currency_code" column-key="currency_code" :label="t('currencies.code')" :width="memDetail.colW('currency_code', 120)" />
          <el-table-column prop="amount" column-key="amount" :label="t('common.amount')" :width="memDetail.colW('amount', 140)" align="right">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api, request as httpRequest } from '@/api'
import { useTableMemory } from '@/composables/useTableMemory'
import { useAuth } from '@/composables/useAuth'
const { t } = useI18n()
const { has } = useAuth()
const rows = ref([])
const total = ref(0)
const page = ref(1)
let pageSize = 20
const customers = ref([])
const qCustomerId = ref(null)
const qRange = ref([])
const qStatus = ref('')
const { colW, onColResize } = useTableMemory('fx-payments')
// 详情表格使用独立列宽记忆，按单据ID区分
let memDetailInst = useTableMemory('fx-pay-detail')
const memDetail = {
  setId(id){
    const key = `fx-pay-detail:${id || '0'}`
    memDetailInst = useTableMemory(key)
  },
  colW(col, def){ return memDetailInst.colW(col, def) },
  onColResize(newW, oldW, col, evt){ return memDetailInst.onColResize(newW, oldW, col, evt) },
  reset(){ return memDetailInst.reset() }
}
async function loadCustomers(){ const res = await api.customers.list({ pageSize: 1000 }); customers.value = res.items || [] }
async function reload(p){
  if (p) page.value = p
  const params = { page: page.value, pageSize, view: 'item' }
  if (qCustomerId.value) params.customerId = qCustomerId.value
  if (Array.isArray(qRange.value) && qRange.value.length === 2) { params.startDate = qRange.value[0]; params.endDate = qRange.value[1] }
  if (qStatus.value) params.status = qStatus.value
  const res = await api.fx.payments.list(params)
  if (Array.isArray(res)) { rows.value = res; total.value = res.length }
  else { rows.value = res.items || []; total.value = Number(res.total||0) }
}
function resetFilters(){ qCustomerId.value = null; qRange.value = []; qStatus.value = ''; reload(1) }
async function exportCsv(scope){
  const params = {}
  if (scope === 'page') { params.page = page.value; params.pageSize = pageSize; params.scope = 'page' }
  if (qCustomerId.value) params.customerId = qCustomerId.value
  if (Array.isArray(qRange.value) && qRange.value.length === 2) { params.startDate = qRange.value[0]; params.endDate = qRange.value[1] }
  const csv = await api.fx.payments.exportListCsv(params)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Payments-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
onMounted(() => { loadCustomers(); reload(1) })

function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
const drawerVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
async function openDetail(row){
  drawerVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const id = row.payment_id || row.id
    const d = await api.fx.payments.detail(id)
    detail.value = d
    memDetail.setId && memDetail.setId(d.id)
  } catch (e) {
    ElMessage.error(e?.message || 'Failed to load')
    drawerVisible.value = false
  } finally {
    detailLoading.value = false
  }
}
async function downloadCsv(row){
  const id = row.payment_id || row.id
  const csv = await api.fx.payments.exportCsv(id)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Payment-${id}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
async function removeBill(row){
  try {
    const id = row.payment_id || row.id
    await httpRequest(`/fx/payments/${id}`, { method: 'DELETE' })
    ElMessage.success(t('common.ok'))
    reload()
  } catch (e) {
    ElMessage.error(e?.message || 'Delete failed')
  }
}

async function approve(row){
  try {
    const id = row.payment_id || row.id
    await api.fx.payments.approve(id)
    ElMessage.success('审核完成')
    // 审核通过后自动下载 PDF
    try { await downloadPdf(row) } catch {}
    reload()
  } catch(e) {
    ElMessage.error(e?.message || '审批失败')
  }
}

async function downloadPdf(row){
  const id = row.payment_id || row.id
  const blob = await api.fx.payments.exportPdf(id)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${row.bill_no || ('Payment-' + id)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

function fmtDate(v){
  if (!v) return ''
  try {
    if (typeof v === 'string') return v.slice(0,10)
    if (v.toISOString) return v.toISOString().slice(0,10)
    return String(v).slice(0,10)
  } catch { return String(v).slice(0,10) }
}

const detailTotal = computed(() => {
  const items = detail.value?.items || []
  return items.reduce((s, r) => s + Number(r.amount||0), 0)
})

function summaryMethod({ data }){
  const sum = data.reduce((s, r) => s + Number(r.amount||0), 0)
  // 列顺序：#，账户名，账号，币种，金额
  return [t('common.total') || '合计', '', '', '', money(sum)]
}

// ---- 银行 logo 前端回退解析：DB 优先，失败回退到静态 /banks/<code>.(svg|png|jpg) ----
const logoFail = ref({})
const aliasMap = {
  pbb: 'public', public: 'public',
  maybank: 'maybank', mbb: 'maybank', mayb: 'maybank',
  hlb: 'hlb', hongleong: 'hlb',
  cimb: 'cimb', rhb: 'rhb', icbc: 'icbc', abc: 'abc', boc: 'boc', ccb: 'ccb', bcm: 'bcm',
  abmb: 'alliance'
}
function logoKey(row){ return (row.bank_code || '').toLowerCase() }
function resolveLogo(row){
  const key = logoKey(row)
  if (!key) return row.bank_logo_url || ''
  if (logoFail.value[key]) return ''
  const db = row.bank_logo_url || row.logo_url || ''
  if (db) return db
  const mapped = aliasMap[key] || key
  return `/banks/${mapped}.svg`
}
function onLogoError(evt, row){
  const key = logoKey(row)
  const cur = evt?.target?.getAttribute('src') || ''
  if (cur.endsWith('.svg')) evt.target.setAttribute('src', cur.replace('.svg', '.png'))
  else if (cur.endsWith('.png')) evt.target.setAttribute('src', cur.replace('.png', '.jpg'))
  else logoFail.value[key] = true
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
.bank-cell { display:flex; align-items:center; gap:8px; height: 24px; }
.bank-logo { max-width: 80px; max-height: 18px; object-fit: contain; display:inline-block; }
.bank-text { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 600; letter-spacing: .5px; }
.bank-name { font-weight: 600; }
</style>

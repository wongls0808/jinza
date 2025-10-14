<template>
  <div class="page">
    <h1>{{ t('fx.settlementHistory') }}</h1>
    <div class="filters">
      <el-select v-model="qCustomerId" filterable clearable :placeholder="t('fx.selectCustomer')" style="min-width:240px">
        <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="c.name" />
      </el-select>
      <el-date-picker v-model="qRange" type="daterange" range-separator="-" start-placeholder="Start" end-placeholder="End" value-format="YYYY-MM-DD" />
      <el-button type="primary" @click="reload(1)">{{ t('common.search') }}</el-button>
      <el-button @click="resetFilters">{{ t('common.reset') }}</el-button>
      <div style="flex:1"></div>
      <el-button @click="exportCsv('page')">{{ t('common.export') }} ({{ t('common.currentPage') }})</el-button>
      <el-button type="primary" @click="exportCsv('all')">{{ t('common.export') }} ({{ t('common.filtered') }})</el-button>
    </div>
    <el-table :data="rows" border size="small" @header-dragend="onColResize">
      <el-table-column :label="t('common.no')" width="70">
        <template #default="{ $index }">{{ (page-1)*pageSize + $index + 1 }}</template>
      </el-table-column>
      <el-table-column prop="bill_no" :label="t('common.billNo')" :width="colW('bill_no', 200)" />
      <el-table-column prop="customer_name" :label="t('customers.fields.name')" :width="colW('customer_name', 200)" />
      <el-table-column prop="settle_date" :label="t('fx.settleDate')" :width="colW('settle_date', 130)" />
      <el-table-column prop="rate" :label="t('fx.rate')" :width="colW('rate', 120)" align="right" />
      <el-table-column prop="total_base" :label="t('fx.selectedBase')" :width="colW('total_base', 160)" align="right">
        <template #default="{ row }">{{ money(row.total_base) }}</template>
      </el-table-column>
      <el-table-column prop="total_settled" :label="t('fx.selectedSettled')" :width="colW('total_settled', 160)" align="right">
        <template #default="{ row }">{{ money(row.total_settled) }}</template>
      </el-table-column>
      <el-table-column prop="created_by_name" :label="t('common.createdBy')" :width="colW('created_by_name', 140)" />
      <el-table-column :label="t('common.actions')" width="220" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">{{ t('common.view') }}</el-button>
          <el-button size="small" type="primary" @click="downloadCsv(row)">CSV</el-button>
          <el-popconfirm :title="t('common.confirmDelete')" @confirm="removeBill(row)">
            <template #reference>
              <el-button size="small" type="danger">{{ t('common.delete') }}</el-button>
            </template>
          </el-popconfirm>
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

    <el-drawer v-model="drawerVisible" :title="t('common.details')" size="50%">
      <div v-if="detail">
        <div class="head">
          <div><b>ID</b>: {{ detail.id }}</div>
          <div><b>{{ t('customers.fields.name') }}</b>: {{ detail.customer_name }}</div>
          <div><b>{{ t('fx.settleDate') }}</b>: {{ detail.settle_date }}</div>
          <div><b>{{ t('fx.rate') }}</b>: {{ detail.rate }}</div>
          <div><b>{{ t('fx.selectedBase') }}</b>: {{ money(detail.total_base) }}</div>
          <div><b>{{ t('fx.selectedSettled') }}</b>: {{ money(detail.total_settled) }}</div>
          <div><b>{{ t('common.createdAt') }}</b>: {{ detail.created_at }}</div>
          <div><b>{{ t('common.createdBy') }}</b>: {{ detail.created_by_name }}</div>
        </div>
        <div style="margin:8px 0;">
          <el-button type="primary" @click="downloadCsv(detail)">CSV</el-button>
        </div>
        <el-table :data="detail.items || []" border size="small" height="60vh">
          <el-table-column prop="transaction_id" label="TX ID" width="100"/>
          <el-table-column prop="trn_date" :label="t('transactions.fields.date')" width="140"/>
          <el-table-column prop="account_number" :label="t('accounts.fields.number')" />
          <el-table-column prop="amount_base" :label="t('fx.baseAmount')" width="140" align="right">
            <template #default="{ row }">{{ money(row.amount_base) }}</template>
          </el-table-column>
          <el-table-column prop="amount_settled" :label="t('fx.settledAmount')" width="140" align="right">
            <template #default="{ row }">{{ money(row.amount_settled) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import { useTableMemory } from '@/composables/useTableMemory'
const { t } = useI18n()
const rows = ref([])
const total = ref(0)
const page = ref(1)
let pageSize = 20
const customers = ref([])
const qCustomerId = ref(null)
const qRange = ref([])
const { colW, onColResize } = useTableMemory('fx-settlements')
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
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
const detail = ref(null)
async function openDetail(row){
  detail.value = await api.fx.settlements.detail(row.id)
  drawerVisible.value = true
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
async function removeBill(row){
  await api.request(`/fx/settlements/${row.id}`, { method: 'DELETE' })
  reload()
}
</script>

<style scoped>
.page { padding: 8px; }
.filters { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.pager { display:flex; justify-content:flex-end; margin-top:8px; }
.head { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:6px; margin-bottom:8px; }
</style>

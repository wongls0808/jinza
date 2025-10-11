<template>
  <div class="page container">
    <div class="head">
      <div class="title">{{ $t('receipts.title') }}</div>
      <div class="spacer"></div>
      <el-button size="small" @click="$router.push('/')">{{ $t('common.backHome') }}</el-button>
    </div>

    <el-card class="jelly">
      <template #header>
        <div class="toolbar">
          <el-button size="small" @click="pickFile">{{ $t('receipts.import') }}</el-button>
          <input ref="fileInput" type="file" accept=".csv,.tsv,.txt" style="display:none" @change="onPicked" />
          <div class="spacer"></div>
          <el-input v-model.trim="q" size="small" :placeholder="$t('receipts.searchTxn')" style="width:220px" @keyup.enter.native="loadTxns" />
        </div>
      </template>

      <el-table :data="txns" size="small" border height="600" @sort-change="onSort" style="width:100%" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="trn_date" :label="$t('receipts.trnDate')" sortable="custom" width="120">
          <template #default="{ row }">{{ fmtDate(row.trn_date) }}</template>
        </el-table-column>
        <el-table-column prop="account_number" :label="$t('receipts.accountNumber')" width="150" />
        <el-table-column prop="account_name" :label="$t('receipts.accountName')" width="200" />
        <el-table-column prop="cheque_ref" :label="$t('receipts.cheque')" width="140" />
        <el-table-column prop="reference" label="Reference" width="180">
          <template #default="{ row }">{{ [row.ref1, row.ref2, row.ref3].filter(Boolean).join(' ') }}</template>
        </el-table-column>
        <el-table-column prop="description" :label="$t('receipts.desc')" />
        <el-table-column prop="debit" :label="$t('receipts.debit')" sortable="custom" width="120">
          <template #default="{ row }">{{ money(row.debit) }}</template>
        </el-table-column>
        <el-table-column prop="credit" :label="$t('receipts.credit')" sortable="custom" width="120">
          <template #default="{ row }">{{ money(row.credit) }}</template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10,20,50,100]"
          @size-change="onPageSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const txns = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const sort = ref('trn_date')
const order = ref('asc')
const q = ref('')
const selectedRows = ref([])

function pickFile() { fileInput.value && fileInput.value.click() }
const fileInput = ref(null)

async function onPicked(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  try {
    const text = await f.text()
    const res = await api.receipts.importCsv(text, f.name || '')
    if (res && typeof res.inserted === 'number') {
      const skipped = res.skipped || 0
      if (res.inserted > 0) {
        ElMessage.success(`导入成功，新增 ${res.inserted} 条，重复跳过 ${skipped} 条`)
      } else {
        ElMessage.warning(`导入完成，未识别到交易行；（重复跳过 ${skipped} 条）请检查文件格式`)
      }
    } else {
      ElMessage.success('导入成功')
    }
    await reload()
  } catch {
    ElMessage.error('导入失败')
  } finally {
    e.target.value = ''
  }
}

function fmtDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString() } catch { return '' } }
function money(v) { if (v == null) return ''; return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

async function loadTxns() {
  const data = await api.receipts.listAllTransactions({ page: page.value, pageSize: pageSize.value, sort: sort.value, order: order.value, q: q.value })
  txns.value = data.items || []
  total.value = data.total || 0
}
const reload = () => { page.value = 1; loadTxns() }

function onSort({ prop, order: ord }) {
  if (!prop) return
  sort.value = prop
  order.value = ord === 'ascending' ? 'asc' : 'desc'
  loadTxns()
}
function onPageSizeChange(ps) { pageSize.value = ps; page.value = 1; loadTxns() }
function onPageChange(p) { page.value = p; loadTxns() }
function onSelectionChange(val) { selectedRows.value = val }

onMounted(loadTxns)
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 8px; }
.title { font-size: 18px; font-weight: 700; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.grid2 { display: contents; }
.pager { display: flex; justify-content: flex-end; padding: 12px 0 4px; }
</style>

<template>
  <div class="page container">
    <div class="head">
      <div>
        <div class="title">客户管理</div>
        <div class="sub">支持添加/删除/导入/导出；字段：勾选、序号、简称、客户名、税率、马币金额(期初)、人民币金额(期初)、提交人</div>
      </div>
      <div class="ops">
        <el-input v-model.trim="q" placeholder="搜索 简称/客户名" size="small" style="width:220px" @keyup.enter.native="reload" />
        <el-button size="small" @click="reload">搜索</el-button>
        <el-button size="small" @click="downloadTemplate">模板下载</el-button>
        <el-button type="primary" size="small" @click="openAdd">添加</el-button>
        <el-button type="danger" :disabled="!selection.length" @click="removeSelected">删除</el-button>
        <el-upload :show-file-list="false" accept=".csv" :on-change="onImport">
          <el-button>导入</el-button>
        </el-upload>
        <el-button @click="onExport">导出</el-button>
      </div>
    </div>

    <el-card class="jelly">
      <el-table
        ref="tableRef"
        :data="rows"
        size="small"
        border
        style="width: 100%"
        @selection-change="(val)=> selection = val"
        @sort-change="onSort"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" type="index" width="70" />
        <el-table-column prop="abbr" label="简称" sortable="custom" width="140" />
        <el-table-column prop="name" label="客户名" sortable="custom" min-width="180" />
        <el-table-column prop="tax_rate" label="税率(%)" sortable="custom" width="100">
          <template #default="{ row }">{{ formatPercent(row.tax_rate) }}</template>
        </el-table-column>
        <el-table-column prop="opening_myr" label="马币金额(期初)" sortable="custom" width="160">
          <template #default="{ row }">{{ formatMoney(row.opening_myr) }}</template>
        </el-table-column>
        <el-table-column prop="opening_cny" label="人民币金额(期初)" sortable="custom" width="160">
          <template #default="{ row }">{{ formatMoney(row.opening_cny) }}</template>
        </el-table-column>
        <el-table-column prop="submitter" label="提交人" width="140" />
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="addDlg.visible" title="添加客户" width="520px">
      <div class="form">
        <el-input v-model.trim="addDlg.form.abbr" placeholder="简称" />
        <el-input v-model.trim="addDlg.form.name" placeholder="客户名" />
        <el-input v-model.number="addDlg.form.tax_rate" placeholder="税率 %" />
        <div class="grid2">
          <el-input v-model.number="addDlg.form.opening_myr" placeholder="马币金额(期初)" />
          <el-input v-model.number="addDlg.form.opening_cny" placeholder="人民币金额(期初)" />
        </div>
        <el-input v-model.trim="addDlg.form.submitter" placeholder="提交人" />
      </div>
      <template #footer>
        <el-button @click="addDlg.visible=false">取消</el-button>
        <el-button type="primary" :loading="addDlg.loading" @click="doAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const tableRef = ref()
const rows = ref([])
let selection = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const sort = ref('id')
const order = ref('desc')
const q = ref('')
const addDlg = ref({ visible: false, loading: false, form: { abbr: '', name: '', tax_rate: 0, opening_myr: 0, opening_cny: 0, submitter: '' } })

async function reload() {
  const data = await api.customers.list({ q: q.value, page: page.value, pageSize: pageSize.value, sort: sort.value, order: order.value })
  rows.value = data.items || []
  total.value = data.total || 0
}

function openAdd() {
  addDlg.value = { visible: true, loading: false, form: { abbr: '', name: '', tax_rate: 0, opening_myr: 0, opening_cny: 0, submitter: '' } }
}
async function doAdd() {
  addDlg.value.loading = true
  try {
    const f = addDlg.value.form
    if (!f.name) return ElMessage.warning('请填写客户名')
    if (f.tax_rate < 0 || f.tax_rate > 100) return ElMessage.warning('税率应在 0-100 之间')
    await api.customers.create(f)
    addDlg.value.visible = false
    await reload()
    ElMessage.success('已添加')
  } finally {
    addDlg.value.loading = false
  }
}

async function removeSelected() {
  if (!selection.value.length) return
  const ids = selection.value.map(r => r.id)
  await api.customers.removeBatch(ids)
  await reload()
  ElMessage.success('已删除所选')
}

function parseCSV(text) {
  // 简单 CSV 解析（逗号分隔，不处理转义与换行）
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const out = []
  for (const line of lines) {
    const [abbr, name, tax_rate, opening_myr, opening_cny, submitter] = line.split(',')
    if (!abbr && !name) continue
    out.push({
      abbr: abbr || '',
      name: name || '',
      tax_rate: Number(tax_rate || 0),
      opening_myr: Number(opening_myr || 0),
      opening_cny: Number(opening_cny || 0),
      submitter: submitter || ''
    })
  }
  return out
}

async function onImport(file) {
  try {
    const text = await file.raw.text()
    const data = parseCSV(text)
    await api.customers.importRows(data)
    await reload()
    ElMessage.success(`导入成功：${data.length} 条`)
  } catch (e) {
    ElMessage.error('导入失败')
  }
}

async function onExport() {
  const csv = await api.customers.exportCsv()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'customers.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadTemplate() {
  const csv = await api.customers.template()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'customers_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function onSort({ prop, order: ord }) {
  if (!prop) return
  sort.value = prop
  order.value = ord === 'ascending' ? 'asc' : 'desc'
  reload()
}

function formatMoney(v) { return Number(v||0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function formatPercent(v) { return Number(v||0).toFixed(2) }

onMounted(reload)
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 12px; }
.title { font-size: 18px; font-weight: 700; }
.sub { color: var(--el-text-color-secondary); font-size: 12px; }
.ops { display: flex; gap: 10px; }
.form { display: grid; gap: 12px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
</style>
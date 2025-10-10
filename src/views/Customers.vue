<template>
  <div class="page container">
    <div class="head">
      <div class="title">客户管理</div>
    </div>

  <el-card class="jelly">
      <template #header>
        <div class="toolbar">
          <el-input v-model.trim="q" placeholder="搜索 简称/客户名" size="small" style="width:220px" @keyup.enter.native="reload" />
          <el-button size="small" @click="reload">搜索</el-button>
          <div class="spacer"></div>
          <el-dropdown>
            <el-button size="small">导入</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-upload :show-file-list="false" accept=".csv" :on-change="onImportCsv" class="upload-inline">
                    <span>CSV 导入（自动解析）</span>
                  </el-upload>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-upload :show-file-list="false" accept=".csv" :on-change="onImport">
                    <span>CSV 导入（简单分割）</span>
                  </el-upload>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small" @click="onExport">导出</el-button>
          <el-button size="small" @click="downloadTemplate">模板</el-button>
          <el-button type="primary" size="small" @click="openAdd">添加</el-button>
          <el-button type="danger" size="small" :disabled="!selection.length" @click="removeSelected">删除</el-button>
        </div>
      </template>
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
import Papa from 'papaparse'
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
    const inserted = await batchImport(data)
    await reload()
    ElMessage.success(`导入成功：${inserted} 条`)
  } catch (e) {
    ElMessage.error('导入失败')
  }
}

async function onImportCsv(file) {
  try {
    const text = await file.raw.text()
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() })
    if (parsed.errors && parsed.errors.length) {
      console.warn('CSV parse errors:', parsed.errors)
    }
    const rows = (parsed.data || []).map(r => ({
      abbr: (r.abbr ?? r.ABBR ?? r.Abbr ?? '').toString().trim(),
      name: (r.name ?? r.NAME ?? r.Name ?? '').toString().trim(),
      tax_rate: Number(r.tax_rate ?? r.TAX_RATE ?? r.Tax_rate ?? 0),
      opening_myr: Number(r.opening_myr ?? r.MYR ?? r.opening_MYR ?? 0),
      opening_cny: Number(r.opening_cny ?? r.CNY ?? r.opening_CNY ?? 0),
      submitter: (r.submitter ?? r.SUBMITTER ?? r.Submitter ?? '').toString().trim()
    })).filter(r => r.name)
    const inserted = await batchImport(rows)
    await reload()
    ElMessage.success(`导入成功：${inserted} 条`)
  } catch (e) {
    ElMessage.error('导入失败：' + (e.message || ''))
  }
}

async function batchImport(allRows, chunkSize = 300) {
  let inserted = 0
  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize)
    if (!chunk.length) continue
    await api.customers.importRows(chunk)
    inserted += chunk.length
  }
  return inserted
}

async function onExport() {
  try {
    const csv = await api.customers.exportCsv()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || ''))
  }
}

async function downloadTemplate() {
  try {
    const csv = await api.customers.template()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers_template.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    // 后端不可用时，使用前端本地兜底模板
    try {
      const header = 'abbr,name,tax_rate,opening_myr,opening_cny,submitter'
      const sample = [
        'ABC,深圳市某某公司,6,1000,2000,王五',
        'DEF,广州某某集团,0,0,3500,李四'
      ].join('\n')
      const content = '\ufeff' + [header, sample].join('\n')
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'customers_template.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      ElMessage.info('后端暂不可用，已使用本地模板文件')
    } catch (err) {
      ElMessage.error('下载模板失败：' + (e.message || ''))
    }
  }
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

function onPageSizeChange(ps) {
  pageSize.value = ps
  page.value = 1
  reload()
}
function onPageChange(p) {
  page.value = p
  reload()
}
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 8px; }
.title { font-size: 18px; font-weight: 700; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.form { display: grid; gap: 12px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pager { display: flex; justify-content: flex-end; padding: 12px 0 4px; }
</style>
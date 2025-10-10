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
                <el-dropdown-item @click="pickImport('auto')">CSV 导入（自动解析）</el-dropdown-item>
                <el-dropdown-item @click="pickImport('simple')">CSV 导入（简单分割）</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <input ref="filePicker" type="file" accept=".csv" style="display:none" @change="onFilePicked" />
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
    <el-dialog v-model="addDlg.visible" title="添加客户" width="560px">
      <el-form ref="addFormRef" :model="addDlg.form" :rules="addRules" label-width="90px" class="form">
        <el-form-item label="简称">
          <el-input v-model.trim="addDlg.form.abbr" placeholder="例如：HZ" />
        </el-form-item>
        <el-form-item label="客户名" prop="name">
          <el-input v-model.trim="addDlg.form.name" placeholder="请输入客户全称" />
        </el-form-item>
        <el-form-item label="税率(%)" prop="tax_rate">
          <el-input-number v-model="addDlg.form.tax_rate" :precision="2" :min="0" :max="100" :step="1" controls-position="right" placeholder="0-100" style="width:100%" />
        </el-form-item>
        <div class="grid2">
          <el-form-item label="马币期初">
            <el-input-number v-model="addDlg.form.opening_myr" :precision="2" :min="0" :step="100" controls-position="right" placeholder="0.00" style="width:100%" />
          </el-form-item>
          <el-form-item label="人民币期初">
            <el-input-number v-model="addDlg.form.opening_cny" :precision="2" :min="0" :step="100" controls-position="right" placeholder="0.00" style="width:100%" />
          </el-form-item>
        </div>
        <!-- 提交人由后端从 token 自动识别，这里不再手动填写 -->
      </el-form>
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
const pageSize = ref(20)
const sort = ref('id')
const order = ref('desc')
const q = ref('')
const addDlg = ref({ visible: false, loading: false, form: { abbr: '', name: '', tax_rate: null, opening_myr: null, opening_cny: null } })
const addFormRef = ref()
const addRules = {
  name: [{ required: true, message: '请填写客户名', trigger: 'blur' }],
  tax_rate: [
    {
      validator: (_, v, cb) => {
        if (v === null || v === undefined || v === '') return cb()
        const n = Number(v)
        if (isNaN(n) || n < 0 || n > 100) return cb(new Error('税率应在 0-100 之间'))
        cb()
      },
      trigger: 'change'
    }
  ]
}
const filePicker = ref(null)
const importMode = ref('auto')

function pickImport(mode) {
  importMode.value = mode
  filePicker.value && filePicker.value.click()
}

async function reload() {
  const data = await api.customers.list({ q: q.value, page: page.value, pageSize: pageSize.value, sort: sort.value, order: order.value })
  rows.value = data.items || []
  total.value = data.total || 0
}

function openAdd() {
  addDlg.value = { visible: true, loading: false, form: { abbr: '', name: '', tax_rate: null, opening_myr: null, opening_cny: null } }
}
async function doAdd() {
  addDlg.value.loading = true
  try {
    const f = { ...addDlg.value.form }
    // 先进行表单校验
    if (addFormRef.value) {
      await addFormRef.value.validate()
    }
    // 将空值规范化为数字 0 再提交
    f.tax_rate = f.tax_rate == null || f.tax_rate === '' ? 0 : f.tax_rate
    f.opening_myr = f.opening_myr == null || f.opening_myr === '' ? 0 : f.opening_myr
    f.opening_cny = f.opening_cny == null || f.opening_cny === '' ? 0 : f.opening_cny
  await api.customers.create({ abbr: f.abbr, name: f.name, tax_rate: f.tax_rate, opening_myr: f.opening_myr, opening_cny: f.opening_cny })
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

// 自动检测编码并解码 CSV 文本：优先 utf-8，回退 gb18030/gbk/big5
async function decodeCsvFile(file) {
  const buf = await (file.arrayBuffer ? file.arrayBuffer() : new Response(file).arrayBuffer())
  const encodings = ['utf-8', 'gb18030', 'gbk', 'big5']
  let best = null
  for (const enc of encodings) {
    try {
      const dec = new TextDecoder(enc, { fatal: false })
      const text = dec.decode(buf)
      const repl = (text.match(/\uFFFD/g) || []).length
      const han = (text.match(/[\u4E00-\u9FFF]/g) || []).length
      const score = -repl * 10 + han
      if (!best || score > best.score) best = { encoding: enc, text, score }
      // 若为 UTF-8 且没有替换字符且包含逗号，直接认为可用
      if (enc === 'utf-8' && repl === 0 && text.includes(',')) {
        // 但仍会被上面的评分体系涵盖，这里不提前返回，保持择优
      }
    } catch (err) {
      // 某些浏览器可能不支持 big5/gb18030，忽略
    }
  }
  if (!best) throw new Error('无法读取文件，请确认文件未损坏')
  return best
}

function parseCSV(text) {
  // 简单 CSV 解析（逗号分隔，不处理转义与换行）
  const noBom = text.replace(/^\ufeff/, '')
  const lines = noBom.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const out = []
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
  const [abbr, name, tax_rate, opening_myr, opening_cny] = line.split(',')
    // 跳过表头：abbr,name, ...
    if (idx === 0 && String(abbr).toLowerCase() === 'abbr') continue
    if (!abbr && !name) continue
    out.push({
      abbr: abbr || '',
      name: name || '',
      tax_rate: toNumber(tax_rate),
      opening_myr: toNumber(opening_myr),
      opening_cny: toNumber(opening_cny)
    })
  }
  return out
}

function toNumber(v) {
  if (v === null || v === undefined) return 0
  const s = String(v)
    .replace(/[,%]/g, '')
    .replace(/[￥¥RMBrmb$]/gi, '')
    .replace(/MYR|CNY|RMB|USD/gi, '')
    .trim()
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

async function onImport(file) {
  try {
    const f = file.raw || file
    const { text, encoding } = await decodeCsvFile(f)
    const data = parseCSV(text)
    const inserted = await batchImport(data)
    await reload()
    ElMessage.success(`导入成功：${inserted} 条（编码：${encoding}）`)
  } catch (e) {
    let msg = e?.message || ''
    try { const j = JSON.parse(msg); msg = j.detail || j.error || msg } catch {}
    ElMessage.error('导入失败：' + (msg || ''))
  }
}

async function onImportCsv(file) {
  try {
    const f = file.raw || file
    const { text, encoding } = await decodeCsvFile(f)
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() })
    if (parsed.errors && parsed.errors.length) {
      console.warn('CSV parse errors:', parsed.errors)
    }
    const rows = (parsed.data || []).map(r => ({
      abbr: (r.abbr ?? r.ABBR ?? r.Abbr ?? '').toString().trim(),
      name: (r.name ?? r.NAME ?? r.Name ?? '').toString().trim(),
      tax_rate: toNumber(r.tax_rate ?? r.TAX_RATE ?? r.Tax_rate ?? 0),
      opening_myr: toNumber(r.opening_myr ?? r.opening_m ?? r.MYR ?? r.opening_MYR ?? 0),
      opening_cny: toNumber(r.opening_cny ?? r.opening_c ?? r.CNY ?? r.RMB ?? r.opening_CNY ?? 0)
    })).filter(r => r.name)
    const inserted = await batchImport(rows)
    await reload()
    ElMessage.success(`导入成功：${inserted} 条（编码：${encoding}）`)
  } catch (e) {
    let msg = e?.message || ''
    try { const j = JSON.parse(msg); msg = j.detail || j.error || msg } catch {}
    ElMessage.error('导入失败：' + (msg || ''))
  }
}

async function onFilePicked(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    if (importMode.value === 'auto') await onImportCsv(file)
    else await onImport(file)
  } finally {
    // 允许选择同一个文件时也能再次触发 change
    e.target.value = ''
  }
}

async function batchImport(allRows, chunkSize = 300) {
  let inserted = 0
  async function importChunk(chunk) {
    if (!chunk.length) return 0
    try {
      await api.customers.importRows(chunk)
      return chunk.length
    } catch (e) {
      // 当后端或网络超时时，自动降批量重试；最小批量 50 条
      if (chunk.length <= 50) throw e
      const mid = Math.floor(chunk.length / 2)
      const left = chunk.slice(0, mid)
      const right = chunk.slice(mid)
      let ok = 0
      ok += await importChunk(left)
      ok += await importChunk(right)
      return ok
    }
  }
  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize)
    inserted += await importChunk(chunk)
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
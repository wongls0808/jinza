<template>
  <div class="page container">
    <div class="head">
      <div class="title">{{ $t('customers.title') }}</div>
      <div class="spacer"></div>
      <!-- 移除了返回首页按钮 -->
    </div>

  <el-card class="jelly">
      <template #header>
        <div class="toolbar">
          <el-input v-model.trim="q" :placeholder="$t('customers.searchPlaceholder')" size="small" style="width:220px" @keyup.enter.native="reload" />
          <el-button size="small" @click="reload">{{ $t('common.search') }}</el-button>
          <div class="spacer"></div>
          <el-dropdown>
            <el-button size="small">{{ $t('common.import') }}</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="pickImport('auto')">{{ $t('customers.importAuto') }}</el-dropdown-item>
                <el-dropdown-item @click="pickImport('simple')">{{ $t('customers.importSimple') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <input ref="filePicker" type="file" accept=".csv" style="display:none" @change="onFilePicked" />
          <el-button size="small" @click="onExport">{{ $t('common.export') }}</el-button>
          <el-button size="small" @click="downloadTemplate">{{ $t('common.template') }}</el-button>
          <el-button type="primary" size="small" @click="openAdd">{{ $t('common.add') }}</el-button>
          <el-button type="danger" size="small" :disabled="!selection.length" @click="removeSelected">{{ $t('common.delete') }}</el-button>
        </div>
      </template>
      <el-table
        ref="tableRef"
        :data="rows"
        size="small"
        border
        style="width: 100%"
        @selection-change="(val)=> selection.value = val"
        @sort-change="onSort"
        @header-dragend="onColResize"
      >
        <el-table-column type="selection" column-key="__sel" :width="colW('__sel', 50)" />
        <el-table-column :label="$t('customers.fields.index')" type="index" column-key="__idx" :width="colW('__idx', 70)" />
        <el-table-column prop="abbr" :label="$t('customers.fields.abbr')" sortable="custom" :width="colW('abbr', 140)" />
        <el-table-column prop="name" :label="$t('customers.fields.name')" sortable="custom" :width="colW('name', 180)" />
        <el-table-column prop="tax_rate" :label="$t('customers.fields.taxRate')" sortable="custom" :width="colW('tax_rate', 100)">
          <template #default="{ row }">{{ formatPercent(row.tax_rate) }}</template>
        </el-table-column>
        <el-table-column prop="opening_myr" :label="$t('customers.fields.openingMYR')" sortable="custom" :width="colW('opening_myr', 160)">
          <template #default="{ row }">{{ formatMoney(row.opening_myr) }}</template>
        </el-table-column>
        <el-table-column prop="opening_cny" :label="$t('customers.fields.openingCNY')" sortable="custom" :width="colW('opening_cny', 160)">
          <template #default="{ row }">{{ formatMoney(row.opening_cny) }}</template>
        </el-table-column>
        <el-table-column prop="balance_myr" :label="$t('customers.fields.balanceMYR')" sortable="custom" :width="colW('balance_myr', 160)">
          <template #default="{ row }"><span class="pos" v-if="Number(row.balance_myr) >= 0">{{ formatMoney(row.balance_myr) }}</span><span class="neg" v-else>{{ formatMoney(row.balance_myr) }}</span></template>
        </el-table-column>
        <el-table-column prop="balance_cny" :label="$t('customers.fields.balanceCNY')" sortable="custom" :width="colW('balance_cny', 160)">
          <template #default="{ row }"><span class="pos" v-if="Number(row.balance_cny) >= 0">{{ formatMoney(row.balance_cny) }}</span><span class="neg" v-else>{{ formatMoney(row.balance_cny) }}</span></template>
        </el-table-column>
        <el-table-column prop="submitter" :label="$t('customers.fields.submitter')" :width="colW('submitter', 140)" />
        <el-table-column :label="$t('customers.fields.ops')" :width="colW('ops', 120)">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAccounts(row)">{{ $t('customers.viewAccounts') }}</el-button>
          </template>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="addDlg.visible" :title="$t('customers.addTitle')" width="560px">
      <el-form ref="addFormRef" :model="addDlg.form" :rules="addRules" label-width="90px" class="form">
        <el-form-item :label="$t('customers.form.abbr')">
          <el-input v-model.trim="addDlg.form.abbr" placeholder="例如：HZ" />
        </el-form-item>
        <el-form-item :label="$t('customers.form.name')" prop="name">
          <el-input v-model.trim="addDlg.form.name" placeholder="" />
        </el-form-item>
        <el-form-item :label="$t('customers.form.taxRate')" prop="tax_rate">
          <el-input-number v-model="addDlg.form.tax_rate" :precision="2" :min="0" :max="100" :step="1" controls-position="right" placeholder="0-100" style="width:100%" />
        </el-form-item>
        <div class="grid2">
          <el-form-item :label="$t('customers.form.openingMYR')">
            <el-input-number
              v-model="addDlg.form.opening_myr"
              :precision="2"
              :min="0"
              :step="100"
              controls-position="right"
              placeholder="0.00"
              :formatter="moneyFormatter"
              :parser="moneyParser"
              style="width:100%"
            />
          </el-form-item>
          <el-form-item :label="$t('customers.form.openingCNY')">
            <el-input-number
              v-model="addDlg.form.opening_cny"
              :precision="2"
              :min="0"
              :step="100"
              controls-position="right"
              placeholder="0.00"
              :formatter="moneyFormatter"
              :parser="moneyParser"
              style="width:100%"
            />
          </el-form-item>
        </div>
        <!-- 提交人由后端从 token 自动识别，这里不再手动填写 -->
      </el-form>
      <template #footer>
        <el-button @click="addDlg.visible=false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="addDlg.loading" @click="doAdd">{{ $t('common.ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- 客户收款账户抽屉 -->
  <el-drawer v-model="accDrawer.visible" size="60%" :title="(accDrawer.customer?.name || '') + ' · ' + $t('customers.accounts.title')">
      <div v-loading="accDrawer.loading">
        <div style="margin-bottom:12px; display:flex; gap:8px; align-items:center; flex-wrap: wrap;">
          <el-input v-model.trim="accDrawer.form.account_name" :placeholder="$t('customers.accounts.accountName')" style="width:200px" />
          <el-select v-model="accDrawer.form.bank_id" filterable clearable :placeholder="$t('customers.accounts.bank')" style="width:220px">
            <el-option v-for="b in accDrawer.banks" :key="b.id" :value="b.id" :label="b.zh + ' · ' + b.en">
              <div style="display:inline-flex; align-items:center; gap:8px;">
                <img :src="b.logo_url" style="height:16px" />
                <span style="font-weight:600;">{{ b.zh }}</span>
                <span style="color:var(--el-text-color-secondary); font-size:12px;">{{ b.en }}</span>
              </div>
            </el-option>
          </el-select>
          <el-input v-model.trim="accDrawer.form.bank_account" :placeholder="$t('customers.accounts.bankAccount')" style="width:220px" />
          <el-select v-model="accDrawer.form.currency_code" :placeholder="$t('customers.accounts.currency')" style="width:140px">
            <el-option v-for="c in accDrawer.currencies" :key="c.code" :label="c.code + ' · ' + c.name" :value="c.code" />
          </el-select>
          <el-button type="primary" @click="addCusAccount">{{ $t('common.add') }}</el-button>
        </div>
        <el-table :data="accDrawer.items" size="small" border style="width:100%" @header-dragend="onColResizeAcc">
          <el-table-column type="index" column-key="__idx" :label="$t('customers.fields.index')" :width="colWAcc('__idx', 60)" />
          <el-table-column prop="account_name" :label="$t('customers.accounts.accountName')" :width="colWAcc('account_name', 160)" />
          <el-table-column column-key="bank" :label="$t('customers.accounts.bank')" :width="colWAcc('bank', 260)">
            <template #default="{ row }">
              <div style="display:inline-flex; align-items:center; gap:8px;">
                <img :src="row.bank_logo" style="height:16px" />
                <span style="font-weight:600;">{{ row.bank_zh }}</span>
                <span style="color:var(--el-text-color-secondary); font-size:12px;">{{ row.bank_en }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="bank_account" :label="$t('customers.accounts.bankAccount')" :width="colWAcc('bank_account', 200)" />
          <el-table-column prop="currency_code" :label="$t('customers.accounts.currency')" :width="colWAcc('currency_code', 100)" />
          
          <el-table-column :label="$t('customers.fields.ops')" width="160">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditCus(row)">{{ $t('common.edit') }}</el-button>
              <el-popconfirm :title="$t('common.confirmDelete')" @confirm="removeCusAccount(row)">
                <template #reference><el-button link type="danger">{{ $t('common.delete') }}</el-button></template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
    <!-- 编辑客户账户 -->
  <el-dialog v-model="editAcc.visible" :title="$t('customers.accounts.editTitle')" width="560px">
      <el-form :model="editAcc.form" label-width="120px" size="small" class="form">
        <el-form-item label="账户名称"><el-input v-model.trim="editAcc.form.account_name" placeholder="账户名称" clearable /></el-form-item>
        <el-form-item label="银行">
          <el-select v-model="editAcc.form.bank_id" filterable clearable style="width:100%" placeholder="银行">
            <el-option v-for="b in accDrawer.banks" :key="b.id" :value="b.id" :label="b.zh + ' · ' + b.en" />
          </el-select>
        </el-form-item>
        <el-form-item label="银行账户"><el-input v-model.trim="editAcc.form.bank_account" placeholder="银行账户" clearable /></el-form-item>
        <el-form-item label="币种">
          <el-select v-model="editAcc.form.currency_code" clearable style="width:100%" placeholder="币种">
            <el-option v-for="c in accDrawer.currencies" :key="c.code" :label="c.code + ' · ' + c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        
      </el-form>
      <template #footer>
        <el-button @click="editAcc.visible=false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="editAcc.loading" @click="doEditCusAccount">{{ $t('customers.accounts.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useTableMemory } from '@/composables/useTableMemory'

const { colW, onColResize, reset: resetTableMem } = useTableMemory('customers')
// 客户抽屉里的账户表格使用单独的列宽记忆 key，避免与主列表互相影响
const { colW: colWAcc, onColResize: onColResizeAcc } = useTableMemory('customer-accounts')

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
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
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

// 排序
function onSort({ prop, order: ord }) {
  if (!prop) return
  sort.value = prop
  order.value = ord === 'ascending' ? 'asc' : 'desc'
  reload()
}

// 显示格式化
function formatMoney(v) {
  return Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatPercent(v) {
  return Number(v || 0).toFixed(2)
}

// InputNumber 千分位展示与两位小数解析
function moneyFormatter(value) {
  if (value === undefined || value === null || value === '') return ''
  const n = Number(value)
  if (isNaN(n)) return ''
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function moneyParser(value) {
  if (value === undefined || value === null) return 0
  const s = String(value).replace(/,/g, '')
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

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

// 客户绑定的收款账户 Drawer
const accDrawer = ref({
  visible: false,
  loading: false,
  customer: null,
  items: [],
  banks: [],
  currencies: [],
  form: { account_name: '', bank_id: null, bank_account: '', currency_code: 'CNY' }
})

async function openAccounts(cus) {
  accDrawer.value.visible = true
  accDrawer.value.customer = cus
  accDrawer.value.loading = true
  try {
    const [items, banks, currencies] = await Promise.all([
      api.customerAccounts.list(cus.id),
      api.banks.all(),
      api.currencies.list()
    ])
    accDrawer.value.items = items
    accDrawer.value.banks = banks
    accDrawer.value.currencies = currencies
    accDrawer.value.form = { account_name: '', bank_id: banks[0]?.id || null, bank_account: '', currency_code: currencies[0]?.code || 'CNY' }
  } finally {
    accDrawer.value.loading = false
  }
}

async function addCusAccount() {
  const c = accDrawer.value.customer
  const f = accDrawer.value.form
  if (!f.account_name || !f.bank_id || !f.bank_account || !f.currency_code) { ElMessage.warning('请完整填写'); return }
  try {
    await api.customerAccounts.create(c.id, f)
  } catch (e) {
    let msg = e?.message || ''
    try { const j = JSON.parse(msg); msg = j.error || msg } catch {}
    if (/已存在/.test(msg) || /exists/i.test(msg)) {
      ElMessage.error('该客户下该银行账户已存在')
      return
    }
    throw e
  }
  const items = await api.customerAccounts.list(c.id)
  accDrawer.value.items = items
  accDrawer.value.form = { account_name: '', bank_id: accDrawer.value.banks[0]?.id || null, bank_account: '', currency_code: accDrawer.value.currencies[0]?.code || 'CNY' }
  ElMessage.success('已添加')
}

async function removeCusAccount(row) {
  const c = accDrawer.value.customer
  await api.customerAccounts.remove(c.id, row.id)
  accDrawer.value.items = await api.customerAccounts.list(c.id)
  ElMessage.success('已删除')
}

// 编辑客户账户
const editAcc = ref({ visible: false, loading: false, id: null, form: { account_name: '', bank_id: null, bank_account: '', currency_code: 'CNY' } })

function openEditCus(row) {
  editAcc.value.visible = true
  editAcc.value.id = row.id
  editAcc.value.form = { account_name: row.account_name, bank_id: row.bank_id, bank_account: row.bank_account, currency_code: row.currency_code }
}

async function doEditCusAccount() {
  const c = accDrawer.value.customer
  const id = editAcc.value.id
  const f = editAcc.value.form
  if (!f.account_name || !f.bank_id || !f.bank_account || !f.currency_code) { ElMessage.warning('请完整填写'); return }
  editAcc.value.loading = true
  try {
    await api.customerAccounts.update(c.id, id, f)
    editAcc.value.visible = false
    accDrawer.value.items = await api.customerAccounts.list(c.id)
    ElMessage.success('已保存')
  } catch (e) {
    let msg = e?.message || ''
    try { const j = JSON.parse(msg); msg = j.error || msg } catch {}
    if (/已存在/.test(msg) || /exists/i.test(msg)) {
      ElMessage.error('该客户下该银行账户已存在')
    } else {
      ElMessage.error('保存失败：' + msg)
    }
  } finally {
    editAcc.value.loading = false
  }
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
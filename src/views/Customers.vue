<template>
  <div class="page container">
    <div class="head">
      <div>
        <div class="title">客户管理</div>
        <div class="sub">支持添加/删除/导入/导出；字段：勾选、序号、简称、客户名、税率、马币金额(期初)、人民币金额(期初)、提交人</div>
      </div>
      <div class="ops">
        <el-button type="primary" @click="openAdd">添加</el-button>
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
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" type="index" width="70" />
        <el-table-column prop="abbr" label="简称" width="140" />
        <el-table-column prop="name" label="客户名" min-width="180" />
        <el-table-column prop="tax_rate" label="税率(%)" width="100" />
        <el-table-column prop="opening_myr" label="马币金额(期初)" width="160" />
        <el-table-column prop="opening_cny" label="人民币金额(期初)" width="160" />
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

const tableRef = ref()
const rows = ref([])
let selection = ref([])
const addDlg = ref({ visible: false, loading: false, form: { abbr: '', name: '', tax_rate: 0, opening_myr: 0, opening_cny: 0, submitter: '' } })

const KEY = 'customers_rows_v1'
function load() {
  try { rows.value = JSON.parse(localStorage.getItem(KEY) || '[]') } catch { rows.value = [] }
}
function save() { localStorage.setItem(KEY, JSON.stringify(rows.value)) }

function openAdd() {
  addDlg.value = { visible: true, loading: false, form: { abbr: '', name: '', tax_rate: 0, opening_myr: 0, opening_cny: 0, submitter: '' } }
}
function doAdd() {
  addDlg.value.loading = true
  try {
    const f = addDlg.value.form
    if (!f.abbr || !f.name) return ElMessage.warning('请填写简称与客户名')
    rows.value.push({ ...f })
    save()
    addDlg.value.visible = false
    ElMessage.success('已添加')
  } finally {
    addDlg.value.loading = false
  }
}

function removeSelected() {
  if (!selection.value.length) return
  rows.value = rows.value.filter(r => !selection.value.includes(r))
  save()
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
    rows.value = rows.value.concat(data)
    save()
    ElMessage.success(`导入成功：${data.length} 条`)
  } catch (e) {
    ElMessage.error('导入失败')
  }
}

function onExport() {
  const lines = rows.value.map(r => [r.abbr, r.name, r.tax_rate, r.opening_myr, r.opening_cny, r.submitter].join(','))
  const text = lines.join('\n')
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'customers.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(load)
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
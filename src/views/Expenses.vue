<template>
  <div class="expenses container">
    <div class="hero">
      <div class="welcome">{{ $t('expenses.title') }}</div>
      <div class="meta">{{ $t('expenses.subtitle') }}</div>
    </div>

    <el-card shadow="never" class="card--plain">
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">
        <el-input v-model="q" :placeholder="$t('expenses.searchPlaceholder')" style="width:260px" clearable @clear="loadList" @keyup.enter.native="loadList" />
        <el-select v-model="cate" :placeholder="$t('expenses.category')" clearable style="width:200px">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="drcr" :placeholder="$t('expenses.direction')" clearable style="width:140px">
          <el-option :label="$t('common.debit')" value="debit" />
          <el-option :label="$t('common.credit')" value="credit" />
        </el-select>
        <el-button type="primary" @click="loadList">{{ $t('expenses.query') }}</el-button>
        <el-button type="success" @click="openAdd">{{ $t('expenses.add') }}</el-button>
      </div>
      <el-table :data="rows" border size="small">
        <el-table-column type="index" :label="$t('common.no')" width="60" />
        <el-table-column prop="description" :label="$t('expenses.description')" show-overflow-tooltip />
        <el-table-column prop="category" :label="$t('expenses.category')" width="160" />
        <el-table-column prop="drcr" :label="$t('expenses.direction')" width="100">
          <template #default="{ row }">{{ row.drcr === 'credit' ? $t('common.credit') : (row.drcr === 'debit' ? $t('common.debit') : '-') }}</template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('expenses.createdAt')" width="180">
          <template #default="{ row }">{{ (row.created_at||'').toString().slice(0,19).replace('T',' ') }}</template>
        </el-table-column>
        <el-table-column :label="$t('expenses.actions')" width="140" align="center">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="edit(row)">{{ $t('expenses.edit') }}</el-button>
            <el-popconfirm :title="$t('expenses.confirmDelete')" @confirm="del(row)">
              <template #reference>
                <el-button text size="small" type="danger">{{ $t('expenses.delete') }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

  <!-- 借贷报表 / Debit-Credit Report -->
    <el-card shadow="never" class="card--plain" style="margin-top:12px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-weight:600;">{{ $t('expenses.reportTitle') }}</span>
        <el-date-picker v-model="reportRange" type="daterange" range-separator="-" :start-placeholder="$t('expenses.startDate')" :end-placeholder="$t('expenses.endDate')" value-format="YYYY-MM-DD" style="width:260px" />
        <el-select v-model="reportDrcr" :placeholder="$t('expenses.direction')" clearable style="width:140px">
          <el-option :label="$t('common.debit')" value="debit" />
          <el-option :label="$t('common.credit')" value="credit" />
        </el-select>
        <el-button @click="loadReport">{{ $t('expenses.refresh') }}</el-button>
      </div>
      <div style="display:flex; gap:24px; flex-wrap:wrap; margin-bottom:8px;">
        <div>{{ $t('expenses.summary.debitTotal') }}：<b class="negative">{{ money(report.summary.debit_total) }}</b></div>
        <div>{{ $t('expenses.summary.creditTotal') }}：<b class="positive">{{ money(report.summary.credit_total) }}</b></div>
        <div>{{ $t('expenses.summary.net') }}：<b>{{ money(report.summary.net) }}</b></div>
        <div>{{ $t('expenses.summary.count') }}：<b>{{ report.summary.txn_count }}</b></div>
      </div>
      <el-table :data="report.items" border size="small">
        <el-table-column type="index" :label="$t('common.no')" width="60" />
        <el-table-column prop="description" :label="$t('expenses.description')" />
        <el-table-column prop="category" :label="$t('expenses.category')" width="180" />
        <el-table-column prop="drcr" :label="$t('expenses.direction')" width="100">
          <template #default="{ row }">{{ row.drcr === 'credit' ? $t('common.credit') : (row.drcr === 'debit' ? $t('common.debit') : '-') }}</template>
        </el-table-column>
        <el-table-column prop="count" :label="$t('expenses.columns.count')" width="100" />
        <el-table-column prop="debit_total" :label="$t('expenses.columns.debit')" width="140" align="right">
          <template #default="{ row }">{{ money(row.debit_total) }}</template>
        </el-table-column>
        <el-table-column prop="credit_total" :label="$t('expenses.columns.credit')" width="140" align="right">
          <template #default="{ row }">{{ money(row.credit_total) }}</template>
        </el-table-column>
        <el-table-column prop="net" :label="$t('expenses.columns.net')" width="140" align="right">
          <template #default="{ row }">{{ money(row.net) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 抽屉 -->
    <el-drawer v-model="drawer" :title="isEdit? $t('expenses.drawer.titleEdit') : $t('expenses.drawer.titleAdd')" size="420px">
      <el-form label-width="90px">
        <el-form-item :label="$t('expenses.drawer.fields.description')"><el-input v-model="form.desc" :placeholder="$t('expenses.drawer.fields.description')" /></el-form-item>
        <el-form-item :label="$t('expenses.drawer.fields.category')"><el-select v-model="form.category" style="width:100%">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select></el-form-item>
        <el-form-item :label="$t('expenses.drawer.fields.direction')">
          <el-segmented v-model="form.drcr" :options="[{label:$t('common.debit'),value:'debit'},{label:$t('common.credit'),value:'credit'}]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawer=false">{{ $t('expenses.drawer.cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ $t('expenses.drawer.save') }}</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const { t } = useI18n()

const rows = ref([])
const q = ref('')
const cate = ref('')
const drcr = ref('')
const range = ref([]) // 业务弱化日期筛选，但保留内部变量兼容 loadList
// 使用 i18n 分类标签，值保持中文以兼容后端分类存储
const categories = [
  t('expensesCategories.office'),
  t('expensesCategories.travel'),
  t('expensesCategories.telecom'),
  t('expensesCategories.rent'),
  t('expensesCategories.transport'),
  t('expensesCategories.service'),
  t('expensesCategories.ad'),
  t('expensesCategories.consult'),
  t('expensesCategories.maintain'),
  t('expensesCategories.hospitality'),
  t('expensesCategories.utilities'),
  t('expensesCategories.other'),
]

const drawer = ref(false)
const isEdit = ref(false)
const form = ref({ id:null, category:'', desc:'', drcr: '' })

function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

// 费用金额与借贷将通过银行流水匹配，不在此处录入科目与金额

async function loadList(){
  const params = { q: q.value||'', category: cate.value||'', drcr: drcr.value||'' }
  const res = await api.expenses.list(params)
  rows.value = res.items || []
}

function openAdd(){ isEdit.value=false; form.value = { id:null, category:'', desc:'', drcr:'' }; drawer.value=true }
function edit(row){ isEdit.value=true; form.value = { id:row.id, category: row.category || '', desc: row.description || row.desc || '', drcr: row.drcr || '' }; drawer.value=true }

async function save(){
  try {
    const payload = { category: form.value.category || null, desc: (form.value.desc||'').trim() || null, drcr: form.value.drcr || null }
  if (!payload.desc) { ElMessage.warning(t('expenses.messages.fillDescription')); return }
    if (isEdit.value) await api.expenses.update(form.value.id, payload)
    else await api.expenses.create(payload)
  ElMessage.success(t('expenses.messages.saved'))
    drawer.value=false
    await loadList()
  } catch(e){ ElMessage.error(e?.message||t('expenses.messages.saveFailed')) }
}

// 报表
const reportRange = ref([])
const reportDrcr = ref('')
const report = ref({ summary: { debit_total:0, credit_total:0, net:0, txn_count:0 }, items: [] })
async function loadReport(){
  const params = { }
  if (reportRange.value?.[0]) params.startDate = reportRange.value[0]
  if (reportRange.value?.[1]) params.endDate = reportRange.value[1]
  if (reportDrcr.value) params.drcr = reportDrcr.value
  try {
    const res = await api.expenses.report(params)
    report.value = res || { summary:{ debit_total:0, credit_total:0, net:0, txn_count:0 }, items:[] }
  } catch(e) { report.value = { summary:{ debit_total:0, credit_total:0, net:0, txn_count:0 }, items:[] } }
}
loadReport()

async function del(row){
  try { await api.expenses.remove(row.id); ElMessage.success(t('expenses.messages.deleted')); await loadList() } catch(e){ ElMessage.error(e?.message||t('expenses.messages.deleteFailed')) }
}

loadList()
</script>

<style scoped>
.container { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.card--plain { background: transparent; border: none; box-shadow: none; }
</style>

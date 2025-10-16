<template>
  <div class="expenses container">
    <div class="hero">
      <div class="welcome">费用管理</div>
      <div class="meta">常规运营收支分录 · 自动借贷科目</div>
    </div>

    <el-card shadow="never" class="card--plain">
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">
        <el-input v-model="q" placeholder="搜索 描述/分类/科目" style="width:240px" clearable @clear="loadList" @keyup.enter.native="loadList" />
        <el-date-picker v-model="range" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:260px" />
        <el-select v-model="cate" placeholder="分类" clearable style="width:160px">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button type="success" @click="openAdd">新增</el-button>
      </div>
      <el-table :data="rows" border size="small">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="biz_date" label="日期" width="120" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="category" label="分类" width="140" />
        <el-table-column prop="subject_debit" label="借方科目" width="160" />
        <el-table-column prop="subject_credit" label="贷方科目" width="160" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">{{ money(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="currency" label="币种" width="90" />
        <el-table-column prop="desc" label="描述" />
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="edit(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="del(row)">
              <template #reference>
                <el-button text size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 抽屉 -->
    <el-drawer v-model="drawer" :title="isEdit? '编辑' : '新增'" size="520px">
      <el-form label-width="100px">
        <el-form-item label="日期"><el-date-picker v-model="form.biz_date" type="date" value-format="YYYY-MM-DD" style="width: 200px" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type" style="width:200px">
          <el-option label="支出" value="expense" />
          <el-option label="收入" value="income" />
        </el-select></el-form-item>
        <el-form-item label="分类"><el-select v-model="form.category" style="width:260px" @change="applySubjects">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select></el-form-item>
        <el-form-item label="金额"><el-input-number v-model="form.amount" :precision="2" :min="0" :step="100" style="width: 200px" /></el-form-item>
        <el-form-item label="币种"><el-select v-model="form.currency" style="width: 120px">
          <el-option label="MYR" value="MYR" />
          <el-option label="CNY" value="CNY" />
          <el-option label="USD" value="USD" />
        </el-select></el-form-item>
        <el-form-item label="借方科目"><el-input v-model="form.subject_debit" /></el-form-item>
        <el-form-item label="贷方科目"><el-input v-model="form.subject_credit" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.desc" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawer=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const rows = ref([])
const q = ref('')
const cate = ref('')
const range = ref([])
const categories = ['办公费','差旅费','通讯费','租赁费','运输费','服务费','广告费','咨询费','维修费','招待费','水电费','其他']

const drawer = ref(false)
const isEdit = ref(false)
const form = ref({ id:null, biz_date:'', type:'expense', category:'', amount:0, currency:'MYR', subject_debit:'', subject_credit:'', desc:'' })

function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

function applySubjects(){
  const map = {
    '办公费': ['管理费用-办公费','银行存款'],
    '差旅费': ['管理费用-差旅费','银行存款'],
    '通讯费': ['管理费用-通讯费','银行存款'],
    '租赁费': ['管理费用-租赁费','银行存款'],
    '运输费': ['销售费用-运输费','银行存款'],
    '服务费': ['管理费用-服务费','银行存款'],
    '广告费': ['销售费用-广告费','银行存款'],
    '咨询费': ['管理费用-咨询费','银行存款'],
    '维修费': ['管理费用-维修费','银行存款'],
    '招待费': ['管理费用-业务招待费','银行存款'],
    '水电费': ['管理费用-水电费','银行存款'],
    '其他':   ['管理费用-其他','银行存款']
  }
  const arr = map[form.value.category]
  if (arr) {
    if (form.value.type === 'expense') {
      form.value.subject_debit = arr[0]
      form.value.subject_credit = arr[1]
    } else {
      // 收入方向：借贷对调
      form.value.subject_debit = arr[1]
      form.value.subject_credit = arr[0]
    }
  }
}

async function loadList(){
  const params = { q: q.value||'', category: cate.value||'', startDate: range.value?.[0]||'', endDate: range.value?.[1]||'' }
  const res = await api.expenses.list(params)
  rows.value = res.items || []
}

function openAdd(){ isEdit.value=false; form.value = { id:null, biz_date:new Date().toISOString().slice(0,10), type:'expense', category:'', amount:0, currency:'MYR', subject_debit:'', subject_credit:'', desc:'' }; drawer.value=true }
function edit(row){ isEdit.value=true; form.value = { ...row }; drawer.value=true }

async function save(){
  try {
    if (isEdit.value) await api.expenses.update(form.value.id, form.value)
    else await api.expenses.create(form.value)
    ElMessage.success('已保存')
    drawer.value=false
    await loadList()
  } catch(e){ ElMessage.error(e?.message||'保存失败') }
}

async function del(row){
  try { await api.expenses.remove(row.id); ElMessage.success('已删除'); await loadList() } catch(e){ ElMessage.error(e?.message||'删除失败') }
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

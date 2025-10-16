<template>
  <div class="expenses container">
    <div class="hero">
      <div class="welcome">费用管理</div>
      <div class="meta">常规运营收支分录 · 自动借贷科目</div>
    </div>

    <el-card shadow="never" class="card--plain">
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">
        <el-input v-model="q" placeholder="搜索 项目名/分类" style="width:260px" clearable @clear="loadList" @keyup.enter.native="loadList" />
        <el-select v-model="cate" placeholder="分类" clearable style="width:200px">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button type="success" @click="openAdd">新增</el-button>
      </div>
      <el-table :data="rows" border size="small">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="description" label="项目名" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="160" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ (row.created_at||'').toString().slice(0,19).replace('T',' ') }}</template>
        </el-table-column>
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
    <el-drawer v-model="drawer" :title="isEdit? '编辑费用项目' : '新增费用项目'" size="420px">
      <el-form label-width="90px">
        <el-form-item label="项目名"><el-input v-model="form.desc" placeholder="请输入项目名称" /></el-form-item>
        <el-form-item label="分类"><el-select v-model="form.category" style="width:100%">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select></el-form-item>
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
const range = ref([]) // 业务弱化日期筛选，但保留内部变量兼容 loadList
const categories = ['办公费','差旅费','通讯费','租赁费','运输费','服务费','广告费','咨询费','维修费','招待费','水电费','其他']

const drawer = ref(false)
const isEdit = ref(false)
const form = ref({ id:null, category:'', desc:'' })

function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

// 费用金额与借贷将通过银行流水匹配，不在此处录入科目与金额

async function loadList(){
  const params = { q: q.value||'', category: cate.value||'' }
  const res = await api.expenses.list(params)
  rows.value = res.items || []
}

function openAdd(){ isEdit.value=false; form.value = { id:null, category:'', desc:'' }; drawer.value=true }
function edit(row){ isEdit.value=true; form.value = { id:row.id, category: row.category || '', desc: row.description || row.desc || '' }; drawer.value=true }

async function save(){
  try {
    const payload = { category: form.value.category || null, desc: (form.value.desc||'').trim() || null }
    if (!payload.desc) { ElMessage.warning('请填写项目名'); return }
    if (isEdit.value) await api.expenses.update(form.value.id, payload)
    else await api.expenses.create(payload)
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

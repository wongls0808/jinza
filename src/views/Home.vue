<template>
  <div class="home container">
    <div class="hero">
      <div class="welcome">{{ t('home.welcome') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>
    <!-- 菜单卡片区域已移除 -->
    <div class="todo" style="margin-top:16px;">
      <el-card>
        <div class="todo-title">待办事项</div>
        <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center;">
          <el-select v-model="batch.platform_id" placeholder="选择平台商" size="small" style="width:220px" filterable>
            <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name + (p.fee_percent? `（手续费 ${p.fee_percent}%）` : '')" />
          </el-select>
          <el-button :disabled="!has('manage_fx') || !batch.platform_id || !multipleSelection.length" type="success" size="small" @click="doBatchApprove">批量审核（按平台手续费）</el-button>
          <span v-if="batch.platform_id" style="color: var(--el-text-color-secondary); font-size:12px;">将按所选平台的手续费比例扣减。</span>
        </div>
        <el-table :data="todos" size="small" border @selection-change="(rows)=> multipleSelection = rows">
          <el-table-column type="selection" width="46" />
          <el-table-column label="#" width="60">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="pay_date" label="付款日期" width="120">
            <template #default="{ row }">{{ fmtDate(row.pay_date) }}</template>
          </el-table-column>
          <el-table-column prop="bill_no" label="单号" width="200" />
          <el-table-column prop="customer_name" label="客户" />
          <el-table-column prop="total_amount" label="金额" width="140" align="right">
            <template #default="{ row }">{{ money(row.total_amount) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="320" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openTodo(row)">查看</el-button>
              <el-button v-if="has('manage_fx') && row.status==='pending'" size="small" type="success" @click="openApprove(row)">审核</el-button>
              <el-button v-if="has('manage_fx') && row.status==='completed'" size="small" type="warning" @click="doUnapprove(row)">撤销</el-button>
              <el-button size="small" @click="openAudits(row)">日志</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    <el-drawer v-model="todoDrawer" title="付款单待审" size="60%">
      <div v-if="todoDetail">
        <div class="todo-head">
          <div>单号：{{ todoDetail.bill_no || ('Payment-' + todoDetail.id) }}</div>
          <div>客户：{{ todoDetail.customer_name }}</div>
          <div>日期：{{ fmtDate(todoDetail.pay_date) }}</div>
        </div>
        <el-table :data="todoDetail.items || []" border size="small" height="50vh">
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="account_name" label="账户名称" />
          <el-table-column prop="bank_account" label="银行账户" />
          <el-table-column prop="currency_code" label="币种" width="120" />
          <el-table-column prop="amount" label="金额" width="140" align="right">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 审核弹窗：选择平台（手续费按平台配置） -->
    <el-dialog v-model="approveDialog.visible" title="审核付款单" width="420px">
      <el-form label-width="100px">
        <el-form-item label="平台商">
          <el-select v-model="approveDialog.platform_id" filterable placeholder="选择平台商" style="width: 260px">
            <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
          </el-select>
        </el-form-item>
        <el-alert v-if="approveDialog.platform_id" type="info" :closable="false" show-icon>
          将按平台商配置的手续费比例进行扣减。
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="approveDialog.visible=false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="approveDialog.loading" @click="confirmApprove">{{ t('common.ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- 审核日志抽屉 -->
    <el-drawer v-model="auditDrawer.visible" title="审核日志" size="40%">
      <el-table :data="auditRows" size="small" border>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="acted_at" label="时间" width="170" />
        <el-table-column prop="action" label="动作" width="110" />
        <el-table-column prop="platform_name" label="平台" width="160" />
        <el-table-column label="手续费" width="120" align="right">
          <template #default="{ row }">{{ money(row.fee_amount) }} ({{ row.fee_percent }}%)</template>
        </el-table-column>
        <el-table-column label="扣减明细">
          <template #default="{ row }">
            <div v-if="row.deltas">
              <div v-for="(v, k) in row.deltas" :key="k">{{ k }}：金额 {{ money(v.amount) }}，手续费 {{ money(v.fee) }}，合计 {{ money(v.total) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="acted_by_name" label="操作人" width="140" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted } from 'vue'
import { api } from '@/api'
// 菜单卡片已移除，无需引入图标
const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()

const todos = ref([])
const platforms = ref([])
const todoDrawer = ref(false)
const todoDetail = ref(null)
function fmtDate(v){ try { if (!v) return ''; if (typeof v === 'string') return v.slice(0,10); if (v.toISOString) return v.toISOString().slice(0,10); return String(v).slice(0,10) } catch { return String(v).slice(0,10) } }
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
async function loadTodos(){
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 10 })
    const items = Array.isArray(res) ? res : (res.items || [])
    todos.value = items
  } catch {}
}
onMounted(() => { loadTodos(); loadPlatforms() })

async function openTodo(row){
  const d = await api.fx.payments.detail(row.id)
  todoDetail.value = d
  todoDrawer.value = true
}
async function approve(row){
  await api.fx.payments.approve(row.id)
  todoDrawer.value = false
  todoDetail.value = null
  await loadTodos()
}

async function loadPlatforms(){ const res = await api.buyfx.listPlatforms(); platforms.value = res.items || [] }

const approveDialog = ref({ visible: false, loading: false, id: null, platform_id: null })
function openApprove(row){ approveDialog.value = { visible: true, loading: false, id: row.id, platform_id: null } }
async function confirmApprove(){
  const { id, platform_id } = approveDialog.value
  if (!platform_id) return
  approveDialog.value.loading = true
  try {
    await api.fx.payments.approve(id, { platform_id })
    approveDialog.value.visible = false
    todoDrawer.value = false
    todoDetail.value = null
    await loadTodos()
  } finally { approveDialog.value.loading = false }
}

async function doUnapprove(row){
  await api.fx.payments.unapprove(row.id)
  await loadTodos()
}

const auditDrawer = ref({ visible: false })
const auditRows = ref([])
async function openAudits(row){
  auditDrawer.value.visible = true
  const list = await api.fx.payments.audits(row.id)
  auditRows.value = (list.items || []).map(it => ({ ...it, deltas: typeof it.deltas === 'string' ? JSON.parse(it.deltas) : it.deltas }))
}

// 批量审批
let multipleSelection = []
const batch = ref({ platform_id: null })
async function doBatchApprove(){
  if (!batch.value.platform_id || !multipleSelection.length) return
  const ids = multipleSelection.map(r => r.id)
  await api.fx.payments.batchApprove(ids, batch.value.platform_id)
  multipleSelection = []
  batch.value.platform_id = null
  await loadTodos()
}
</script>

<style scoped>
.home { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
/* 菜单卡片样式已移除 */
.todo-title { font-weight: 700; margin-bottom: 8px; }
.todo-head { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; }
.todo-head > div { color: var(--el-text-color-primary); font-weight: 600; }
</style>

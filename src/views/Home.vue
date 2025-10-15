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
        <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center; flex-wrap: wrap;">
          <el-select v-model="batch.platform_id" placeholder="选择平台商" size="small" style="width:240px" filterable>
            <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name + (p.fee_percent!=null? `（手续费 ${Number(p.fee_percent||0).toFixed(4)}%）` : '')" />
          </el-select>
          <el-button :disabled="!has('manage_fx') || !batch.platform_id || !multipleSelection.value.length || !canBatchApprove" type="success" size="small" @click="doBatchApprove">批量审核（按平台手续费）</el-button>
          <span v-if="batch.platform_id" style="color: var(--el-text-color-secondary); font-size:12px;">将按所选平台的手续费比例扣减。</span>
        </div>
        <!-- 余额预览 -->
        <div v-if="batch.platform_id" class="preview-card">
          <div class="row">
            <div class="cell head">平台手续费</div>
            <div class="cell">{{ Number(selectedPlatform?.fee_percent||0).toFixed(4) }}%</div>
          </div>
          <div class="row">
            <div class="cell head">币种</div>
            <div class="cell">USD</div>
            <div class="cell">MYR</div>
            <div class="cell">CNY</div>
          </div>
          <div class="row">
            <div class="cell head">可用余额</div>
            <div class="cell mono">{{ money(Number(selectedPlatform?.balance_usd||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatform?.balance_myr||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatform?.balance_cny||0)) }}</div>
          </div>
          <div class="row">
            <div class="cell head">已选应扣(含手续费)</div>
            <div class="cell mono warn" :class="{ danger: need.USD>0 && after.USD<0 }">{{ money(need.USD) }}</div>
            <div class="cell mono warn" :class="{ danger: need.MYR>0 && after.MYR<0 }">{{ money(need.MYR) }}</div>
            <div class="cell mono warn" :class="{ danger: need.CNY>0 && after.CNY<0 }">{{ money(need.CNY) }}</div>
          </div>
          <div class="row">
            <div class="cell head">扣减后余额</div>
            <div class="cell mono" :class="{ danger: after.USD<0 }">{{ money(after.USD) }}</div>
            <div class="cell mono" :class="{ danger: after.MYR<0 }">{{ money(after.MYR) }}</div>
            <div class="cell mono" :class="{ danger: after.CNY<0 }">{{ money(after.CNY) }}</div>
          </div>
        </div>

        <el-table :data="todos" size="small" border @selection-change="onSelectionChange">
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
    <el-dialog v-model="approveDialog.visible" title="审核付款单" width="520px">
      <el-form label-width="100px">
        <el-form-item label="平台商">
          <el-select v-model="approveDialog.platform_id" filterable placeholder="选择平台商" style="width: 260px">
            <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
          </el-select>
        </el-form-item>
        <el-alert v-if="approveDialog.platform_id" type="info" :closable="false" show-icon>
          将按平台商配置的手续费比例进行扣减。
        </el-alert>
        <!-- 单笔审核余额预览 -->
        <div v-if="approveDialog.platform_id" class="preview-card" style="margin-top:8px;">
          <div class="row">
            <div class="cell head">平台手续费</div>
            <div class="cell">{{ Number(selectedPlatformSingle?.fee_percent||0).toFixed(4) }}%</div>
          </div>
          <div class="row">
            <div class="cell head">币种</div>
            <div class="cell">USD</div>
            <div class="cell">MYR</div>
            <div class="cell">CNY</div>
          </div>
          <div class="row">
            <div class="cell head">可用余额</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle?.balance_usd||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle?.balance_myr||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle?.balance_cny||0)) }}</div>
          </div>
          <div class="row">
            <div class="cell head">本单应扣(含手续费)</div>
            <div class="cell mono warn" :class="{ danger: needSingle.USD>0 && afterSingle.USD<0 }">{{ money(needSingle.USD) }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.MYR>0 && afterSingle.MYR<0 }">{{ money(needSingle.MYR) }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.CNY>0 && afterSingle.CNY<0 }">{{ money(needSingle.CNY) }}</div>
          </div>
          <div class="row">
            <div class="cell head">扣减后余额</div>
            <div class="cell mono" :class="{ danger: afterSingle.USD<0 }">{{ money(afterSingle.USD) }}</div>
            <div class="cell mono" :class="{ danger: afterSingle.MYR<0 }">{{ money(afterSingle.MYR) }}</div>
            <div class="cell mono" :class="{ danger: afterSingle.CNY<0 }">{{ money(afterSingle.CNY) }}</div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="approveDialog.visible=false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!canApproveSingle" :loading="approveDialog.loading" @click="confirmApprove">{{ t('common.ok') }}</el-button>
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
const currentPaymentTotals = ref({ USD:0, MYR:0, CNY:0 })
async function openApprove(row){
  approveDialog.value = { visible: true, loading: false, id: row.id, platform_id: null }
  // 拉取明细合计
  try {
    const d = await api.fx.payments.detail(row.id)
    const totals = { USD:0, MYR:0, CNY:0 }
    for (const it of (d.items||[])) {
      const cur = String(it.currency_code||'').toUpperCase()
      const amt = Math.round(Number(it.amount||0) * 100) / 100
      if (cur==='USD' || cur==='MYR' || cur==='CNY') totals[cur] = Math.round((totals[cur] + amt) * 100) / 100
    }
    currentPaymentTotals.value = totals
  } catch { currentPaymentTotals.value = { USD:0, MYR:0, CNY:0 } }
}
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

// 单笔审核余额预览计算
const selectedPlatformSingle = computed(() => platforms.value.find(p => p.id === approveDialog.value.platform_id) || null)
const feePctSingle = computed(() => Number(selectedPlatformSingle.value?.fee_percent || 0))
const needSingle = computed(() => ({
  USD: Math.round((currentPaymentTotals.value.USD + Math.round((currentPaymentTotals.value.USD * feePctSingle.value / 100) * 100) / 100) * 100) / 100,
  MYR: Math.round((currentPaymentTotals.value.MYR + Math.round((currentPaymentTotals.value.MYR * feePctSingle.value / 100) * 100) / 100) * 100) / 100,
  CNY: Math.round((currentPaymentTotals.value.CNY + Math.round((currentPaymentTotals.value.CNY * feePctSingle.value / 100) * 100) / 100) * 100) / 100,
}))
const afterSingle = computed(() => ({
  USD: Math.round(((Number(selectedPlatformSingle.value?.balance_usd||0)) - needSingle.value.USD) * 100) / 100,
  MYR: Math.round(((Number(selectedPlatformSingle.value?.balance_myr||0)) - needSingle.value.MYR) * 100) / 100,
  CNY: Math.round(((Number(selectedPlatformSingle.value?.balance_cny||0)) - needSingle.value.CNY) * 100) / 100,
}))
const canApproveSingle = computed(() => {
  if (!approveDialog.value.platform_id) return false
  const anyNeed = (needSingle.value.USD>0 || needSingle.value.MYR>0 || needSingle.value.CNY>0)
  if (!anyNeed) return false
  return afterSingle.value.USD >= 0 && afterSingle.value.MYR >= 0 && afterSingle.value.CNY >= 0
})

// 批量审批 + 余额预览
const multipleSelection = ref([])
const batch = ref({ platform_id: null })
const selectedPlatform = computed(() => platforms.value.find(p => p.id === batch.value.platform_id) || null)

// 选择项 -> 每笔的币种合计缓存
const paymentTotalsById = ref({}) // { [id]: { USD: number, MYR: number, CNY: number } }
async function fetchPaymentTotals(id){
  // 已缓存则跳过
  if (paymentTotalsById.value[id]) return
  try {
    const d = await api.fx.payments.detail(id)
    const totals = { USD:0, MYR:0, CNY:0 }
    for (const it of (d.items||[])) {
      const cur = String(it.currency_code||'').toUpperCase()
      const amt = Math.round(Number(it.amount||0) * 100) / 100
      if (cur==='USD' || cur==='MYR' || cur==='CNY') totals[cur] = Math.round((totals[cur] + amt) * 100) / 100
    }
    paymentTotalsById.value[id] = totals
  } catch {}
}
async function onSelectionChange(rows){
  multipleSelection.value = rows
  // 拉取明细，计算合计
  await Promise.all(rows.map(r => fetchPaymentTotals(r.id)))
}
const selectionTotals = computed(() => {
  const totals = { USD:0, MYR:0, CNY:0 }
  for (const r of multipleSelection.value) {
    const t = paymentTotalsById.value[r.id]
    if (!t) continue
    totals.USD = Math.round((totals.USD + (t.USD||0)) * 100) / 100
    totals.MYR = Math.round((totals.MYR + (t.MYR||0)) * 100) / 100
    totals.CNY = Math.round((totals.CNY + (t.CNY||0)) * 100) / 100
  }
  return totals
})
const feePct4 = computed(() => Number(selectedPlatform.value?.fee_percent || 0))
const need = computed(() => ({
  USD: Math.round((selectionTotals.value.USD + Math.round((selectionTotals.value.USD * feePct4.value / 100) * 100) / 100) * 100) / 100,
  MYR: Math.round((selectionTotals.value.MYR + Math.round((selectionTotals.value.MYR * feePct4.value / 100) * 100) / 100) * 100) / 100,
  CNY: Math.round((selectionTotals.value.CNY + Math.round((selectionTotals.value.CNY * feePct4.value / 100) * 100) / 100) * 100) / 100,
}))
const after = computed(() => ({
  USD: Math.round(((Number(selectedPlatform.value?.balance_usd||0)) - need.value.USD) * 100) / 100,
  MYR: Math.round(((Number(selectedPlatform.value?.balance_myr||0)) - need.value.MYR) * 100) / 100,
  CNY: Math.round(((Number(selectedPlatform.value?.balance_cny||0)) - need.value.CNY) * 100) / 100,
}))
const canBatchApprove = computed(() => {
  // 若没有任何需要扣减的金额，则允许；若有扣减，要求全部 after >= 0
  const anyNeed = (need.value.USD>0 || need.value.MYR>0 || need.value.CNY>0)
  if (!anyNeed) return false
  return after.value.USD >= 0 && after.value.MYR >= 0 && after.value.CNY >= 0
})
async function doBatchApprove(){
  if (!batch.value.platform_id || !multipleSelection.value.length) return
  const ids = multipleSelection.value.map(r => r.id)
  await api.fx.payments.batchApprove(ids, batch.value.platform_id)
  multipleSelection.value = []
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
.preview-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
.preview-card .row { display: grid; grid-template-columns: 120px repeat(3, minmax(0,1fr)); gap: 8px; align-items: center; margin: 4px 0; }
.preview-card .cell.head { color: var(--el-text-color-secondary); font-size: 12px; }
.preview-card .cell.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.preview-card .cell.warn { color: var(--el-text-color-primary); }
.preview-card .cell.danger { color: var(--el-color-danger); font-weight: 600; }
</style>

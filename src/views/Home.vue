<template>
  <div class="home container">
    <div class="hero">
      <div class="welcome">{{ t('home.welcome') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>
    <!-- 快捷入口（APP式 3D 交互） -->
    <div class="quick" style="margin-top:8px; margin-bottom:8px;">
      <el-card shadow="never">
        <div class="quick-title" data-testid="qa-title">{{ t('home.quickActions') }}</div>
        <template v-if="quickActions.some(i => i.show)">
          <div class="app-buttons">
            <div 
              v-for="it in quickActions" :key="it.key"
              v-if="it.show"
              class="app-btn"
              :class="`is-${it.color}`"
              v-tilt="{ max: 10, scale: 1.03 }"
              @click="go({ name: it.route })"
            >
              <div class="app-btn__icon">{{ it.icon }}</div>
              <div class="app-btn__label">{{ it.label }}</div>
            </div>
          </div>
        </template>
        <template v-else>
          <el-empty :description="t('home.noQuickActions')" />
        </template>
      </el-card>
    </div>
    <!-- 菜单卡片区域已移除 -->
    <div class="todo" style="margin-top:16px;">
      <el-card>
        <div class="todo-title">{{ t('workbench.todos.title') }}</div>
        <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center; flex-wrap: wrap;">
          <el-select v-model="batch.platform_id" :placeholder="t('transactions.selectPlatform')" size="small" style="width:240px" filterable>
            <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name + (p.fee_percent!=null? `（手续费 ${Number(p.fee_percent||0).toFixed(4)}%）` : '')" />
          </el-select>
          <el-button :disabled="!has('manage_fx') || !batch.platform_id || !multipleSelection.length || !canBatchApprove" type="success" size="small" @click="doBatchApprove">{{ t('common.approve') }}</el-button>
          <span v-if="batch.platform_id" style="color: var(--el-text-color-secondary); font-size:12px;">{{ t('home.approveHint') }}</span>
        </div>
        <!-- 余额预览 -->
        <div v-if="selectedPlatform" class="preview-card">
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.feePercent') }}</div>
            <div class="cell">{{ Number(selectedPlatform.fee_percent||0).toFixed(4) }}%</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.currency') }}</div>
            <div class="cell">USD</div>
            <div class="cell">MYR</div>
            <div class="cell">CNY</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.availableBalance') }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatform.balance_usd||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatform.balance_myr||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatform.balance_cny||0)) }}</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.orderDeduction') }}</div>
            <div class="cell mono warn" :class="{ danger: need.USD>0 && after.USD<0 }">{{ money(need.USD) }}</div>
            <div class="cell mono warn" :class="{ danger: need.MYR>0 && after.MYR<0 }">{{ money(need.MYR) }}</div>
            <div class="cell mono warn" :class="{ danger: need.CNY>0 && after.CNY<0 }">{{ money(need.CNY) }}</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.balanceAfter') }}</div>
            <div class="cell mono" :class="{ danger: after.USD<0 }">{{ money(after.USD) }}</div>
            <div class="cell mono" :class="{ danger: after.MYR<0 }">{{ money(after.MYR) }}</div>
            <div class="cell mono" :class="{ danger: after.CNY<0 }">{{ money(after.CNY) }}</div>
          </div>
        </div>

        <el-table :data="todos" size="small" border @selection-change="onSelectionChange">
          <el-table-column type="selection" width="46" />
          <el-table-column :label="t('common.no')" width="60">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="pay_date" :label="t('fx.payDate')" width="120">
            <template #default="{ row }">{{ fmtDate(row.pay_date) }}</template>
          </el-table-column>
          <el-table-column prop="bill_no" :label="t('common.billNo')" width="200" />
          <el-table-column prop="customer_name" :label="t('common.customer')" />
          <el-table-column prop="total_amount" :label="t('common.amount')" width="140" align="right">
            <template #default="{ row }">{{ money(row.total_amount) }}</template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="420" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openTodo(row)">{{ t('common.view') }}</el-button>
              <el-button v-if="has('manage_fx') && row.status==='pending'" size="small" type="success" @click="openApprove(row)">{{ t('common.approve') }}</el-button>
              <el-button v-if="has('manage_fx') && row.status==='completed'" size="small" type="warning" @click="doUnapprove(row)">{{ t('common.revoke') }}</el-button>
              <el-button size="small" @click="openAudits(row)">{{ t('workbench.auditLog') }}</el-button>
              <template v-if="has('delete_fx') && row.status==='pending'">
                <el-popconfirm :title="t('common.confirmDelete')" @confirm="rejectPayment(row)">
                  <template #reference>
                    <el-button size="small" type="danger">{{ t('common.reject') }}</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    <el-drawer v-model="todoDrawer" :title="t('workbench.todos.payments')" size="60%">
      <div v-if="todoDetail">
        <div class="todo-head">
          <div>{{ t('common.billNo') }}：{{ todoDetail.bill_no || ('Payment-' + todoDetail.id) }}</div>
          <div>{{ t('common.customer') }}：{{ todoDetail.customer_name }}</div>
          <div>{{ t('common.date') }}：{{ fmtDate(todoDetail.pay_date) }}</div>
        </div>
        <el-table :data="todoDetail.items || []" border size="small" height="50vh">
          <el-table-column type="index" :label="t('common.no')" width="60" />
          <el-table-column prop="account_name" :label="t('accounts.fields.accountName')" />
          <el-table-column prop="bank_account" :label="t('accounts.fields.bankAccount')" />
          <el-table-column prop="currency_code" :label="t('transactions.currency')" width="120" />
          <el-table-column prop="amount" :label="t('common.amount')" width="140" align="right">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 审核弹窗：选择平台（手续费按平台配置） -->
  <el-dialog v-model="approveDialog.visible" :title="t('workbench.approveDialogTitle')" width="520px">
      <el-form label-width="100px">
        <el-form-item :label="t('buyfx.platform')">
          <el-select v-model="approveDialog.platform_id" filterable :placeholder="t('transactions.selectPlatform')" style="width: 260px">
            <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
          </el-select>
        </el-form-item>
        <el-alert v-if="approveDialog.platform_id" type="info" :closable="false" show-icon>
          {{ t('home.approveHint') }}
        </el-alert>
        <!-- 单笔审核余额预览 -->
        <div v-if="selectedPlatformSingle" class="preview-card" style="margin-top:8px;">
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.feePercent') }}</div>
            <div class="cell">{{ Number(selectedPlatformSingle.fee_percent||0).toFixed(4) }}%</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.currency') }}</div>
            <div class="cell">USD</div>
            <div class="cell">MYR</div>
            <div class="cell">CNY</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.availableBalance') }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_usd||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_myr||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_cny||0)) }}</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.orderDeduction') }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.USD>0 && afterSingle.USD<0 }">{{ money(needSingle.USD) }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.MYR>0 && afterSingle.MYR<0 }">{{ money(needSingle.MYR) }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.CNY>0 && afterSingle.CNY<0 }">{{ money(needSingle.CNY) }}</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.balanceAfter') }}</div>
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
    <el-drawer v-model="auditDrawer.visible" :title="t('workbench.auditLog')" size="40%">
      <el-table :data="auditRows" size="small" border>
  <el-table-column type="index" :label="t('common.no')" width="60" />
        <el-table-column prop="acted_at" :label="t('common.date')" width="170" />
        <el-table-column prop="action" :label="t('buyfx.action')" width="110" />
        <el-table-column prop="platform_name" :label="t('buyfx.platform')" width="160" />
        <el-table-column :label="t('buyfx.fee')" width="120" align="right">
          <template #default="{ row }">{{ money(row.fee_amount) }} ({{ row.fee_percent }}%)</template>
        </el-table-column>
        <el-table-column :label="t('workbench.deductionDetails')">
          <template #default="{ row }">
            <div v-if="row.deltas">
              <div v-for="(v, k) in row.deltas" :key="k">{{ k }}：{{ t('common.amount') }} {{ money(v.amount) }}，{{ t('buyfx.fee') }} {{ money(v.fee) }}，{{ t('common.total') }} {{ money(v.total) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="acted_by_name" :label="t('common.createdBy')" width="140" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted } from 'vue'
import { api, request as httpRequest } from '@/api'
import { ElMessage } from 'element-plus'
import tilt from '@/directives/tilt.js'
const vTilt = tilt
// 菜单卡片已移除，无需引入图标
const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()

// 快捷入口数据
const quickActions = computed(() => [
  { key: 'tx', label: t('home.qaTransactions'), route: 'transactions', perm: 'view_transactions', color: 'blue', icon: '📒', show: has('view_transactions') },
  { key: 'settleManage', label: t('home.qaSettlements'), route: 'fx-settlements', perm: 'view_fx', color: 'green', icon: '🧾', show: has('view_fx') },
  { key: 'settleHistory', label: t('home.qaSettlementsHistory'), route: 'fx-settlements', perm: 'view_fx', color: 'teal', icon: '🗂️', show: has('view_fx') },
  { key: 'payHistory', label: t('home.qaPaymentsHistory'), route: 'fx-payments', perm: 'view_fx', color: 'orange', icon: '💳', show: has('view_fx') },
  { key: 'buyHistory', label: t('home.qaBuyHistory'), route: 'fx-buy-history', perm: 'view_fx', color: 'purple', icon: '💱', show: has('view_fx') },
])

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
// 轻量日志，便于定位本机“快捷入口”不可见问题（生产无害）
onMounted(() => {
  try {
    const visible = (quickActions.value || []).filter(i => i.show)
    console.info('[Home] QuickActions visible count =', visible.length, 'perms=', (state?.perms||[]))
  } catch {}
})

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

// 驳回：仅 pending 状态可执行，等价于删除该付款单
async function rejectPayment(row){
  try {
    await httpRequest(`/fx/payments/${row.id}`, { method: 'DELETE' })
    ElMessage.success(t('common.ok'))
    await loadTodos()
  } catch (e) {
    ElMessage.error(e?.message || '驳回失败')
  }
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
const multipleSelectionRef = ref([])
const multipleSelection = computed({ get: () => multipleSelectionRef.value, set: (v) => { multipleSelectionRef.value = Array.isArray(v)? v: [] } })
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
  for (const r of (multipleSelection.value || [])) {
    const t = paymentTotalsById.value[r.id]
    if (!t) continue
    totals.USD = Math.round((totals.USD + (t.USD||0)) * 100) / 100
    totals.MYR = Math.round((totals.MYR + (t.MYR||0)) * 100) / 100
    totals.CNY = Math.round((totals.CNY + (t.CNY||0)) * 100) / 100
  }
  return totals
})
const feePct4 = computed(() => Number((selectedPlatform.value && selectedPlatform.value.fee_percent) || 0))
const need = computed(() => ({
  USD: Math.round(((selectionTotals.value?.USD || 0) + Math.round((((selectionTotals.value?.USD || 0) * feePct4.value / 100)) * 100) / 100) * 100) / 100,
  MYR: Math.round(((selectionTotals.value?.MYR || 0) + Math.round((((selectionTotals.value?.MYR || 0) * feePct4.value / 100)) * 100) / 100) * 100) / 100,
  CNY: Math.round(((selectionTotals.value?.CNY || 0) + Math.round((((selectionTotals.value?.CNY || 0) * feePct4.value / 100)) * 100) / 100) * 100) / 100,
}))
const after = computed(() => ({
  USD: Math.round(((Number((selectedPlatform.value && selectedPlatform.value.balance_usd) || 0)) - (need.value?.USD || 0)) * 100) / 100,
  MYR: Math.round(((Number((selectedPlatform.value && selectedPlatform.value.balance_myr) || 0)) - (need.value?.MYR || 0)) * 100) / 100,
  CNY: Math.round(((Number((selectedPlatform.value && selectedPlatform.value.balance_cny) || 0)) - (need.value?.CNY || 0)) * 100) / 100,
}))
const canBatchApprove = computed(() => {
  // 若没有任何需要扣减的金额，则允许；若有扣减，要求全部 after >= 0
  const anyNeed = (need.value.USD>0 || need.value.MYR>0 || need.value.CNY>0)
  if (!anyNeed) return false
  return after.value.USD >= 0 && after.value.MYR >= 0 && after.value.CNY >= 0
})
async function doBatchApprove(){
  if (!batch.value.platform_id || !multipleSelection.value.length) return
  const ids = (multipleSelection.value || []).map(r => r.id)
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
/* 快捷入口 */
.quick-title { font-weight: 700; margin-bottom: 8px; }
.app-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.app-btn { 
  position: relative;
  border-radius: 16px; 
  padding: 18px 14px; 
  background: linear-gradient(145deg, var(--app-btn-bg1), var(--app-btn-bg2));
  color: #fff;
  box-shadow: 0 12px 24px rgba(0,0,0,.12);
  cursor: pointer;
  user-select: none;
  transform-style: preserve-3d;
  transition: box-shadow .2s ease, filter .2s ease;
}
.app-btn:hover { box-shadow: 0 18px 36px rgba(0,0,0,.18); filter: saturate(1.05); }
.app-btn__icon { font-size: 26px; line-height: 1; margin-bottom: 8px; }
.app-btn__label { font-weight: 700; letter-spacing: .3px; }

/* 主题色系 */
.app-btn.is-blue { --app-btn-bg1: #5aa9ff; --app-btn-bg2: #3f7ef1; }
.app-btn.is-green { --app-btn-bg1: #43e97b; --app-btn-bg2: #38c172; }
.app-btn.is-teal { --app-btn-bg1: #2dd4bf; --app-btn-bg2: #14b8a6; }
.app-btn.is-orange { --app-btn-bg1: #f6ad55; --app-btn-bg2: #ed8936; }
.app-btn.is-purple { --app-btn-bg1: #a78bfa; --app-btn-bg2: #7c3aed; }
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

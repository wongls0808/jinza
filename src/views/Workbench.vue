<template>
  <div class="workbench container">
    <div class="hero">
      <div class="welcome">{{ t('workbench.title') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>

    <div class="quick" style="margin-top:8px; margin-bottom:8px; position: relative;">
      <el-card shadow="never" class="card--plain">
        <div class="card-grid single-row">
          <div
            v-for="it in quickActions" :key="it.key"
            class="feature-card"
            role="button"
            :aria-label="it.label"
            tabindex="0"
            v-tilt="{ max: 8, scale: 1.02 }"
            @click="go({ name: it.route })"
            @keydown.enter.prevent="go({ name: it.route })"
            @keydown.space.prevent="go({ name: it.route })"
          >
            <div class="fc-icon">
              <component :is="it.icon" />
            </div>
            <div class="fc-texts">
              <div class="fc-title">{{ it.label }}</div>
              <!-- 描述词已移除 -->
            </div>
            <div class="fc-arrow">›</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计图区域（五个独立图表，无标题/描述，只显示有数据的项） -->
    <div class="charts-grid">
      <div ref="elCusMYR" class="chart"></div>
      <div ref="elCusCNY" class="chart"></div>
      <div ref="elAccounts" class="chart"></div>
      <div ref="elPending" class="chart"></div>
      <div ref="elPlatforms" class="chart"></div>
    </div>

    <!-- 可拖拽的“付款待审”浮动按钮（持久化位置） -->
    <div
      class="floating-payments"
      :style="fabStyle"
      role="button"
      aria-label="付款待审"
      @mousedown="onFabDown"
      @touchstart="onFabDown"
      @click="onFabClick"
    >
      <el-badge :value="paymentsCount" :max="99" type="danger">
        <div class="fp-btn">
          <CreditCard />
        </div>
      </el-badge>
    </div>

    <!-- 付款待审抽屉列表（含审核操作） -->
    <el-drawer v-model="paymentsDrawer" :title="t('workbench.todos.payments')" size="60%">
      <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center; flex-wrap: wrap;">
        <el-select v-model="batch.platform_id" placeholder="选择平台商" size="small" style="width:240px" filterable>
          <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name + (p.fee_percent!=null? `（手续费 ${Number(p.fee_percent||0).toFixed(4)}%）` : '')" />
        </el-select>
        <el-button :disabled="!has('manage_fx') || !batch.platform_id || !multipleSelection.length || !canBatchApprove" type="success" size="small" @click="doBatchApprove">批量审核</el-button>
        <el-button size="small" type="primary" @click="loadPaymentsList">刷新</el-button>
      </div>
      <!-- 余额预览（批量） -->
      <div v-if="selectedPlatform" class="preview-card">
        <div class="row">
          <div class="cell head">平台手续费</div>
          <div class="cell">{{ Number(selectedPlatform.fee_percent||0).toFixed(4) }}%</div>
        </div>
        <div class="row">
          <div class="cell head">币种</div>
          <div class="cell">USD</div>
          <div class="cell">MYR</div>
          <div class="cell">CNY</div>
        </div>
        <div class="row">
          <div class="cell head">可用余额</div>
          <div class="cell mono">{{ money(Number(selectedPlatform.balance_usd||0)) }}</div>
          <div class="cell mono">{{ money(Number(selectedPlatform.balance_myr||0)) }}</div>
          <div class="cell mono">{{ money(Number(selectedPlatform.balance_cny||0)) }}</div>
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
      <el-table :data="payments" size="small" border v-loading="paymentsLoading" :default-sort="{ prop: 'pay_date', order: 'ascending' }" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="46" />
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="pay_date" label="付款日期" width="120">
          <template #default="{ row }">{{ fmtDate(row.pay_date) }}</template>
        </el-table-column>
        <el-table-column prop="bill_no" label="单号" width="200" />
        <el-table-column prop="customer_name" label="客户" />
        <el-table-column label="银行" min-width="160">
          <template #default="{ row }">
            <div style="display:flex; align-items:center; gap:6px;">
              <img v-if="row.bank_code" :src="bankImg(row.bank_code)" :alt="row.bank_code" style="height:16px; width:auto; object-fit:contain;" @error="onBankImgErr($event)" />
              <span>{{ row.bank_name || row.bank_code || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="140" align="right">
          <template #default="{ row }">{{ money(row.total_amount) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="420" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openTodo(row)">查看</el-button>
            <el-button v-if="has('manage_fx') && row.status==='pending'" size="small" type="success" @click="openApprove(row)">审核</el-button>
            <el-button v-if="has('manage_fx') && row.status==='completed'" size="small" type="warning" @click="doUnapprove(row)">撤销</el-button>
            <template v-if="has('delete_fx') && row.status==='pending'">
              <el-popconfirm :title="t('common.confirmDelete')" @confirm="rejectPayment(row)">
                <template #reference>
                  <el-button size="small" type="danger">驳回</el-button>
                </template>
              </el-popconfirm>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 付款单明细抽屉 -->
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
          <el-table-column label="银行" min-width="180">
            <template #default="{ row }">
              <div style="display:flex; align-items:center; gap:8px;">
                <img v-if="row.bank_code" :src="bankImg(row.bank_code)" :alt="row.bank_code" style="height:16px; width:auto; object-fit:contain;" @error="onBankImgErr($event)" />
                <span>{{ row.bank_name || row.bank_code || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="currency_code" label="币种" width="120" />
          <el-table-column prop="amount" label="金额" width="140" align="right">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 审核弹窗：选择平台并预览余额 -->
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
        <div v-if="selectedPlatformSingle" class="preview-card" style="margin-top:8px;">
          <div class="row">
            <div class="cell head">平台手续费</div>
            <div class="cell">{{ Number(selectedPlatformSingle.fee_percent||0).toFixed(4) }}%</div>
          </div>
          <div class="row">
            <div class="cell head">币种</div>
            <div class="cell">USD</div>
            <div class="cell">MYR</div>
            <div class="cell">CNY</div>
          </div>
          <div class="row">
            <div class="cell head">可用余额</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_usd||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_myr||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_cny||0)) }}</div>
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
import { api, request as httpRequest } from '@/api'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()

// 工作台页面：为保证可见性，这里取消权限 gating，始终展示入口
const quickActions = computed(() => [
  { key: 'tx', label: t('home.qaTransactions'), desc: t('workbench.cards.tx'), route: 'transactions', color: 'blue', icon: 'Tickets' },
  { key: 'settleManage', label: t('home.qaSettlements'), desc: t('workbench.cards.settleManage'), route: 'fx-settlements', color: 'green', icon: 'Collection' },
  { key: 'settleHistory', label: t('home.qaSettlementsHistory'), desc: t('workbench.cards.settleHistory'), route: 'fx-settlements', color: 'teal', icon: 'FolderOpened' },
  { key: 'payHistory', label: t('home.qaPaymentsHistory'), desc: t('workbench.cards.payHistory'), route: 'fx-payments', color: 'orange', icon: 'CreditCard' },
  { key: 'buyHistory', label: t('home.qaBuyHistory'), desc: t('workbench.cards.buyHistory'), route: 'fx-buy-history', color: 'purple', icon: 'Coin' },
])

// 待办：付款待审数量徽标 + 抽屉列表
const paymentsCount = ref(0)
const paymentsDrawer = ref(false)
const payments = ref([])
const paymentsLoading = ref(false)
// 平台列表用于审核
const platforms = ref([])
// 批量审核所需状态
const multipleSelectionRef = ref([])
const multipleSelection = computed({ get: () => multipleSelectionRef.value, set: (v) => { multipleSelectionRef.value = Array.isArray(v)? v: [] } })
const batch = ref({ platform_id: null })
const selectedPlatform = computed(() => platforms.value.find(p => p.id === batch.value.platform_id) || null)
const paymentTotalsById = ref({}) // { [id]: { USD, MYR, CNY } }

async function loadPaymentsCount(){
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 1 })
    if (res && typeof res.total === 'number') paymentsCount.value = res.total
    else if (Array.isArray(res?.items)) paymentsCount.value = res.items.length
    else if (Array.isArray(res)) paymentsCount.value = res.length
    else paymentsCount.value = 0
  } catch { paymentsCount.value = 0 }
}
async function loadPaymentsList(){
  paymentsLoading.value = true
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 50 })
    const items = Array.isArray(res) ? res : (res.items || [])
    // 默认按日期升序
    payments.value = [...items].sort((a,b) => String(a.pay_date||'').localeCompare(String(b.pay_date||'')))
  } catch (e) {
    // 后端不可用（本地未配置数据库）时，静默为空以保证 UI 可用
    payments.value = []
  } finally {
    paymentsLoading.value = false
  }
}
function openPayments(){ paymentsDrawer.value = true; loadPaymentsList() }
// 已移除“去处理”入口，保留在工作台内完成待审相关操作
// —— 审核组件：单笔审核/日志/明细 ——
const todoDrawer = ref(false)
const todoDetail = ref(null)
function fmtDate(v){ try { if (!v) return ''; if (typeof v === 'string') return v.slice(0,10); if (v.toISOString) return v.toISOString().slice(0,10); return String(v).slice(0,10) } catch { return String(v).slice(0,10) } }
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
// 参照其它列表的银行 Logo 回退策略：svg → png → jpg → public.svg
function bankImg(code) {
  const c = String(code || 'public').toLowerCase()
  return `/banks/${c}.svg`
}
function onBankImgErr(e) {
  const el = e?.target
  if (el && el.tagName === 'IMG') {
    const current = el.getAttribute('src') || ''
    if (/\.svg$/i.test(current)) el.src = current.replace(/\.svg$/i, '.png')
    else if (/\.png$/i.test(current)) el.src = current.replace(/\.png$/i, '.jpg')
    else el.src = '/banks/public.svg'
  }
}
async function openTodo(row){
  try {
    const d = await api.fx.payments.detail(row.id)
    todoDetail.value = d
    todoDrawer.value = true
  } catch {}
}
const approveDialog = ref({ visible: false, loading: false, id: null, platform_id: null })
const currentPaymentTotals = ref({ USD:0, MYR:0, CNY:0 })
async function openApprove(row){
  approveDialog.value = { visible: true, loading: false, id: row.id, platform_id: null }
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
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
  } finally { approveDialog.value.loading = false }
}
async function doUnapprove(row){
  try {
    await api.fx.payments.unapprove(row.id)
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
  } catch {}
}
const auditDrawer = ref({ visible: false })
const auditRows = ref([])
async function openAudits(row){
  auditDrawer.value.visible = true
  try {
    const list = await api.fx.payments.audits(row.id)
    auditRows.value = (list.items || []).map(it => ({ ...it, deltas: typeof it.deltas === 'string' ? JSON.parse(it.deltas) : it.deltas }))
  } catch { auditRows.value = [] }
}
async function rejectPayment(row){
  try {
    await httpRequest(`/fx/payments/${row.id}`, { method: 'DELETE' })
    ElMessage.success(t('common.ok'))
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
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

// —— 批量审核：选择行 -> 计算合计/需求/扣后余额 ——
async function fetchPaymentTotals(id){
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
  const anyNeed = (need.value.USD>0 || need.value.MYR>0 || need.value.CNY>0)
  if (!anyNeed) return false
  return after.value.USD >= 0 && after.value.MYR >= 0 && after.value.CNY >= 0
})
async function doBatchApprove(){
  if (!batch.value.platform_id || !multipleSelection.value.length) return
  const ids = (multipleSelection.value || []).map(r => r.id)
  try {
    await api.fx.payments.batchApprove(ids, batch.value.platform_id)
    multipleSelection.value = []
    batch.value.platform_id = null
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
  } catch {}
}

async function loadPlatforms(){
  try {
    const res = await api.buyfx.listPlatforms()
    platforms.value = res.items || []
  } catch { platforms.value = [] }
}

onMounted(() => { loadPaymentsCount(); loadPlatforms(); renderCharts(); window.addEventListener('resize', () => setTimeout(() => [chCusMYR, chCusCNY, chAccounts, chPending, chPlatforms].forEach(ch => ch && ch.resize()), 0)) })

// —— 统计图：5 个独立图表 ——
const elCusMYR = ref(null)
const elCusCNY = ref(null)
const elAccounts = ref(null)
const elPending = ref(null)
const elPlatforms = ref(null)
let chCusMYR, chCusCNY, chAccounts, chPending, chPlatforms

function barOption(xCats, values, opts={}){
  // 横向条形图：y 为分类轴，x 为数值轴
  return {
    grid: { left: 60, right: 16, top: 10, bottom: 10 },
    animationDuration: 400,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', axisLabel: { color: 'var(--el-text-color-secondary)', fontSize: 11 } },
    yAxis: { type: 'category', data: xCats, axisLabel: { interval: 0, color: 'var(--el-text-color-primary)', fontSize: 11 } },
    legend: { show: !!opts.legend, bottom: 0, textStyle: { color: 'var(--el-text-color-primary)' } },
    series: [ { name: opts.name || '', type: 'bar', data: values, itemStyle: { color: opts.color || '#409EFF' }, barMaxWidth: 30 } ]
  }
}
function barStackOption(xCats, series){
  // 横向堆叠条形图
  return {
    grid: { left: 60, right: 16, top: 10, bottom: 10 },
    animationDuration: 400,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', axisLabel: { color: 'var(--el-text-color-secondary)', fontSize: 11 } },
    yAxis: { type: 'category', data: xCats, axisLabel: { interval: 0, color: 'var(--el-text-color-primary)', fontSize: 11 } },
    legend: { show: false },
    series: series.map(s => ({ ...s, type: 'bar', stack: 'bal', barMaxWidth: 30 }))
  }
}

async function renderCharts(){
  // 1/2. 客户余额：MYR/CNY
  try {
    const data = await api.customers.list({ page: 1, pageSize: 5000, sort: 'id', order: 'asc' })
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data)? data : []
    const cusMYR = items.filter(r => Number(r.balance_myr) > 0)
    const cusCNY = items.filter(r => Number(r.balance_cny) > 0)
    if (elCusMYR.value) {
      chCusMYR ||= echarts.init(elCusMYR.value)
      chCusMYR.setOption(barOption(cusMYR.map(r => r.name||r.abbr||''), cusMYR.map(r => Number(r.balance_myr)||0), { name: 'MYR', color: '#67C23A' }))
    }
    if (elCusCNY.value) {
      chCusCNY ||= echarts.init(elCusCNY.value)
      chCusCNY.setOption(barOption(cusCNY.map(r => r.name||r.abbr||''), cusCNY.map(r => Number(r.balance_cny)||0), { name: 'CNY', color: '#E6A23C' }))
    }
  } catch {}

  // 3. 收款账户余额（按账户，名称附加币种；仅展示 balance>0）
  try {
    const data = await api.accounts.list({ page: 1, pageSize: 5000, sort: 'id', order: 'asc' })
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data)? data : []
    const rows = items.filter(r => Number(r.balance) > 0)
    if (elAccounts.value) {
      chAccounts ||= echarts.init(elAccounts.value)
      chAccounts.setOption(barOption(rows.map(r => `${r.account_name||''} (${String(r.currency_code||'').toUpperCase()})`), rows.map(r => Number(r.balance)||0), { color: '#409EFF' }))
    }
  } catch {}

  // 4. 付款待办余额（汇总 USD/MYR/CNY）
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 500 })
    const heads = Array.isArray(res) ? res : (res?.items || [])
    const sum = { USD:0, MYR:0, CNY:0 }
    // 逐单明细合计（币种安全）
    for (const h of heads) {
      try {
        const d = await api.fx.payments.detail(h.id)
        for (const it of (d.items||[])) {
          const cur = String(it.currency_code||'').toUpperCase()
          const amt = Number(it.amount||0)
          if (cur==='USD' || cur==='MYR' || cur==='CNY') sum[cur] = Math.round((sum[cur] + amt) * 100) / 100
        }
      } catch {}
    }
    const cats = ['USD','MYR','CNY']
    const vals = cats.map(k => Number(sum[k]||0))
    const cats2 = cats.filter((k,i) => vals[i] > 0)
    const vals2 = vals.filter(v => v>0)
    if (elPending.value) {
      chPending ||= echarts.init(elPending.value)
      chPending.setOption(barOption(cats2, vals2, { color: '#F56C6C' }))
    }
  } catch {}

  // 5. 平台余额（每个平台 3 币种堆叠，隐藏图例）
  try {
    const res = await api.buyfx.listPlatforms()
    const items = res?.items || []
    const rows = items.map(p => ({
      name: p.name,
      USD: Number(p.balance_usd||0),
      MYR: Number(p.balance_myr||0),
      CNY: Number(p.balance_cny||0)
    })).filter(r => r.USD>0 || r.MYR>0 || r.CNY>0)
    const x = rows.map(r => r.name)
    const series = [
      { name: 'USD', data: rows.map(r => r.USD), itemStyle: { color: '#409EFF' } },
      { name: 'MYR', data: rows.map(r => r.MYR), itemStyle: { color: '#67C23A' } },
      { name: 'CNY', data: rows.map(r => r.CNY), itemStyle: { color: '#E6A23C' } },
    ]
    if (elPlatforms.value) {
      chPlatforms ||= echarts.init(elPlatforms.value)
      chPlatforms.setOption(barStackOption(x, series))
    }
  } catch {}

  // resize
  setTimeout(() => [chCusMYR, chCusCNY, chAccounts, chPending, chPlatforms].forEach(ch => ch && ch.resize()), 0)
}

// —— 付款待审：可拖拽浮动按钮 ——
const fabPos = ref({ x: 16, y: 160 })
const fabDragging = ref(false)
const fabStart = { x: 0, y: 0, mx: 0, my: 0 }
const fabStyle = computed(() => ({ left: fabPos.value.x + 'px', top: fabPos.value.y + 'px' }))
function readFab() {
  try {
    const raw = localStorage.getItem('fab.payments.pos')
    if (!raw) return
    const p = JSON.parse(raw)
    if (typeof p.x === 'number' && typeof p.y === 'number') fabPos.value = p
  } catch {}
}
function saveFab() { try { localStorage.setItem('fab.payments.pos', JSON.stringify(fabPos.value)) } catch {} }
function onFabDown(e) {
  fabDragging.value = true
  const pt = 'touches' in e ? e.touches[0] : e
  fabStart.mx = pt.clientX
  fabStart.my = pt.clientY
  fabStart.x = fabPos.value.x
  fabStart.y = fabPos.value.y
  window.addEventListener('mousemove', onFabMove)
  window.addEventListener('mouseup', onFabUp)
  window.addEventListener('touchmove', onFabMove, { passive: false })
  window.addEventListener('touchend', onFabUp)
}
function onFabMove(e) {
  if (!fabDragging.value) return
  const pt = 'touches' in e ? e.touches[0] : e
  if ('touches' in e) e.preventDefault()
  const dx = pt.clientX - fabStart.mx
  const dy = pt.clientY - fabStart.my
  const nx = Math.max(8, Math.min(window.innerWidth - 60, fabStart.x + dx))
  const ny = Math.max(80, Math.min(window.innerHeight - 60, fabStart.y + dy))
  fabPos.value = { x: nx, y: ny }
}
function onFabUp() {
  fabDragging.value = false
  window.removeEventListener('mousemove', onFabMove)
  window.removeEventListener('mouseup', onFabUp)
  window.removeEventListener('touchmove', onFabMove)
  window.removeEventListener('touchend', onFabUp)
  saveFab()
}
function onFabClick() {
  if (fabDragging.value) return
  openPayments()
}
onMounted(() => { readFab() })
</script>

<style scoped>
.workbench { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.quick-title { display:none; }
.card--plain { background: transparent; border: none; box-shadow: none; }

/* 卡片网格 */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.card-grid.single-row { grid-template-columns: repeat(5, minmax(180px, 1fr)); }
.feature-card {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr 16px;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 8px 20px rgba(0,0,0,.06);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: box-shadow .2s ease, filter .2s ease, transform .06s ease;
}
.feature-card::after { display: none; }
.feature-card:hover { box-shadow: 0 22px 46px rgba(0,0,0,.2); filter: saturate(1.06); }
.feature-card:focus { outline: 3px solid rgba(255,255,255,.5); outline-offset: 2px; }
.fc-icon { font-size: 26px; line-height: 1; text-shadow: none; display: flex; align-items: center; justify-content: center; }
.fc-icon :deep(svg) { width: 24px; height: 24px; }
.fc-texts { display: grid; gap: 4px; }
.fc-title { font-weight: 800; letter-spacing: .2px; }
.fc-desc { display: none; }
.fc-arrow { font-size: 20px; opacity: .65; color: var(--el-text-color-secondary); }

/* 主题色系 */
/* 主题占位已合并为统一白卡风格，无需额外色系 */

/* 浮动按钮样式 */
.floating-payments { position: fixed; z-index: 1000; cursor: move; user-select: none; }
.fp-btn { width: 44px; height: 44px; border-radius: 22px; background: var(--el-color-primary); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,.18); }
.fp-btn :deep(svg) { width: 20px; height: 20px; }
/* 明细/预览样式 */
.todo-head { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; }
.todo-head > div { color: var(--el-text-color-primary); font-weight: 600; }
.preview-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
.preview-card .row { display: grid; grid-template-columns: 120px repeat(3, minmax(0,1fr)); gap: 8px; align-items: center; margin: 4px 0; }
.preview-card .cell.head { color: var(--el-text-color-secondary); font-size: 12px; }
.preview-card .cell.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.preview-card .cell.warn { color: var(--el-text-color-primary); }
.preview-card .cell.danger { color: var(--el-color-danger); font-weight: 600; }

/* 图表区域 */
.charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; margin-top: 8px; }
.chart { height: 300px; border: 1px solid var(--el-border-color); border-radius: 10px; background: var(--el-bg-color); }
</style>
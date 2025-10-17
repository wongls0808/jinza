<template>
  <div class="fx-buy">
  <h1>{{ t('buyfx.title') }}</h1>
    <el-row :gutter="16">
      <el-col v-if="manage" :span="10">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>{{ t('buyfx.platformSection') }}</span>
              <template v-if="manage">
                <el-button size="small" type="primary" @click="openPlatformDialog()">{{ t('buyfx.addPlatform') }}</el-button>
              </template>
            </div>
          </template>
          <div class="platform-list">
            <div v-for="(p, idx) in platforms" :key="p.id" class="platform-card">
              <div class="platform-card__header">
                <div class="title">
                  <span class="index">#{{ idx + 1 }}</span>
                  <span class="code">{{ p.code || '-' }}</span>
                  <span class="name">{{ p.name }}</span>
                </div>
                <div class="ops">
                  <template v-if="manage">
                    <el-button size="small" @click="openPlatformDialog(p)">{{ t('buyfx.edit') }}</el-button>
                    <el-popconfirm :title="t('buyfx.confirmDelete')" @confirm="removePlatform(p)">
                      <template #reference>
                        <el-button size="small" type="danger">{{ t('buyfx.delete') }}</el-button>
                      </template>
                    </el-popconfirm>
                    <el-button size="small" type="primary" plain @click="openLoansDrawer(p)">{{ t('buyfx.loanRecords') }}</el-button>
                  </template>
                </div>
              </div>
              <div class="platform-card__body">
                <div class="row"><span class="label">{{ t('buyfx.loginUrl') }}</span><a :href="p.login_url" target="_blank" rel="noopener" class="value link" v-if="p.login_url">{{ p.login_url }}</a><span v-else class="value">-</span></div>
                <div class="row"><span class="label">{{ t('buyfx.balanceUSD') }}</span><span class="value mono">{{ money(p.balance_usd) }}</span></div>
                <div class="row"><span class="label">{{ t('buyfx.balanceMYR') }}</span><span class="value mono">{{ money(p.balance_myr) }}</span></div>
                <div class="row"><span class="label">{{ t('buyfx.balanceCNY') }}</span><span class="value mono">{{ money(p.balance_cny) }}</span></div>
                <div class="row"><span class="label">{{ t('buyfx.feePercent') }}</span><span class="value">{{ percent(p.fee_percent) }}</span></div>
              </div>
            </div>
            <div v-if="!platforms.length" class="empty">{{ t('buyfx.empty') }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="manage?14:24">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>{{ t('buyfx.title') }}</span>
            </div>
          </template>
          
          <div class="convert-form">
            <el-select v-model="convert.platform_id" filterable :placeholder="t('buyfx.placePlatform')" @change="onPlatformChange">
              <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
            </el-select>
            <el-select v-model="convert.from" :placeholder="t('buyfx.sellCurrency')" @change="onFromChange">
              <el-option label="USD" value="USD"/>
              <el-option label="MYR" value="MYR"/>
              <el-option label="CNY" value="CNY"/>
            </el-select>
            <el-select v-model="convert.to" :placeholder="t('buyfx.buyCurrency')">
              <el-option label="USD" value="USD"/>
              <el-option label="MYR" value="MYR"/>
              <el-option label="CNY" value="CNY"/>
            </el-select>
            <el-input-number v-model="convert.amount" :min="0" :precision="2" :step="100" :placeholder="t('buyfx.sellAmount')" @change="() => { amountEdited.value = true }"/>
            <el-input-number v-model="convert.rate" :min="0" :precision="6" :step="0.0001" :placeholder="t('buyfx.rate')"/>
            <el-button type="warning" :disabled="!canConvert" @click="doConvert">{{ t('buyfx.sell') }}</el-button>
          </div>
          <div class="convert-hint" v-if="convertSummary">
            <el-alert type="info" :title="convertSummary" show-icon :closable="false" />
          </div>
          <div style="margin-top:10px; display:flex; justify-content:flex-end;">
            <el-button type="primary" link @click="goBuyOrderHistory">{{ t('buyfx.viewOrders') }}</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

  <el-dialog v-if="manage" v-model="platformDialog.visible" :title="t('buyfx.dialogTitle')" width="560px">
      <el-form label-width="100px" :model="platformDialog.model">
        <el-form-item :label="t('buyfx.code')"><el-input v-model="platformDialog.model.code" /></el-form-item>
        <el-form-item :label="t('buyfx.name')"><el-input v-model="platformDialog.model.name" /></el-form-item>
        <el-form-item :label="t('buyfx.loginUrl')"><el-input v-model="platformDialog.model.login_url" placeholder="https://..." /></el-form-item>
        <el-form-item :label="t('buyfx.balanceUSD')"><el-input-number v-model="platformDialog.model.balance_usd" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item :label="t('buyfx.balanceMYR')"><el-input-number v-model="platformDialog.model.balance_myr" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item :label="t('buyfx.balanceCNY')"><el-input-number v-model="platformDialog.model.balance_cny" :min="0" :precision="2" :step="100" /></el-form-item>
  <el-form-item :label="t('buyfx.feePercent')"><el-input-number v-model="platformDialog.model.fee_percent" :min="0" :max="100" :precision="4" :step="0.0001" /></el-form-item>
        <el-form-item :label="t('buyfx.contact')"><el-input v-model="platformDialog.model.contact" /></el-form-item>
        <el-form-item :label="t('buyfx.active')"><el-switch v-model="platformDialog.model.active" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="platformDialog.visible=false" :disabled="platformDialog.loading">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="savePlatform" :loading="platformDialog.loading">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
  
  <!-- 平台商借贷/互换记录抽屉 -->
  <el-drawer v-if="manage" v-model="loans.visible" :title="`${t('buyfx.loanRecords')} · ${loans.platform?.name||loans.platform?.code||''}`" size="60%">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
      <el-tabs v-model="loans.currency" @tab-change="onLoanCurrencyChange">
        <el-tab-pane label="ALL" name="ALL" />
        <el-tab-pane label="USD" name="USD" />
        <el-tab-pane label="MYR" name="MYR" />
        <el-tab-pane label="CNY" name="CNY" />
      </el-tabs>
      <el-button type="primary" plain @click="exportLedgerCsv">{{ t('buyfx.exportLedger') }}</el-button>
    </div>
    <el-table :data="ledgerShown" size="small" border v-loading="loans.loading">
      <el-table-column prop="ts" :label="t('common.createdAt')" width="160">
        <template #default="{ row }">{{ (row.ts||'').slice(0,19) }}</template>
      </el-table-column>
      <el-table-column prop="source" :label="t('buyfx.source')" width="100" />
      <el-table-column prop="action" :label="t('buyfx.action')" width="100" />
      <el-table-column prop="currency" :label="t('transactions.currency')" width="100" />
      <el-table-column prop="debit" :label="t('buyfx.debit')" width="120">
        <template #default="{ row }">{{ money6(row.debit) }}</template>
      </el-table-column>
      <el-table-column prop="credit" :label="t('buyfx.credit')" width="120">
        <template #default="{ row }">{{ money6(row.credit) }}</template>
      </el-table-column>
      <el-table-column prop="balance" :label="t('buyfx.balance')" width="140">
        <template #default="{ row }">{{ money6(row.balance) }}</template>
      </el-table-column>
      <el-table-column prop="ref_no" :label="t('transactions.billNo')" width="160" />
      <el-table-column prop="note" :label="t('common.details')" min-width="160" />
    </el-table>
  </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const props = defineProps({ manage: { type: Boolean, default: true } })

const platforms = ref([])

async function loadPlatforms(){
  const res = await api.buyfx.listPlatforms()
  platforms.value = Array.isArray(res?.items) ? res.items : []
  // 若仅有一个平台且尚未选择，自动选择并填充金额
  if (!convert.value.platform_id && platforms.value.length === 1) {
    convert.value.platform_id = platforms.value[0].id
    if (!amountEdited.value || !convert.value.amount) setAmountFromBalance()
  } else {
    // 平台列表加载完成后，若已选平台且未编辑过金额，尝试填充
    if (convert.value.platform_id && (!amountEdited.value || !convert.value.amount)) setAmountFromBalance()
  }
}
// 已移除实时汇率调用，支持手工录入汇率

// 卖出金额默认对应币种余额（可手动修改）
const amountEdited = ref(false)
let updatingAmount = false
function setAmountFromBalance(){
  const p = platforms.value.find(x=>x.id===convert.value.platform_id)
  if (!p) return
  const from = convert.value.from
  let bal = 0
  if (from==='USD') bal = Number(p.balance_usd||0)
  else if (from==='MYR') bal = Number(p.balance_myr||0)
  else if (from==='CNY') bal = Number(p.balance_cny||0)
  updatingAmount = true
  convert.value.amount = Math.max(0, bal)
  // 下一轮微任务后允许用户编辑标记
  queueMicrotask(() => { updatingAmount = false })
}
watch(() => convert.value.amount, (v, ov) => {
  if (updatingAmount) return
  // 用户主动输入后，标记为已编辑
  if (v != null && v !== 0) amountEdited.value = true
})
watch(() => convert.value.platform_id, () => {
  if (!amountEdited.value || !convert.value.amount) setAmountFromBalance()
})
watch(() => convert.value.from, () => {
  if (!amountEdited.value || !convert.value.amount) setAmountFromBalance()
})
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
function percent(v){
  const n = Number(v||0)
  if (!isFinite(n)) return '0%'
  return `${n.toFixed(4)}%`
}

function goBuyOrderHistory(){
  // 跳转到“购汇单历史”页面
  try { router.push({ name: 'fx-buy-history' }) } catch {}
}

const platformDialog = ref({ visible:false, loading:false, model: { id:null, code:'', name:'', contact:'', active:true, login_url:'', balance_usd:0, balance_myr:0, balance_cny:0, fee_percent:0 } })
function openPlatformDialog(row){
  platformDialog.value.visible = true
  platformDialog.value.loading = false
  platformDialog.value.model = row ? { 
    id: row.id,
    code: row.code||'',
    name: row.name||'',
    contact: row.contact||'',
    active: !!row.active,
    login_url: row.login_url||'',
    balance_usd: Number(row.balance_usd||0),
    balance_myr: Number(row.balance_myr||0),
    balance_cny: Number(row.balance_cny||0),
    fee_percent: row.fee_percent==null? 0 : Number(row.fee_percent)
  } : { id:null, code:'', name:'', contact:'', active:true, login_url:'', balance_usd:0, balance_myr:0, balance_cny:0, fee_percent:0 }
}
async function savePlatform(){
  const m = platformDialog.value.model
  if (!m.name) { ElMessage.error(t('buyfx.saveFailed')); return }
  platformDialog.value.loading = true
  try {
    await api.buyfx.savePlatform({
      id: m.id,
      code: m.code||null,
      name: m.name,
      contact: m.contact||null,
      active: !!m.active,
      login_url: m.login_url||null,
      balance_usd: Number(m.balance_usd||0),
      balance_myr: Number(m.balance_myr||0),
      balance_cny: Number(m.balance_cny||0),
      fee_percent: Number(m.fee_percent||0)
    })
    ElMessage.success(t('buyfx.saved'))
    platformDialog.value.visible = false
    await loadPlatforms()
  } catch (e) {
    ElMessage.error(e?.message || t('buyfx.saveFailed'))
  } finally {
    platformDialog.value.loading = false
  }
}
async function removePlatform(row){
  try {
    await api.buyfx.deletePlatform(row.id)
    ElMessage.success(t('buyfx.deleted'))
    await loadPlatforms()
  } catch (e) {
    ElMessage.error(e?.message || t('buyfx.deleteFailed'))
  }
}

onMounted(async () => { await loadPlatforms() })

// 转换（平台内互换）
const convert = ref({ platform_id: null, from: 'MYR', to: 'CNY', amount: null, rate: null })
const canConvert = computed(() => !!convert.value.platform_id && convert.value.from && convert.value.to && convert.value.from!==convert.value.to && Number(convert.value.amount||0)>0 && Number(convert.value.rate||0)>0 )
const convertSummary = computed(() => {
  const amt = Number(convert.value.amount||0)
  const r = Number(convert.value.rate||0)
  if (!(amt>0) || !(r>0)) return ''
  const toAmt = amt * r
  return `${t('buyfx.amountTo')}: ${money(toAmt)}`
})
async function doConvert(){
  try{
    const pid = convert.value.platform_id
    await api.buyfx.convertPlatformCurrency(pid, {
      from_currency: convert.value.from,
      to_currency: convert.value.to,
      amount_from: Number(convert.value.amount||0),
      rate: Number(convert.value.rate||0)
    })
    ElMessage.success(t('buyfx.converted'))
    await loadPlatforms()
    // 卖出成功后，若未再次编辑金额，继续按余额自动更新显示
    amountEdited.value = false
    if (!convert.value.amount) setAmountFromBalance()
  }catch(e){
    ElMessage.error(e?.message || t('buyfx.convertFailed'))
  }
}

function onPlatformChange(){
  if (!amountEdited.value || !convert.value.amount) setAmountFromBalance()
}
function onFromChange(){
  if (!amountEdited.value || !convert.value.amount) setAmountFromBalance()
}

// —— 平台商：借贷/互换记录抽屉 ——
const loans = ref({ visible: false, loading: false, platform: null, currency: 'ALL', ledger: [] })
const currencyTabs = [
  { label: 'ALL', value: 'ALL' },
  { label: 'USD', value: 'USD' },
  { label: 'MYR', value: 'MYR' },
  { label: 'CNY', value: 'CNY' }
]
function openLoansDrawer(p){
  loans.value.visible = true
  loans.value.platform = p
  loans.value.currency = 'ALL'
  loadLedger()
}
async function loadLedger(){
  loans.value.loading = true
  try{
    const res = await api.buyfx.listPlatformLedger(loans.value.platform.id)
    loans.value.ledger = Array.isArray(res?.items) ? res.items : []
  }catch(e){
    ElMessage.error(e?.message || '加载失败')
  }finally{
    loans.value.loading = false
  }
}
const ledgerShown = computed(() => {
  const cur = String(loans.value.currency||'ALL').toUpperCase()
  if (cur === 'ALL') return loans.value.ledger
  return (loans.value.ledger||[]).filter(r => String(r.currency).toUpperCase()===cur)
})
function onLoanCurrencyChange(){ /* 前端即时过滤；如需后端过滤可改为传参调用 listPlatformLedger */ }
function money6(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:6}) }
function exportLedgerCsv(){
  try {
    const rows = ledgerShown.value || []
    const header = ['Date','Source','Action','Currency','Debit','Credit','Balance','Ref No','Note']
    const body = rows.map(r => [
      (r.ts||'').slice(0,19), r.source||'', r.action||'', r.currency||'', r.debit, r.credit, r.balance, r.ref_no||'', r.note||''
    ])
    const csvRows = [header, ...body]
    const csv = csvRows.map(r => r.map(v => {
      const s = v==null? '': String(v)
      return (/[",\n]/.test(s)) ? '"'+s.replace(/"/g,'""')+'"' : s
    }).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const pf = loans.value.platform?.name || loans.value.platform?.code || 'Platform'
    a.download = `${pf}-Ledger-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch {}
}

function onDrawerTabChange(name){
  if (name === 'expenses') loadExpenses()
}
async function loadExpenses(){
  if (!loans.value.platform?.id) return
  loans.value.loadingExpenses = true
  try{
    const res = await api.buyfx.listPlatformExpenses(loans.value.platform.id)
    loans.value.expenses = Array.isArray(res?.items) ? res.items : []
  }catch(e){
    ElMessage.error(e?.message || '加载失败')
  }finally{
    loans.value.loadingExpenses = false
  }
}
const expensesShown = computed(() => {
  const cur = String(loans.value.currency||'ALL').toUpperCase()
  if (cur === 'ALL') return loans.value.expenses
  return (loans.value.expenses||[]).filter(r => String(r.currency).toUpperCase()===cur)
})
function exportExpensesCsv(){
  try{
    const rows = expensesShown.value || []
    const header = ['Payment ID','Bill No','Customer','Date','Currency','Amount','Fee','Total']
    const body = rows.map(r => [r.payment_id, r.bill_no||'', r.customer_name||'', (r.acted_at||'').slice(0,19), r.currency||'', r.amount, r.fee, r.total])
    const csvRows = [header, ...body]
    const csv = csvRows.map(r => r.map(v => {
      const s = v==null? '': String(v)
      return (/[",\n]/.test(s)) ? '"'+s.replace(/"/g,'""')+'"' : s
    }).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const pf = loans.value.platform?.name || loans.value.platform?.code || 'Platform'
    a.download = `${pf}-Expenses-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }catch{}
}
</script>

<style scoped>
.fx-buy { padding: 8px; }
.buy-form { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; align-items:center; margin-bottom:8px; }
@media (max-width: 1200px){ .buy-form { grid-template-columns: 1fr; } }
.convert-form { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; align-items:center; margin: 8px 0; }
@media (max-width: 1200px){ .convert-form { grid-template-columns: 1fr; } }
/* 平台卡片列表 */
.platform-list { display: flex; flex-direction: column; gap: 10px; max-height: 40vh; overflow:auto; padding-right: 2px; }
.platform-card { border: 1px solid var(--el-border-color); border-radius: 10px; padding: 12px; background: var(--el-fill-color-blank); transition: box-shadow .2s ease, border-color .2s ease; }
.platform-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); border-color: color-mix(in oklab, var(--el-border-color) 70%, var(--el-color-primary) 30%); }
.platform-card__header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
.platform-card .title { display:flex; align-items:center; gap:10px; }
.platform-card .index { color: var(--el-text-color-secondary); font-weight: 600; }
.platform-card .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color: var(--el-text-color-secondary); }
.platform-card .name { font-weight: 700; }
.platform-card__body { display:flex; flex-direction:column; gap:6px; }
.platform-card .row { display:flex; align-items:center; gap:8px; }
.platform-card .label { flex: 0 0 108px; color: var(--el-text-color-secondary); }
.platform-card .value { flex: 1; }
.platform-card .value.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
.platform-card .value.link { color: var(--el-color-primary); word-break: break-all; }
.empty { text-align:center; color: var(--el-text-color-secondary); padding: 16px 0; }
@media (max-width: 1200px){ .platform-card .label { flex-basis: 96px; } }
</style>

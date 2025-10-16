<template>
  <div class="fx-page">
    <div class="page-hd">
      <h1>{{ t('fx.title') }}</h1>
    </div>

    <div class="fx-split">
      <el-card class="section left" shadow="never">
        <template #header>
          <div class="section-hd" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span>{{ t('fx.settlementArea') }}</span>
            <el-button type="text" @click="$router.push({ name: 'fx-settlements' })">{{ t('fx.viewHistory') }}</el-button>
          </div>
        </template>
        <div class="settle-filters">
          <el-date-picker v-model="settleDate" type="date" :placeholder="t('fx.settleDate')" value-format="YYYY-MM-DD" />
          <el-input-number v-model="rate" :precision="6" :step="0.01" :min="0" :placeholder="t('fx.rate')" />
          <!-- 税率只读：来自客户管理，按百分比(0-100)显示；计算时转换为系数 -->
          <el-input-number v-model="customerTaxRate" :precision="3" :step="0.001" :min="0" :max="100" :placeholder="t('fx.customerTaxRate')" :controls="false" disabled />
          <el-select v-model="customerId" filterable clearable :placeholder="t('fx.selectCustomer')" style="min-width:240px" @change="onCustomerChangeSettle">
            <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="(c.abbr ? (c.abbr + ' · ') : '') + c.name" />
          </el-select>
          <span class="balance">MYR {{ money(myrBalance) }}</span>
          <el-button type="primary" :disabled="!canCreateSettlement" @click="createSettlement">{{ t('fx.createSettlement') }}</el-button>
        </div>
        <div class="totals">
          <span>{{ t('fx.selectedBase') }}: {{ money(selectedBaseTotal) }}</span>
          <span>{{ t('fx.selectedSettled') }}: {{ money(selectedSettledTotal) }}</span>
        </div>
  <el-table ref="settleTableRef" :data="matchedRows" size="small" border @selection-change="onSelMatchedChange" @header-dragend="onColResizeSettle">
    <el-table-column type="selection" width="48" :selectable="isSettleSelectable" />
          <el-table-column prop="trn_date" column-key="trn_date" :label="t('transactions.transactionDate')" :width="colWSettle('trn_date',120)" />
          <el-table-column prop="cheque_ref_no" column-key="cheque_ref_no" :label="t('transactions.chequeRefNo')" :width="colWSettle('cheque_ref_no',140)" />
          <el-table-column prop="account_number" column-key="account_number" :label="t('transactions.accountNumber')" :width="colWSettle('account_number',160)" />
          <el-table-column prop="account_name" column-key="account_name" :label="t('transactions.accountName')" :width="colWSettle('account_name',180)" />
          <el-table-column column-key="bank_logo" :label="t('transactions.bankName')" :width="colWSettle('bank_logo',100)" align="center">
            <template #default="{ row }">
              <div class="bank-cell">
                <img v-show="!logoFail[logoKey(row)]" :src="resolveLogo(row)" alt="bank" class="bank-logo" @error="onLogoError($event, row)" />
                <span v-show="logoFail[logoKey(row)]" class="bank-text">{{ (row.bank_code || row.bank_name_en || row.bank_name || '').toUpperCase().slice(0,6) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="credit_amount" column-key="credit_amount" :label="t('transactions.creditAmount')" :width="colWSettle('credit_amount',120)" align="right">
            <template #default="{ row }">{{ money(row.credit_amount) }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="section right" shadow="never">
        <template #header>
          <div class="section-hd" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span>{{ t('fx.paymentArea') }}</span>
            <el-button type="text" @click="$router.push({ name: 'fx-payments' })">{{ t('fx.viewHistory') }}</el-button>
          </div>
        </template>
        <div class="pay-filters">
          <el-date-picker v-model="payDate" type="date" :placeholder="t('fx.payDate')" value-format="YYYY-MM-DD" />
          <el-select v-model="payCustomerId" filterable clearable :placeholder="t('fx.selectCustomer')" style="min-width:240px" @change="onCustomerChangePay">
            <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="(c.abbr ? (c.abbr + ' · ') : '') + c.name" />
          </el-select>
          <span class="balance">CNY {{ money(cnyBalance) }}</span>
          <el-button type="primary" :disabled="!canCreatePayment" @click="createPayment">{{ t('fx.createPayment') }}</el-button>
        </div>
        <div class="totals">
          <span>{{ t('fx.paymentTotal') }}: {{ money(paymentTotal) }}</span>
          <span v-if="overBudget" style="color: var(--el-color-danger);">{{ t('fx.errExceedBalance') }}</span>
        </div>
  <el-table ref="payTableRef" :data="accounts" size="small" border @selection-change="onSelAccountsChange" @header-dragend="onColResizePay">
          <el-table-column type="selection" width="48" />
          <!-- 提交日期（使用右侧筛选的 payDate 展示） -->
          <el-table-column column-key="pay_date" :label="t('fx.payDate')" :width="colWPay('pay_date',140)">
            <template #default>
              <span>{{ payDate }}</span>
            </template>
          </el-table-column>
          <!-- 账户名称 -->
          <el-table-column prop="account_name" column-key="account_name" :label="t('customers.accounts.accountName')" :width="colWPay('account_name',200)" />
          <!-- 银行名称（中文）+ Logo 同列显示 -->
          <el-table-column column-key="bank" :label="t('customers.accounts.bank')" :width="colWPay('bank',220)">
            <template #default="{ row }">
              <div class="bank-cell" style="justify-content:flex-start; gap:8px;">
                <img v-show="!logoFail[logoKey(row)]" :src="resolveLogo(row)" alt="bank" class="bank-logo" @error="onLogoError($event, row)" />
                <span v-show="logoFail[logoKey(row)]" class="bank-text">{{ (row.bank_code || '').toUpperCase().slice(0,6) }}</span>
                <span style="font-weight:600;">{{ row.bank_zh || row.bank_name || '' }}</span>
              </div>
            </template>
          </el-table-column>
          <!-- 银行账户 -->
          <el-table-column prop="bank_account" column-key="bank_account" :label="t('customers.accounts.bankAccount')" :width="colWPay('bank_account',200)" />
          <!-- 币种 -->
          <el-table-column prop="currency_code" column-key="currency_code" :label="t('customers.accounts.currency')" :width="colWPay('currency_code',120)" />
          <!-- 金额（默认空，不显示0.00） -->
          <el-table-column column-key="amount" :label="t('fx.amount')" :width="colWPay('amount',160)">
            <template #default="{ row }">
              <el-input-number v-model="row._amount" :precision="2" :min="0" :step="100" :placeholder="t('common.input')" style="width:140px" @change="() => onAmountChange(row)" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import { useTableMemory } from '@/composables/useTableMemory'

const { t } = useI18n()

const customers = ref([])
const settleDate = ref('')
const customerId = ref(null)
// 税率（百分比0-100），只读：从客户管理读取
const customerTaxRate = ref(0)
const rate = ref(null)
const matchedRows = ref([])
const selMatched = ref([])

const payCustomerId = ref(null)
const payDate = ref('')
const accounts = ref([])
const selAccounts = ref([])

const { colW: colWSettle, onColResize: onColResizeSettle } = useTableMemory('fx-mgmt-settlement')
const { colW: colWPay, onColResize: onColResizePay } = useTableMemory('fx-mgmt-payment')
const payTableRef = ref(null)

const canCreateSettlement = computed(() => !!(settleDate.value && customerId.value && rate.value && selMatched.value.length))
const overBudget = computed(() => paymentTotal.value > Number(cnyBalance.value || 0))
const canCreatePayment = computed(() => !!(payDate.value && payCustomerId.value && accounts.value.some(a => Number(a._amount) > 0) && !overBudget.value))

const selectedBaseTotal = computed(() => selMatched.value.reduce((s, r) => s + (Number(r.credit_amount || 0) - Number(r.debit_amount || 0)), 0))
// 百分比(0-100) -> 系数(0-1)，兼容传入即为系数(<=1)的情况
function percentToFactor(p){
  const n = Number(p || 0)
  if (!isFinite(n) || n < 0) return 0
  const f = 1 - n / 100
  return Math.max(0, Math.min(1, Math.round(f * 1000) / 1000))
}
// 折算总计 = 勾选金额 × 系数 × 汇率，四舍五入到元
const selectedSettledTotal = computed(() => {
  const base = selectedBaseTotal.value
  const taxFactor = percentToFactor(customerTaxRate.value)
  const r = Number(rate.value || 0)
  return Math.round(base * taxFactor * r)
})
const paymentTotal = computed(() => accounts.value.reduce((s, a) => s + (Number(a._amount || 0) > 0 ? Number(a._amount || 0) : 0), 0))

const selectedCustomer = computed(() => customers.value.find(c => c.id === customerId.value) || null)
const myrBalance = computed(() => Number(selectedCustomer.value?.balance_myr || 0))
const selectedPayCustomer = computed(() => customers.value.find(c => c.id === payCustomerId.value) || null)
const cnyBalance = computed(() => Number(selectedPayCustomer.value?.balance_cny || 0))

function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

async function loadCustomers(){
  const res = await api.customers.list({ pageSize: 1000 })
  customers.value = res.items || []
}

function normalizePercent(v){
  let n = Number(v || 0)
  if (!isFinite(n) || n < 0) n = 0
  if (n > 100) n = 100
  return Math.round(n * 1000) / 1000
}

async function loadMatched(){
  matchedRows.value = []
  customerTaxRate.value = 0
  if (!customerId.value) return
  // 获取该客户已匹配交易（表2）
  const data = await api.transactionsByCustomer(customerId.value, { pageSize: 1000, excludeSettled: 1 })
  matchedRows.value = Array.isArray(data?.data) ? data.data : []
  selMatched.value = []
  // 读取客户税率
  const found = customers.value.find(c => c.id === customerId.value)
  customerTaxRate.value = normalizePercent(found?.tax_rate)
}

function formatToday(){
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

function onCustomerChangeSettle(){
  loadMatched()
}
function onCustomerChangePay(){
  loadAccounts()
}

async function createSettlement(){
  // 创建前刷新客户列表，确保拿到最新税率（修改后稍等推送）
  await loadCustomers()
  const latest = customers.value.find(c => c.id === customerId.value)
  customerTaxRate.value = normalizePercent(latest?.tax_rate)
  if (!selMatched.value.length) return
  const baseSum = selectedBaseTotal.value
  // 校验余额：按所选明细全额
  if (baseSum <= 0) { ElMessage.error(t('fx.errNothingToSettle')); return }
  if (baseSum > myrBalance.value) { ElMessage.error(t('fx.errExceedBalance')); return }

  const r = Number(rate.value || 0)
  if (!r || r <= 0) { ElMessage.error(t('fx.errRateRequired')); return }

  // 全额：按所选明细全额，各自折算四舍五入到元
  const taxFactor = percentToFactor(customerTaxRate.value)
  const items = selMatched.value.map(row => {
    const base = Number(row.credit_amount||0) - Number(row.debit_amount||0)
    return {
      transaction_id: row.id,
      account_number: row.account_number,
      trn_date: row.trn_date || row.transaction_date,
      amount_base: base,
      amount_settled: Math.round(base * taxFactor * r)
    }
  })
  const found = customers.value.find(c => c.id === customerId.value)
  await api.fx.settlements.create({
    customer_id: customerId.value,
    customer_name: found?.name || null,
    settle_date: settleDate.value,
    rate: rate.value,
    // 税率由后端根据 customer_id 查询，前端不再传递
    items
  })
  ElMessage.success(t('fx.settlementCreated', { n: items.length, base: money(selectedBaseTotal.value), settled: money(selectedSettledTotal.value) }))
  // 清空并刷新
  selMatched.value = []
  // 重新加载列表并排除已结汇交易
  await loadMatched()
  settleDate.value = formatToday()
  rate.value = null
  customerTaxRate.value = 0
  // 重新加载客户匹配交易（若仍保留客户）
  await loadCustomers()
}

async function loadAccounts(){
  accounts.value = []
  if (!payCustomerId.value) return
  const list = await api.customerAccounts.list(payCustomerId.value)
  accounts.value = (list || []).map(it => ({ ...it, _amount: null }))
  selAccounts.value = []
}

async function createPayment(){
  const found = customers.value.find(c => c.id === payCustomerId.value)
  if (paymentTotal.value > Number(cnyBalance.value || 0)) {
    ElMessage.error(t('fx.errExceedBalance'))
    return
  }
  const resp = await api.fx.payments.create({
    customer_id: payCustomerId.value,
    customer_name: found?.name || null,
    pay_date: payDate.value,
    split: true,
    items: accounts.value.filter(a => Number(a._amount) > 0).map(a => ({
      account_id: a.id,
      account_name: a.account_name,
      bank_account: a.bank_account,
      currency_code: a.currency_code,
      amount: a._amount
    }))
  })
  const n = Array.isArray(resp?.ids) ? resp.ids.length : accounts.value.filter(a => Number(a._amount) > 0).length
  ElMessage.success(t('fx.paymentCreated', { n, total: money(paymentTotal.value) }))
  // 清空并刷新
  payDate.value = formatToday()
  accounts.value = accounts.value.map(a => ({ ...a, _amount: null }))
  selAccounts.value = []
  await loadCustomers()
  if (payCustomerId.value) await loadAccounts()
}

onMounted(() => {
  settleDate.value = formatToday()
  payDate.value = formatToday()
  loadCustomers()
})

function onSelMatchedChange(val){
  const MAX = 8
  if (!Array.isArray(val)) { selMatched.value = []; return }
  if (val.length <= MAX) { selMatched.value = val; return }
  // 超限：撤销新增加的条目（或多余的尾部）
  const prevIds = new Set((selMatched.value || []).map(r => r.id))
  const added = val.filter(r => !prevIds.has(r.id))
  const overflow = val.length - MAX
  const toUnselect = (added.length ? added.slice(-overflow) : val.slice(MAX))
  if (settleTableRef.value && typeof settleTableRef.value.toggleRowSelection === 'function') {
    toUnselect.forEach(r => settleTableRef.value.toggleRowSelection(r, false))
  }
  selMatched.value = val.filter(r => !toUnselect.includes(r)).slice(0, MAX)
  ElMessage.warning(t('fx.maxSelectionTip', { n: MAX }))
}
function isRowSelected(row){
  return (selAccounts.value || []).some(r => r.id === row.id)
}
function toggleRowSelection(row, selected){
  if (!payTableRef.value || typeof payTableRef.value.toggleRowSelection !== 'function') return
  payTableRef.value.toggleRowSelection(row, selected)
}
function onSelAccountsChange(val){
  const prev = new Set((selAccounts.value || []).map(r => r.id))
  selAccounts.value = val || []
  const now = new Set((selAccounts.value || []).map(r => r.id))
  // 取消勾选的行：清空金额
  const removedIds = [...prev].filter(id => !now.has(id))
  if (removedIds.length) {
    accounts.value.forEach(a => { if (removedIds.includes(a.id)) a._amount = null })
  }
  // 单选时自动填充余额（仅当余额>0，且该行未填）
  const added = (selAccounts.value || []).filter(r => !prev.has(r.id))
  if ((selAccounts.value || []).length === 1 && added.length === 1) {
    const row = added[0]
    const bal = Number(cnyBalance.value || 0)
    if (bal > 0 && (!row._amount || Number(row._amount) === 0)) {
      row._amount = Math.max(0, Math.round(bal * 100) / 100)
    }
  }
}
function onAmountChange(row){
  const n = Number(row._amount || 0)
  if (n > 0) {
    if (!isRowSelected(row)) toggleRowSelection(row, true)
  } else {
    // 金额为 0 或空：清空并取消勾选
    row._amount = null
    if (isRowSelected(row)) toggleRowSelection(row, false)
  }
}

// ---- 银行 logo 本地解析：统一从 /banks/<code>.(svg|png|jpg) 读取 ----
const logoFail = ref({})
function logoKey(row){ return (row.bank_code || row.bank_name_en || row.bank_name || 'unknown').toLowerCase() }
function resolveLogo(row){
  const key = logoKey(row)
  if (logoFail.value[key]) return ''
  const code = (row.bank_code || '').toLowerCase()
  if (!code) return ''
  return `/banks/${code}.svg`
}
function onLogoError(evt, row){
  const key = logoKey(row)
  const cur = evt?.target?.getAttribute('src') || ''
  // 依次尝试 svg -> png -> jpg
  if (/\.svg$/i.test(cur)) evt.target.setAttribute('src', cur.replace(/\.svg$/i, '.png'))
  else if (/\.png$/i.test(cur)) evt.target.setAttribute('src', cur.replace(/\.png$/i, '.jpg'))
  else logoFail.value[key] = true
}

// 结汇区选择上限：未达上限时可选，达到上限后仅允许取消已选项
const settleTableRef = ref(null)
function isSettleSelectable(row){
  const MAX = 8
  const selected = selMatched.value || []
  return selected.length < MAX || selected.some(r => r.id === row.id)
}
</script>

<style scoped>
 .fx-page { padding: 8px; }
 .page-hd { display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 8px; }
 .fx-split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
 .section-hd { font-weight: 700; }
 .settle-filters, .pay-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; align-items:center; }
  .totals { display:flex; gap:16px; margin: 4px 0 8px; color: var(--el-text-color-secondary); font-size: 13px; }
  .balance { color: var(--el-text-color-regular); font-weight: 600; }
  .bank-cell { display:flex; align-items:center; justify-content:center; height: 24px; }
  .bank-logo { max-width: 80px; max-height: 18px; object-fit: contain; display:inline-block; }
  .bank-text { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 600; letter-spacing: .5px; }
 @media (max-width: 1100px) { .fx-split { grid-template-columns: 1fr; } }
</style>

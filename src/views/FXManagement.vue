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
          <el-input-number v-model="customerTaxRate" :precision="2" :step="0.5" :min="0" :max="100" :placeholder="t('fx.customerTaxRate')" />
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
  <el-table :data="matchedRows" size="small" border @selection-change="onSelMatchedChange" @header-dragend="onColResizeSettle">
          <el-table-column type="selection" width="48" />
          <el-table-column prop="trn_date" column-key="trn_date" :label="t('transactions.transactionDate')" :width="colWSettle('trn_date',120)" />
          <el-table-column prop="account_number" column-key="account_number" :label="t('transactions.accountNumber')" :width="colWSettle('account_number',160)" />
          <el-table-column prop="account_name" column-key="account_name" :label="t('transactions.accountName')" :width="colWSettle('account_name',180)" />
          <el-table-column column-key="bank_logo" :label="t('transactions.bankName')" :width="colWSettle('bank_logo',80)" align="center">
            <template #default="{ row }">
              <img v-if="row.bank_logo" :src="row.bank_logo" alt="bank" class="bank-logo" />
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
        </div>
  <el-table :data="accounts" size="small" border @selection-change="onSelAccountsChange" @header-dragend="onColResizePay">
          <el-table-column type="selection" width="48" />
          <el-table-column prop="account_name" column-key="account_name" :label="t('customers.accounts.accountName')" :width="colWPay('account_name',200)" />
          <el-table-column column-key="bank_logo" :label="t('banks.title')" :width="colWPay('bank_logo',80)" align="center">
            <template #default="{ row }">
              <img v-if="row.bank_logo" :src="row.bank_logo" alt="bank" class="bank-logo" />
            </template>
          </el-table-column>
          <el-table-column prop="bank_account" column-key="bank_account" :label="t('customers.accounts.bankAccount')" :width="colWPay('bank_account',200)" />
          <el-table-column prop="currency_code" column-key="currency_code" :label="t('customers.accounts.currency')" :width="colWPay('currency_code',120)" />
          <el-table-column column-key="amount" :label="t('fx.amount')" :width="colWPay('amount',160)">
            <template #default="{ row }">
              <el-input-number v-model="row._amount" :precision="2" :min="0" :step="100" style="width:140px" />
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

const canCreateSettlement = computed(() => !!(settleDate.value && customerId.value && rate.value && selMatched.value.length))
const canCreatePayment = computed(() => !!(payDate.value && payCustomerId.value && accounts.value.some(a => a._amount > 0)))

const selectedBaseTotal = computed(() => selMatched.value.reduce((s, r) => s + (Number(r.credit_amount || 0) - Number(r.debit_amount || 0)), 0))
const selectedSettledTotal = computed(() => Math.round((selectedBaseTotal.value * Number(rate.value || 0))))
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
  customerTaxRate.value = Number(found?.tax_rate || 0)
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
  if (!selMatched.value.length) return
  const baseSum = selectedBaseTotal.value
  // 校验余额：按所选明细全额
  if (baseSum <= 0) { ElMessage.error(t('fx.errNothingToSettle')); return }
  if (baseSum > myrBalance.value) { ElMessage.error(t('fx.errExceedBalance')); return }

  const r = Number(rate.value || 0)
  if (!r || r <= 0) { ElMessage.error(t('fx.errRateRequired')); return }

  // 全额：按所选明细全额，各自折算四舍五入到元
  const items = selMatched.value.map(r => {
    const base = Number(r.credit_amount||0) - Number(r.debit_amount||0)
    return {
      transaction_id: r.id,
      account_number: r.account_number,
      trn_date: r.trn_date || r.transaction_date,
      amount_base: base,
      amount_settled: Math.round(base * r)
    }
  })
  const found = customers.value.find(c => c.id === customerId.value)
  await api.fx.settlements.create({
    customer_id: customerId.value,
    customer_name: found?.name || null,
    settle_date: settleDate.value,
    rate: rate.value,
    customer_tax_rate: customerTaxRate.value,
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
  accounts.value = (list || []).map(it => ({ ...it, _amount: 0 }))
  selAccounts.value = []
}

async function createPayment(){
  const found = customers.value.find(c => c.id === payCustomerId.value)
  await api.fx.payments.create({
    customer_id: payCustomerId.value,
    customer_name: found?.name || null,
    pay_date: payDate.value,
    items: accounts.value.filter(a => Number(a._amount) > 0).map(a => ({
      account_id: a.id,
      account_name: a.account_name,
      bank_account: a.bank_account,
      currency_code: a.currency_code,
      amount: a._amount
    }))
  })
  const n = accounts.value.filter(a => Number(a._amount) > 0).length
  ElMessage.success(t('fx.paymentCreated', { n, total: money(paymentTotal.value) }))
  // 清空并刷新
  payDate.value = formatToday()
  accounts.value = accounts.value.map(a => ({ ...a, _amount: 0 }))
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
  selMatched.value = val || []
}
function onSelAccountsChange(val){
  selAccounts.value = val || []
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
  .bank-logo { width: 22px; height: 22px; object-fit: contain; display:inline-block; }
 @media (max-width: 1100px) { .fx-split { grid-template-columns: 1fr; } }
</style>

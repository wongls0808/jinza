<template>
  <div class="fx-page">
    <h1>{{ t('fx.title') }}</h1>

    <el-card class="section" shadow="never">
      <template #header>
        <div class="section-hd">{{ t('fx.settlementArea') }}</div>
      </template>
      <div class="settle-filters">
        <el-date-picker v-model="settleDate" type="date" :placeholder="t('fx.settleDate')" value-format="YYYY-MM-DD" />
        <el-select v-model="customerId" filterable clearable :placeholder="t('fx.selectCustomer')" style="min-width:260px" @change="loadMatched">
          <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
        <el-input-number v-model="rate" :precision="6" :step="0.01" :min="0" :placeholder="t('fx.rate')" />
        <el-input-number v-model="customerTaxRate" :precision="2" :step="0.5" :min="0" :max="100" :placeholder="t('fx.customerTaxRate')" />
        <el-button type="primary" :disabled="!canCreateSettlement" @click="createSettlement">{{ t('fx.createSettlement') }}</el-button>
      </div>
      <el-table :data="matchedRows" size="small" border>
        <el-table-column type="selection" width="48" />
        <el-table-column prop="trn_date" :label="t('transactions.transactionDate')" width="120" />
        <el-table-column prop="account_number" :label="t('transactions.accountNumber')" width="160" />
        <el-table-column prop="account_name" :label="t('transactions.accountName')" width="180" />
        <el-table-column prop="reference" :label="t('transactions.reference')" />
        <el-table-column prop="credit_amount" :label="t('transactions.creditAmount')" width="120" align="right">
          <template #default="{ row }">{{ money(row.credit_amount) }}</template>
        </el-table-column>
        <el-table-column prop="debit_amount" :label="t('transactions.debitAmount')" width="120" align="right">
          <template #default="{ row }">{{ money(row.debit_amount) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="section" shadow="never" style="margin-top:16px">
      <template #header>
        <div class="section-hd">{{ t('fx.paymentArea') }}</div>
      </template>
      <div class="pay-filters">
        <el-select v-model="payCustomerId" filterable clearable :placeholder="t('fx.selectCustomer')" style="min-width:260px" @change="loadAccounts">
          <el-option v-for="c in customers" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
        <el-date-picker v-model="payDate" type="date" :placeholder="t('fx.payDate')" value-format="YYYY-MM-DD" />
        <el-button type="primary" :disabled="!canCreatePayment" @click="createPayment">{{ t('fx.createPayment') }}</el-button>
      </div>
      <el-table :data="accounts" size="small" border>
        <el-table-column type="selection" width="48" />
        <el-table-column prop="account_name" :label="t('customers.accounts.accountName')" />
        <el-table-column prop="bank_account" :label="t('customers.accounts.bankAccount')" />
        <el-table-column prop="currency_code" :label="t('customers.accounts.currency')" width="120" />
        <el-table-column :label="t('fx.amount')" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row._amount" :precision="2" :min="0" :step="100" style="width:140px" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'

const { t } = useI18n()

const customers = ref([])
const settleDate = ref('')
const customerId = ref(null)
const customerTaxRate = ref(0)
const rate = ref(null)
const matchedRows = ref([])

const payCustomerId = ref(null)
const payDate = ref('')
const accounts = ref([])

const canCreateSettlement = computed(() => !!(settleDate.value && customerId.value && rate.value && matchedRows.value.length))
const canCreatePayment = computed(() => !!(payDate.value && payCustomerId.value && accounts.value.some(a => a._amount > 0)))

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
  const data = await api.transactionsByCustomer(customerId.value, { pageSize: 1000 })
  matchedRows.value = Array.isArray(data?.data) ? data.data : []
  // 读取客户税率
  const found = customers.value.find(c => c.id === customerId.value)
  customerTaxRate.value = Number(found?.tax_rate || 0)
}

async function createSettlement(){
  const items = matchedRows.value.map(r => ({
    transaction_id: r.id,
    account_number: r.account_number,
    trn_date: r.trn_date || r.transaction_date,
    amount_base: Number(r.credit_amount||0) - Number(r.debit_amount||0),
    amount_settled: (Number(r.credit_amount||0) - Number(r.debit_amount||0)) * Number(rate.value)
  }))
  const found = customers.value.find(c => c.id === customerId.value)
  await api.fx.settlements.create({
    customer_id: customerId.value,
    customer_name: found?.name || null,
    settle_date: settleDate.value,
    rate: rate.value,
    customer_tax_rate: customerTaxRate.value,
    items
  })
}

async function loadAccounts(){
  accounts.value = []
  if (!payCustomerId.value) return
  const list = await api.customerAccounts.list(payCustomerId.value)
  accounts.value = (list || []).map(it => ({ ...it, _amount: 0 }))
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
}

onMounted(loadCustomers)
</script>

<style scoped>
.fx-page { padding: 8px; }
.section-hd { font-weight: 700; }
.settle-filters, .pay-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; align-items:center; }
</style>

<template>
  <div class="page container">
    <div class="head">
      <div class="title">{{ t('receipts.title') }}</div>
      <div class="spacer"></div>
    </div>

    <el-card class="jelly" shadow="hover">
      <template #header>
        <div class="toolbar">
          <div class="hint">{{ t('receipts.hint') }}</div>
          <div class="spacer"></div>
          <el-upload
            :auto-upload="false"
            accept=".csv"
            :on-change="onFileChange"
          >
            <el-button type="primary">{{ t('receipts.selectCsv') }}</el-button>
          </el-upload>
          <el-divider direction="vertical" />
          <el-date-picker v-model="promoteRange" type="daterange" range-separator="-" :start-placeholder="t('transactions.startDate')" :end-placeholder="t('transactions.endDate')" value-format="YYYY-MM-DD" style="width: 280px" />
          <el-button :disabled="!result?.account?.account_number" @click="promote" type="success">{{ t('receipts.promote') }}</el-button>
        </div>
      </template>

      <el-descriptions v-if="result" :column="3" border class="summary">
        <el-descriptions-item :label="t('accountManagement.accountNumber')">{{ result.account?.account_number || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('transactions.accountName')">{{ result.account?.account_name || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.customer')">{{ result.account?.customer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('transactions.bankName')">
          <div class="bankcell" v-if="result.account?.bank_code">
            <img :src="bankImg(result.account.bank_code)" class="logo" @error="onBankImgErr($event)" />
            <span>{{ result.account.bank_code }}</span>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('receipts.parsedCount')">{{ result.totalParsed }}</el-descriptions-item>
        <el-descriptions-item :label="t('receipts.insertedCount')">{{ result.inserted }}</el-descriptions-item>
        <el-descriptions-item :label="t('receipts.duplicatesCount')">{{ result.duplicates }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="sample.length" class="sample">
        <div class="sample-title">{{ t('receipts.sampleTitle') }}</div>
        <el-table :data="sample" size="small" border>
          <el-table-column prop="account_number" :label="t('accountManagement.accountNumber')" />
          <el-table-column prop="trn_date" :label="t('accountManagement.transactionDate')" />
          <el-table-column prop="cheque_ref_no" :label="t('accountManagement.chequeRefNo')" />
          <el-table-column prop="debit_amount" :label="t('accountManagement.debitAmount')" align="right" />
          <el-table-column prop="credit_amount" :label="t('accountManagement.creditAmount')" align="right" />
          <el-table-column prop="reference1" :label="t('accountManagement.reference1')" />
          <el-table-column prop="reference2" :label="t('accountManagement.reference2')" />
          <el-table-column prop="reference3" :label="t('accountManagement.reference3')" />
        </el-table>
      </div>

      <el-divider />

      <div class="list-head">
        <div class="title small">{{ t('receipts.recordsTitle') }}</div>
        <div class="spacer"></div>
        <el-input v-model.trim="accountFilter" :placeholder="t('receipts.filterByAccountNumber')" clearable style="width:260px" @keyup.enter="load" @clear="load" />
      </div>
      <el-table :data="rows" size="small" border style="width:100%">
        <el-table-column prop="account_number" :label="t('accountManagement.accountNumber')" width="160" />
        <el-table-column prop="trn_date" :label="t('accountManagement.transactionDate')" width="120" />
        <el-table-column prop="cheque_ref_no" :label="t('accountManagement.chequeRefNo')" width="160" />
        <el-table-column prop="debit_amount" :label="t('accountManagement.debitAmount')" align="right" width="140" />
        <el-table-column prop="credit_amount" :label="t('accountManagement.creditAmount')" align="right" width="140" />
        <el-table-column prop="reference1" :label="t('accountManagement.reference1')" />
        <el-table-column prop="reference2" :label="t('accountManagement.reference2')" />
        <el-table-column prop="reference3" :label="t('accountManagement.reference3')" />
        <el-table-column :label="t('receipts.accountCustomer')" width="260">
          <template #default="{ row }">
            <div class="accinfo">
              <div class="line">
                <img :src="bankImg(row.bank_code)" class="logo" @error="onBankImgErr($event)" />
                <span class="name">{{ row.account_name || '-' }}</span>
                <span class="code">{{ row.bank_code || '' }}</span>
              </div>
              <div class="sub">{{ row.customer_name || t('receipts.unmatchedCustomer') }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10,20,50,100]"
          @current-change="load"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>
  </div>
  
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const { t } = useI18n()

const result = ref(null)
const sample = ref([])
const accountFilter = ref('')
const promoteRange = ref([])

const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

function onSizeChange(ps){ pageSize.value = ps; page.value = 1; load() }

function bankImg(code){
  const c = String(code||'public').toLowerCase()
  return `/banks/${c}.svg`
}
function onBankImgErr(e){
  const el = e?.target
  if (el && el.tagName === 'IMG') {
    const cur = el.getAttribute('src') || ''
    if (/\.svg$/i.test(cur)) el.src = cur.replace(/\.svg$/i, '.png')
    else if (/\.png$/i.test(cur)) el.src = cur.replace(/\.png$/i, '.jpg')
    else el.src = '/banks/public.svg'
  }
}

async function onFileChange(file) {
  try {
    const text = await file.raw.text()
    const r = await api.receipts.importText(text)
    result.value = r
    sample.value = r.sample || []
    accountFilter.value = r?.account?.account_number || ''
    if (r?.period?.from_date && r?.period?.to_date) promoteRange.value = [r.period.from_date, r.period.to_date]
    await load()
    ElMessage.success(t('receipts.importDone', { inserted: r.inserted, duplicates: r.duplicates }))
  } catch (e) {
    ElMessage.error(e?.message || t('receipts.importFailed'))
  }
}

async function load(){
  const resp = await api.receipts.list({ page: page.value, pageSize: pageSize.value, account_number: accountFilter.value || undefined })
  rows.value = resp.items || []
  total.value = resp.total || 0
}

async function promote(){
  if (!result.value?.account?.account_number) return
  const [start, end] = promoteRange.value || []
  try {
    const res = await fetch('/api/receipts/promote-to-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_number: result.value.account.account_number, start_date: start, end_date: end })
    })
    if (!res.ok) { const j = await res.json().catch(()=>({})); throw new Error(j?.error || res.statusText) }
    const data = await res.json()
    ElMessage.success(t('receipts.promoteDone', { total: data.total||0, inserted: data.inserted||0 }))
  } catch (e) {
    ElMessage.error(e?.message || t('receipts.promoteFailed'))
  }
}

// 初次不加载，等待用户导入或手动过滤
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; gap: 12px; margin: 8px 0; }
.title { font-size: 18px; font-weight: 700; }
.title.small { font-size: 14px; font-weight: 600; }
.toolbar { display:flex; align-items:center; gap:12px; }
.spacer { flex: 1; }
.bankcell { display: inline-flex; align-items: center; gap: 8px; }
.logo { width: 18px; height: 18px; object-fit: contain; }
.summary { margin-bottom: 12px; }
.sample { margin-top: 8px; }
.sample-title { font-weight: 600; margin: 8px 0; }
.list-head { display: flex; align-items: center; gap: 12px; margin: 12px 0; }
.accinfo { display: grid; gap: 2px; }
.accinfo .line { display: inline-flex; align-items: center; gap: 8px; }
.accinfo .name { font-weight: 600; }
.accinfo .code { color: var(--el-text-color-secondary); font-size: 12px; }
.accinfo .sub { color: var(--el-text-color-secondary); font-size: 12px; }
.hint { color: var(--el-text-color-secondary); font-size: 12px; }
</style>

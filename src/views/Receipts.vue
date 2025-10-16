<template>
  <div class="page container">
    <div class="head">
      <div class="title">银行对账单导入</div>
      <div class="spacer"></div>
    </div>

    <el-card class="jelly" shadow="hover">
      <template #header>
        <div class="toolbar">
          <div class="hint">仅支持银行官方CSV，系统将只读取以下字段：Account Number、Trn. Date、Cheque No/Ref No、Debit Amount、Credit Amount、Reference 1-3；导入时不会更改原文件。</div>
          <div class="spacer"></div>
          <el-upload
            :auto-upload="false"
            accept=".csv"
            :on-change="onFileChange"
          >
            <el-button type="primary">选择CSV文件</el-button>
          </el-upload>
          <el-divider direction="vertical" />
          <el-date-picker v-model="promoteRange" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px" />
          <el-button :disabled="!result?.account?.account_number" @click="promote" type="success">转入交易</el-button>
        </div>
      </template>

      <el-descriptions v-if="result" :column="3" border class="summary">
        <el-descriptions-item label="账户号码">{{ result.account?.account_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账户名称">{{ result.account?.account_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="对应客户">{{ result.account?.customer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行">
          <div class="bankcell" v-if="result.account?.bank_code">
            <img :src="bankImg(result.account.bank_code)" class="logo" @error="onBankImgErr($event)" />
            <span>{{ result.account.bank_code }}</span>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="解析条数">{{ result.totalParsed }}</el-descriptions-item>
        <el-descriptions-item label="成功导入">{{ result.inserted }}</el-descriptions-item>
        <el-descriptions-item label="重复跳过">{{ result.duplicates }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="sample.length" class="sample">
        <div class="sample-title">样例（前5行）</div>
        <el-table :data="sample" size="small" border>
          <el-table-column prop="account_number" label="Account Number" />
          <el-table-column prop="trn_date" label="Trn. Date" />
          <el-table-column prop="cheque_ref_no" label="Cheque No/Ref No" />
          <el-table-column prop="debit_amount" label="Debit Amount" align="right" />
          <el-table-column prop="credit_amount" label="Credit Amount" align="right" />
          <el-table-column prop="reference1" label="Reference 1" />
          <el-table-column prop="reference2" label="Reference 2" />
          <el-table-column prop="reference3" label="Reference 3" />
        </el-table>
      </div>

      <el-divider />

      <div class="list-head">
        <div class="title small">导入记录</div>
        <div class="spacer"></div>
        <el-input v-model.trim="accountFilter" placeholder="按 Account Number 过滤" clearable style="width:260px" @keyup.enter="load" @clear="load" />
      </div>
      <el-table :data="rows" size="small" border style="width:100%">
        <el-table-column prop="account_number" label="Account Number" width="160" />
        <el-table-column prop="trn_date" label="Trn. Date" width="120" />
        <el-table-column prop="cheque_ref_no" label="Cheque No/Ref No" width="160" />
        <el-table-column prop="debit_amount" label="Debit Amount" align="right" width="140" />
        <el-table-column prop="credit_amount" label="Credit Amount" align="right" width="140" />
        <el-table-column prop="reference1" label="Reference 1" />
        <el-table-column prop="reference2" label="Reference 2" />
        <el-table-column prop="reference3" label="Reference 3" />
        <el-table-column label="账户/客户" width="260">
          <template #default="{ row }">
            <div class="accinfo">
              <div class="line">
                <img :src="bankImg(row.bank_code)" class="logo" @error="onBankImgErr($event)" />
                <span class="name">{{ row.account_name || '-' }}</span>
                <span class="code">{{ row.bank_code || '' }}</span>
              </div>
              <div class="sub">{{ row.customer_name || '未匹配客户' }}</div>
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
import { ElMessage } from 'element-plus'
import { api } from '@/api'

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
    ElMessage.success(`导入完成：成功 ${r.inserted} 条，重复 ${r.duplicates} 条`)
  } catch (e) {
    ElMessage.error(e?.message || '导入失败')
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
    ElMessage.success(`转入完成：处理 ${data.total||0} 条，已写入 ${data.inserted||0} 条`)
  } catch (e) {
    ElMessage.error(e?.message || '转入失败')
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

<template>
  <div class="fx-buy">
  <h1>{{ t('buyfx.title') }}</h1>
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>{{ t('buyfx.platformSection') }}</span>
              <el-button size="small" type="primary" @click="openPlatformDialog()">{{ t('buyfx.addPlatform') }}</el-button>
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
                  <el-button size="small" @click="openPlatformDialog(p)">{{ t('buyfx.edit') }}</el-button>
                  <el-popconfirm :title="t('buyfx.confirmDelete')" @confirm="removePlatform(p)">
                    <template #reference>
                      <el-button size="small" type="danger">{{ t('buyfx.delete') }}</el-button>
                    </template>
                  </el-popconfirm>
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
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>{{ t('buyfx.title') }}</span>
            </div>
          </template>
          <div class="rate-bar">
            <span>{{ t('buyfx.liveRate') }}</span>
            <el-tag type="info">{{ liveRateText }}</el-tag>
            <el-button size="small" @click="refreshRate">{{ t('buyfx.refresh') }}</el-button>
          </div>
          <div class="buy-form">
            <el-select v-model="form.platform_id" filterable :placeholder="t('buyfx.placePlatform')">
              <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
            </el-select>
            <el-input v-model="form.customer_name" :placeholder="t('buyfx.customerName')" />
            <el-input-number v-model="form.amount_pay" :min="0" :step="1000" :precision="2" :placeholder="t('buyfx.amountPayCny')" />
            <el-input-number v-model="form.expected_rate" :min="0" :step="0.001" :precision="6" :placeholder="t('buyfx.expectedRate')" />
            <el-button type="primary" :disabled="!canSubmit" @click="submitOrder">{{ t('buyfx.submitBuy') }}</el-button>
          </div>
          <el-divider />
          <div class="convert-form">
            <el-select v-model="convert.platform_id" filterable :placeholder="t('buyfx.placePlatform')">
              <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
            </el-select>
            <el-select v-model="convert.from" :placeholder="t('buyfx.fromCurrency')">
              <el-option label="USD" value="USD"/>
              <el-option label="MYR" value="MYR"/>
              <el-option label="CNY" value="CNY"/>
            </el-select>
            <el-select v-model="convert.to" :placeholder="t('buyfx.toCurrency')">
              <el-option label="USD" value="USD"/>
              <el-option label="MYR" value="MYR"/>
              <el-option label="CNY" value="CNY"/>
            </el-select>
            <el-input-number v-model="convert.amount" :min="0" :precision="2" :step="100" :placeholder="t('buyfx.amountFrom')"/>
            <el-input-number v-model="convert.rate" :min="0" :precision="6" :step="0.0001" :placeholder="t('buyfx.rate')"/>
            <el-button type="warning" :disabled="!canConvert" @click="doConvert">{{ t('buyfx.convert') }}</el-button>
          </div>
          <div class="convert-hint" v-if="convertSummary">
            <el-alert type="info" :title="convertSummary" show-icon :closable="false" />
          </div>
          <el-table :data="orders" size="small" border height="38vh" style="margin-top:10px;">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="order_no" :label="t('buyfx.orderNo')" width="200" />
            <el-table-column prop="platform_name" :label="t('buyfx.platform')" />
            <el-table-column prop="amount_pay" :label="t('buyfx.amountCny')" width="140" align="right">
              <template #default="{ row }">{{ money(row.amount_pay) }}</template>
            </el-table-column>
            <el-table-column prop="expected_rate" :label="t('buyfx.expectedRate')" width="120" align="right" />
            <el-table-column prop="created_at" :label="t('buyfx.createdAt')" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="platformDialog.visible" :title="t('buyfx.dialogTitle')" width="560px">
      <el-form label-width="100px" :model="platformDialog.model">
        <el-form-item :label="t('buyfx.code')"><el-input v-model="platformDialog.model.code" /></el-form-item>
        <el-form-item :label="t('buyfx.name')"><el-input v-model="platformDialog.model.name" /></el-form-item>
        <el-form-item :label="t('buyfx.loginUrl')"><el-input v-model="platformDialog.model.login_url" placeholder="https://..." /></el-form-item>
        <el-form-item :label="t('buyfx.balanceUSD')"><el-input-number v-model="platformDialog.model.balance_usd" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item :label="t('buyfx.balanceMYR')"><el-input-number v-model="platformDialog.model.balance_myr" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item :label="t('buyfx.balanceCNY')"><el-input-number v-model="platformDialog.model.balance_cny" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item :label="t('buyfx.feePercent')"><el-input-number v-model="platformDialog.model.fee_percent" :min="0" :max="100" :precision="3" :step="0.1" /></el-form-item>
        <el-form-item :label="t('buyfx.contact')"><el-input v-model="platformDialog.model.contact" /></el-form-item>
        <el-form-item :label="t('buyfx.active')"><el-switch v-model="platformDialog.model.active" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="platformDialog.visible=false" :disabled="platformDialog.loading">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="savePlatform" :loading="platformDialog.loading">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const platforms = ref([])
const orders = ref([])
const rate = ref(null)
let timer = null

const liveRateText = computed(() => rate.value==null ? '—' : Number(rate.value||0).toFixed(6))

async function loadPlatforms(){
  const res = await api.buyfx.listPlatforms()
  platforms.value = Array.isArray(res?.items) ? res.items : []
}
async function loadOrders(){
  const res = await api.buyfx.listOrders()
  orders.value = Array.isArray(res?.items) ? res.items : []
}
async function refreshRate(){
  const r = await api.buyfx.getRate('CNY/MYR')
  rate.value = r?.rate ?? null
}
function startPolling(){
  stopPolling()
  timer = setInterval(refreshRate, 5000)
}
function stopPolling(){ if (timer) { clearInterval(timer); timer=null } }

const form = ref({ platform_id: null, customer_name: '', amount_pay: null, expected_rate: null })
const canSubmit = computed(() => Number(form.value.amount_pay||0) > 0 && !!form.value.platform_id)
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
function percent(v){
  const n = Number(v||0)
  if (!isFinite(n)) return '0%'
  return `${n.toFixed(3)}%`
}

async function submitOrder(){
  try {
    const payload = {
      platform_id: form.value.platform_id,
      customer_name: form.value.customer_name||null,
      amount_pay: Number(form.value.amount_pay||0),
      expected_rate: form.value.expected_rate==null? null : Number(form.value.expected_rate)
    }
    await api.buyfx.createOrder(payload)
    ElMessage.success(t('buyfx.buySubmitted'))
    form.value = { platform_id: null, customer_name: '', amount_pay: null, expected_rate: null }
    await loadOrders()
  } catch (e) {
    ElMessage.error(e?.message || t('buyfx.submitFailed'))
  }
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

onMounted(async () => { await loadPlatforms(); await loadOrders(); await refreshRate(); startPolling() })
onBeforeUnmount(stopPolling)

// 转换（平台内互换）
const convert = ref({ platform_id: null, from: 'CNY', to: 'MYR', amount: null, rate: null })
const canConvert = computed(() => !!convert.value.platform_id && convert.value.from && convert.value.to && convert.value.from!==convert.value.to && Number(convert.value.amount||0)>0 && Number(convert.value.rate||0)>0 )
const convertSummary = computed(() => {
  const p = platforms.value.find(x=>x.id===convert.value.platform_id)
  if (!p) return ''
  const feePct = Number(p.fee_percent||0)
  const amt = Number(convert.value.amount||0)
  const r = Number(convert.value.rate||0)
  if (!(amt>0) || !(r>0)) return ''
  const fee = amt * feePct / 100
  const toAmt = amt * r
  return `${t('buyfx.fee')}: ${money(fee)} | ${t('buyfx.amountTo')}: ${money(toAmt)}`
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
  }catch(e){
    ElMessage.error(e?.message || t('buyfx.convertFailed'))
  }
}
</script>

<style scoped>
.fx-buy { padding: 8px; }
.rate-bar { display:flex; gap:10px; align-items:center; margin-bottom: 8px; }
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

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
            <el-radio-group v-model="pair" size="small" @change="onPairChange">
              <el-radio-button label="MYR/USD">MYR = USD</el-radio-button>
              <el-radio-button label="MYR/CNY">MYR = CNY</el-radio-button>
              <el-radio-button label="USD/CNY">USD = CNY</el-radio-button>
            </el-radio-group>
            <el-tag type="info" effect="light">{{ bocRateText }}</el-tag>
            <el-button size="small" type="primary" text @click="fetchBocRate">{{ t('buyfx.refresh') }}</el-button>
          </div>
          <el-divider />
          <div class="convert-form">
            <el-select v-model="convert.platform_id" filterable :placeholder="t('buyfx.placePlatform')">
              <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
            </el-select>
            <el-select v-model="convert.from" :placeholder="t('buyfx.sellCurrency')">
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const platforms = ref([])
const rate = ref(null)
const pair = ref('MYR/CNY') // 默认：卖出 MYR 买入 CNY
const bocRate = ref(null)
let timer = null

const liveRateText = computed(() => rate.value==null ? '—' : Number(rate.value||0).toFixed(6))
const bocRateText = computed(() => bocRate.value==null ? '—' : Number(bocRate.value||0).toFixed(6))

async function loadPlatforms(){
  const res = await api.buyfx.listPlatforms()
  platforms.value = Array.isArray(res?.items) ? res.items : []
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

async function fetchBocRate(){
  // 优先 Huaji，失败回退 BOC，再失败回退本地存储 fx_rates
  try {
    const r1 = await api.buyfx.getHuajiRate(pair.value)
    bocRate.value = r1?.rate ?? null
    if (bocRate.value != null) return
  } catch {}
  try {
    const r = await api.buyfx.getBocRate(pair.value)
    bocRate.value = r?.rate ?? null
    if (bocRate.value != null) return
  } catch {}
  try {
    const r = await api.buyfx.getRate(pair.value)
    bocRate.value = r?.rate ?? null
  } catch { bocRate.value = null }
}
function onPairChange(){ fetchBocRate() }
watch(pair, () => { /* 冗余保障 */ fetchBocRate() })

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
  return `${n.toFixed(3)}%`
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

onMounted(async () => { await loadPlatforms(); await fetchBocRate() })
onBeforeUnmount(stopPolling)

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

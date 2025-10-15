<template>
  <div class="fx-buy">
    <h1>购汇管理</h1>
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>平台商管理</span>
              <el-button size="small" type="primary" @click="openPlatformDialog()">新增平台商</el-button>
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
                  <el-button size="small" @click="openPlatformDialog(p)">编辑</el-button>
                  <el-popconfirm title="确认删除？" @confirm="removePlatform(p)">
                    <template #reference>
                      <el-button size="small" type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
              <div class="platform-card__body">
                <div class="row"><span class="label">登陆网址</span><a :href="p.login_url" target="_blank" rel="noopener" class="value link" v-if="p.login_url">{{ p.login_url }}</a><span v-else class="value">-</span></div>
                <div class="row"><span class="label">美元余额</span><span class="value mono">{{ money(p.balance_usd) }}</span></div>
                <div class="row"><span class="label">马币余额</span><span class="value mono">{{ money(p.balance_myr) }}</span></div>
                <div class="row"><span class="label">人民币余额</span><span class="value mono">{{ money(p.balance_cny) }}</span></div>
                <div class="row"><span class="label">支付手续费%</span><span class="value">{{ percent(p.fee_percent) }}</span></div>
              </div>
            </div>
            <div v-if="!platforms.length" class="empty">暂无平台商</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>购汇下单</span>
            </div>
          </template>
          <div class="rate-bar">
            <span>实时汇率 (CNY/MYR)：</span>
            <el-tag type="info">{{ liveRateText }}</el-tag>
            <el-button size="small" @click="refreshRate">刷新</el-button>
          </div>
          <div class="buy-form">
            <el-select v-model="form.platform_id" filterable placeholder="平台商">
              <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
            </el-select>
            <el-input v-model="form.customer_name" placeholder="客户名称(可选)" />
            <el-input-number v-model="form.amount_pay" :min="0" :step="1000" :precision="2" placeholder="购汇金额(CNY)" />
            <el-input-number v-model="form.expected_rate" :min="0" :step="0.001" :precision="6" placeholder="预期汇率(CNY/MYR)" />
            <el-button type="primary" :disabled="!canSubmit" @click="submitOrder">提交下单</el-button>
          </div>
          <el-table :data="orders" size="small" border height="38vh" style="margin-top:10px;">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="order_no" label="订单号" width="200" />
            <el-table-column prop="platform_name" label="平台商" />
            <el-table-column prop="amount_pay" label="金额(CNY)" width="140" align="right">
              <template #default="{ row }">{{ money(row.amount_pay) }}</template>
            </el-table-column>
            <el-table-column prop="expected_rate" label="预期汇率" width="120" align="right" />
            <el-table-column prop="created_at" label="时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="platformDialog.visible" title="平台商" width="560px">
      <el-form label-width="100px" :model="platformDialog.model">
        <el-form-item label="代码"><el-input v-model="platformDialog.model.code" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="platformDialog.model.name" /></el-form-item>
        <el-form-item label="登陆网址"><el-input v-model="platformDialog.model.login_url" placeholder="https://..." /></el-form-item>
        <el-form-item label="美元余额"><el-input-number v-model="platformDialog.model.balance_usd" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item label="马币余额"><el-input-number v-model="platformDialog.model.balance_myr" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item label="人民币余额"><el-input-number v-model="platformDialog.model.balance_cny" :min="0" :precision="2" :step="100" /></el-form-item>
        <el-form-item label="支付手续费%"><el-input-number v-model="platformDialog.model.fee_percent" :min="0" :max="100" :precision="3" :step="0.1" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="platformDialog.model.contact" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="platformDialog.model.active" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="platformDialog.visible=false" :disabled="platformDialog.loading">取消</el-button>
        <el-button type="primary" @click="savePlatform" :loading="platformDialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const platforms = ref([])
const orders = ref([])
const rate = ref(null)
let timer = null

const liveRateText = computed(() => rate.value==null ? '—' : Number(rate.value||0).toFixed(6))

async function loadPlatforms(){
  const res = await api.fx.buyfx.listPlatforms()
  platforms.value = Array.isArray(res?.items) ? res.items : []
}
async function loadOrders(){
  const res = await api.fx.buyfx.listOrders()
  orders.value = Array.isArray(res?.items) ? res.items : []
}
async function refreshRate(){
  const r = await api.fx.buyfx.getRate('CNY/MYR')
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
    await api.fx.buyfx.createOrder(payload)
    ElMessage.success('已提交购汇')
    form.value = { platform_id: null, customer_name: '', amount_pay: null, expected_rate: null }
    await loadOrders()
  } catch (e) {
    ElMessage.error(e?.message || '提交失败')
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
  if (!m.name) { ElMessage.error('请输入名称'); return }
  platformDialog.value.loading = true
  try {
    await api.fx.buyfx.savePlatform({
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
    ElMessage.success('保存成功')
    platformDialog.value.visible = false
    await loadPlatforms()
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    platformDialog.value.loading = false
  }
}
async function removePlatform(row){
  try {
    await api.fx.buyfx.deletePlatform(row.id)
    ElMessage.success('已删除')
    await loadPlatforms()
  } catch (e) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(async () => { await loadPlatforms(); await loadOrders(); await refreshRate(); startPolling() })
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.fx-buy { padding: 8px; }
.rate-bar { display:flex; gap:10px; align-items:center; margin-bottom: 8px; }
.buy-form { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; align-items:center; margin-bottom:8px; }
@media (max-width: 1200px){ .buy-form { grid-template-columns: 1fr; } }
/* 平台卡片列表 */
.platform-list { display: flex; flex-direction: column; gap: 8px; max-height: 40vh; overflow:auto; }
.platform-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 10px; background: var(--el-fill-color-blank); }
.platform-card__header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
.platform-card .title { display:flex; align-items:center; gap:8px; }
.platform-card .index { color: var(--el-text-color-secondary); font-weight: 600; }
.platform-card .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color: var(--el-text-color-secondary); }
.platform-card .name { font-weight: 600; }
.platform-card__body { display:flex; flex-direction:column; gap:4px; }
.platform-card .row { display:flex; align-items:center; gap:8px; }
.platform-card .label { flex: 0 0 88px; color: var(--el-text-color-secondary); }
.platform-card .value { flex: 1; }
.platform-card .value.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
.platform-card .value.link { color: var(--el-color-primary); word-break: break-all; }
.empty { text-align:center; color: var(--el-text-color-secondary); padding: 16px 0; }
</style>

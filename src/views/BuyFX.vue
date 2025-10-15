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
          <el-table :data="platforms" size="small" border height="40vh">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="code" label="代码" width="120" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="contact" label="联系人" />
            <el-table-column prop="active" label="启用" width="80">
              <template #default="{ row }">
                <el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center">
              <template #default="{ row }">
                <el-button size="small" @click="openPlatformDialog(row)">编辑</el-button>
                <el-popconfirm title="确认删除？" @confirm="removePlatform(row)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
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

    <el-dialog v-model="platformDialog.visible" title="平台商" width="520px">
      <el-form label-width="90px">
        <el-form-item label="代码"><el-input v-model="platformDialog.model.code" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="platformDialog.model.name" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="platformDialog.model.contact" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="platformDialog.model.active" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="platformDialog.visible=false">取消</el-button>
        <el-button type="primary" @click="savePlatform">保存</el-button>
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

const platformDialog = ref({ visible:false, model: { id:null, code:'', name:'', contact:'', active:true } })
function openPlatformDialog(row){
  platformDialog.value.visible = true
  platformDialog.value.model = row ? { ...row } : { id:null, code:'', name:'', contact:'', active:true }
}
async function savePlatform(){
  const m = platformDialog.value.model
  if (!m.name) { ElMessage.error('请输入名称'); return }
  await api.fx.buyfx.savePlatform(m)
  platformDialog.value.visible = false
  await loadPlatforms()
}
async function removePlatform(row){
  await api.fx.buyfx.deletePlatform(row.id)
  await loadPlatforms()
}

onMounted(async () => { await loadPlatforms(); await loadOrders(); await refreshRate(); startPolling() })
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.fx-buy { padding: 8px; }
.rate-bar { display:flex; gap:10px; align-items:center; margin-bottom: 8px; }
.buy-form { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; align-items:center; margin-bottom:8px; }
@media (max-width: 1200px){ .buy-form { grid-template-columns: 1fr; } }
</style>

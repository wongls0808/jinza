<template>
  <div class="fx-buy-history">
    <div class="hdr">
      <h1>{{ t('buyfx.historyTitle') }}</h1>
      <el-button type="primary" link @click="$router.push({ name: 'fx-buy' })">{{ t('common.back') }}</el-button>
    </div>

    <el-card shadow="never">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>{{ t('buyfx.orderList') }}</span>
          <el-button size="small" @click="loadOrders" :loading="loading">{{ t('common.refresh') }}</el-button>
        </div>
      </template>

      <el-table :data="rows" size="small" border stripe>
        <el-table-column type="index" width="50"/>
        <el-table-column :label="t('buyfx.historyDate')" width="170">
          <template #default="{ row }">{{ fmtDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="platform_name" :label="t('buyfx.platform')" width="160"/>
        <el-table-column prop="from_currency" :label="t('buyfx.sellCurrency')" width="110"/>
        <el-table-column :label="t('buyfx.sellAmount')" width="140" align="right">
          <template #default="{ row }">{{ money(row.amount_from) }}</template>
        </el-table-column>
        <el-table-column :label="t('buyfx.rate')" width="120" align="right">
          <template #default="{ row }">{{ rate6(row.rate) }}</template>
        </el-table-column>
        <el-table-column prop="to_currency" :label="t('buyfx.buyCurrency')" width="110"/>
        <el-table-column :label="t('buyfx.buyAmount')" width="140" align="right">
          <template #default="{ row }">{{ money(row.amount_to) }}</template>
        </el-table-column>
        <el-table-column :label="t('buyfx.fromBalance')" width="180" align="right">
          <template #default="{ row }">{{ row.from_currency }} {{ money(row.balance_src_after) }}</template>
        </el-table-column>
        <el-table-column :label="t('buyfx.toBalance')" width="180" align="right">
          <template #default="{ row }">{{ row.to_currency }} {{ money(row.balance_dst_after) }}</template>
        </el-table-column>
        <el-table-column prop="created_by_name" :label="t('common.createdBy')" width="140"/>
        <el-table-column :label="t('common.actions')" width="160">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEdit(row)">{{ t('common.edit') }}</el-button>
            <el-popconfirm :title="t('buyfx.confirmDelete')" @confirm="onDelete(row)">
              <template #reference>
                <el-button size="small" text type="danger">{{ t('common.delete') }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && rows.length===0" class="empty">{{ t('common.empty') }}</div>
    </el-card>

    <el-dialog v-model="editDialog.visible" :title="t('common.edit')" width="520px">
      <el-form label-width="100px">
        <el-form-item :label="t('buyfx.platform')">
          <el-input v-model="editDialog.platform_name" disabled />
        </el-form-item>
        <el-form-item :label="t('buyfx.sellCurrency')">
          <el-select v-model="editDialog.from_currency" style="width: 140px">
            <el-option label="USD" value="USD" />
            <el-option label="MYR" value="MYR" />
            <el-option label="CNY" value="CNY" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('buyfx.buyCurrency')">
          <el-select v-model="editDialog.to_currency" style="width: 140px">
            <el-option label="USD" value="USD" />
            <el-option label="MYR" value="MYR" />
            <el-option label="CNY" value="CNY" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('buyfx.sellAmount')">
          <el-input v-model.number="editDialog.amount_from" type="number" />
        </el-form-item>
        <el-form-item :label="t('buyfx.rate')">
          <el-input v-model.number="editDialog.rate" type="number" />
        </el-form-item>
        <el-form-item :label="t('common.details')">
          <el-input v-model="editDialog.note" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible=false" :disabled="editDialog.loading">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveEdit" :loading="editDialog.loading">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'

const { t } = useI18n()
const loading = ref(false)
const rows = ref([])

function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
function rate6(v){ const n = Number(v||0); return n ? n.toFixed(6) : '' }
function fmtDate(s){
  try { const d = new Date(s); if (isNaN(d)) return s; const pad=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` } catch { return s }
}

async function loadOrders(){
  loading.value = true
  try {
    const res = await api.buyfx.listOrders()
    rows.value = Array.isArray(res?.items) ? res.items : []
  } finally {
    loading.value = false
  }
}

const editDialog = ref({ visible: false, loading: false, id: null, platform_name: '', from_currency: 'MYR', to_currency: 'CNY', amount_from: 0, rate: 0, note: '' })
function openEdit(row){
  editDialog.value = {
    visible: true,
    loading: false,
    id: row.id,
    platform_name: row.platform_name || '',
    from_currency: row.from_currency || 'MYR',
    to_currency: row.to_currency || 'CNY',
    amount_from: Number(row.amount_from||0),
    rate: Number(row.rate||0),
    note: row.note || ''
  }
}
async function saveEdit(){
  editDialog.value.loading = true
  try {
    const payload = {
      from_currency: editDialog.value.from_currency,
      to_currency: editDialog.value.to_currency,
      amount_from: editDialog.value.amount_from,
      rate: editDialog.value.rate,
      note: editDialog.value.note
    }
    await api.buyfx.updateOrder(editDialog.value.id, payload)
    editDialog.value.visible = false
    await loadOrders()
  } finally { editDialog.value.loading = false }
}
async function onDelete(row){
  await api.buyfx.deleteOrder(row.id)
  await loadOrders()
}

onMounted(loadOrders)
</script>


<style scoped>
.fx-buy-history { padding: 8px; }
.hdr { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
.empty { text-align:center; color: var(--el-text-color-secondary); padding: 12px 0; }
</style>

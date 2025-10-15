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
            <el-button size="small" text type="primary" @click="editNote(row)">{{ t('common.edit') }}</el-button>
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

async function editNote(row){
  const note = prompt(t('common.details'), row.note || '')
  if (note === null) return
  await api.buyfx.updateOrderNote(row.id, note)
  await loadOrders()
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

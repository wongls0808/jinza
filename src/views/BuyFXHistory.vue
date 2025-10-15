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
        <el-table-column prop="order_no" :label="t('buyfx.orderNo')" width="160"/>
        <el-table-column prop="platform_name" :label="t('buyfx.platform')" width="160"/>
        <el-table-column prop="customer_name" :label="t('buyfx.customer')" width="180"/>
        <el-table-column prop="pay_currency" :label="t('buyfx.payCurrency')" width="100"/>
        <el-table-column prop="buy_currency" :label="t('buyfx.buyCurrency')" width="100"/>
        <el-table-column :label="t('buyfx.amountPay')" width="140" align="right">
          <template #default="{ row }">{{ money(row.amount_pay) }}</template>
        </el-table-column>
        <el-table-column prop="expected_rate" :label="t('buyfx.expectedRate')" width="140" align="right">
          <template #default="{ row }">{{ rate6(row.expected_rate) }}</template>
        </el-table-column>
        <el-table-column prop="created_at" :label="t('common.createdAt')" width="180"/>
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

async function loadOrders(){
  loading.value = true
  try {
    const res = await api.buyfx.listOrders()
    rows.value = Array.isArray(res?.items) ? res.items : []
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.fx-buy-history { padding: 8px; }
.hdr { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
.empty { text-align:center; color: var(--el-text-color-secondary); padding: 12px 0; }
</style>

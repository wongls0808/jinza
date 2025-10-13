<template>
  <div class="page">
    <h1>{{ t('fx.settlementHistory') }}</h1>
    <el-table :data="rows" border size="small">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="customer_name" :label="t('customers.fields.name')" />
      <el-table-column prop="settle_date" :label="t('fx.settleDate')" width="130" />
      <el-table-column prop="rate" :label="t('fx.rate')" width="120" align="right" />
      <el-table-column prop="total_base" :label="t('fx.selectedBase')" width="160" align="right">
        <template #default="{ row }">{{ money(row.total_base) }}</template>
      </el-table-column>
      <el-table-column prop="total_settled" :label="t('fx.selectedSettled')" width="160" align="right">
        <template #default="{ row }">{{ money(row.total_settled) }}</template>
      </el-table-column>
      <el-table-column prop="created_at" :label="t('common.createdAt')" width="180" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
const { t } = useI18n()
const rows = ref([])
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
async function load(){ rows.value = await api.fx.settlements.list() }
onMounted(load)
</script>

<style scoped>
.page { padding: 8px; }
</style>

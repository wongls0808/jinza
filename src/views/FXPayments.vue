<template>
  <div class="page">
    <h1>{{ t('fx.paymentHistory') }}</h1>
    <el-table :data="rows" border size="small">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="customer_name" :label="t('customers.fields.name')" />
      <el-table-column prop="pay_date" :label="t('fx.payDate')" width="130" />
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
async function load(){ rows.value = await api.fx.payments.list() }
onMounted(load)
</script>

<style scoped>
.page { padding: 8px; }
</style>

<template>
  <div class="account-management">
    <h1>{{ t('accountManagement.title') }}</h1>

    <div class="actions">
      <el-button type="primary" @click="importCSV">{{ t('accountManagement.importCSV') }}</el-button>
    </div>

    <el-table :data="accounts" style="width: 100%">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="accountNumber" :label="t('accountManagement.accountNumber')"></el-table-column>
      <el-table-column prop="transactionDate" :label="t('accountManagement.transactionDate')"></el-table-column>
      <el-table-column prop="chequeRefNo" :label="t('accountManagement.chequeRefNo')"></el-table-column>
      <el-table-column prop="debitAmount" :label="t('accountManagement.debitAmount')"></el-table-column>
      <el-table-column prop="creditAmount" :label="t('accountManagement.creditAmount')"></el-table-column>
      <el-table-column prop="reference1" :label="t('accountManagement.reference1')"></el-table-column>
      <el-table-column prop="reference2" :label="t('accountManagement.reference2')"></el-table-column>
      <el-table-column prop="reference3" :label="t('accountManagement.reference3')"></el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const accounts = ref([])

const importCSV = () => {
  console.log('Import CSV functionality to be implemented')
}
</script>

<style scoped>
.account-management {
  padding: 16px;
}

.actions {
  margin-bottom: 16px;
}
</style>
<template>

  <div class="receipts-container">
    <el-upload
      class="upload-demo"
      drag
      action="/api/receipts/import"
      :show-file-list="false"
      :on-success="handleImportSuccess"
      :on-error="handleImportError"
      accept=".csv"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">拖拽或点击上传 CSV 文件</div>
    </el-upload>
    <el-table
      :data="receipts"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      ref="tableRef"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="account_number" label="Account Number" />
      <el-table-column prop="trn_date" label="Trn. Date" />
      <el-table-column prop="cheque_ref_no" label="Cheque No/Ref No" />
      <el-table-column prop="debit_amount" label="Debit Amount" />
      <el-table-column prop="credit_amount" label="Credit Amount" />
      <el-table-column prop="reference1" label="Reference 1" />
      <el-table-column prop="reference2" label="Reference 2" />
      <el-table-column prop="reference3" label="Reference 3" />
    </el-table>
    <el-button type="danger" @click="handleBatchDelete" :disabled="selected.length === 0">批量删除</el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const receipts = ref([])
const selected = ref([])
const tableRef = ref(null)

const fetchReceipts = async () => {
  try {
    const res = await axios.get('/api/receipts')
    receipts.value = res.data
  } catch (err) {
    ElMessage.error('获取数据失败')
  }
}

const handleSelectionChange = (val) => {
  selected.value = val
}

const handleBatchDelete = async () => {
  if (selected.value.length === 0) return
  try {
    await axios.post('/api/receipts/batch-delete', {
      ids: selected.value.map(item => item.id)
    })
    ElMessage.success('删除成功')
    fetchReceipts()
  } catch (err) {
    ElMessage.error('删除失败')
  }
}

const handleImportSuccess = (response) => {
  ElMessage.success('导入成功')
  fetchReceipts()
}

const handleImportError = () => {
  ElMessage.error('导入失败')
}

onMounted(fetchReceipts)
</script>

<style scoped>
.receipts-container {
  padding: 24px;
}
.upload-demo {
  margin-bottom: 16px;
}
</style>

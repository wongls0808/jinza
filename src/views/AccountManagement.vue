<template>
  <div class="account-management">
    <h1>{{ t('accountManagement.title') }}</h1>

    <div class="actions">
      <el-button type="primary" @click="triggerImportDialog">{{ t('accountManagement.importCSV') }}</el-button>
    </div>

    <el-table :data="accounts" style="width: 100%" v-loading="loading">
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
    
    <!-- CSV导入对话框 -->
    <el-dialog v-model="importDialogVisible" :title="t('accountManagement.importCSV')" width="600px">
      <el-upload
        class="upload-demo"
        drag
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        accept=".csv"
      >
        <el-icon><Upload /></el-icon>
        <div class="el-upload__text">
          拖拽CSV文件到此处或 <em>点击上传</em>
        </div>
      </el-upload>
      
      <div class="preview-container" v-if="previewData.length > 0">
        <h4>预览数据 (前5条):</h4>
        <el-table :data="previewData.slice(0, 5)" border size="small">
          <el-table-column v-for="(header, index) in previewHeaders" :key="index" :prop="header" :label="header"></el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitImport" :disabled="!csvData.length || submitting">
            {{ submitting ? '导入中...' : '确认导入' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import Papa from 'papaparse'

const { t } = useI18n()
const accounts = ref([])
const loading = ref(false)
const importDialogVisible = ref(false)
const fileList = ref([])
const csvData = ref([])
const previewData = ref([])
const previewHeaders = ref([])
const submitting = ref(false)

// 获取账户数据
const fetchAccounts = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/account-management')
    if (res.ok) {
      const data = await res.json()
      accounts.value = data
    } else {
      const error = await res.json()
      ElMessage.error(error.error || '获取数据失败')
    }
  } catch (err) {
    console.error('获取账户数据出错:', err)
    ElMessage.error('获取账户数据出错')
  } finally {
    loading.value = false
  }
}

// 打开导入对话框
const triggerImportDialog = () => {
  importDialogVisible.value = true
  fileList.value = []
  csvData.value = []
  previewData.value = []
  previewHeaders.value = []
}

// 处理文件变化
const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw
  
  if (!file) {
    return
  }
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.data && results.data.length) {
        csvData.value = results.data
        previewData.value = results.data
        
        // 设置表头
        if (results.data.length > 0) {
          previewHeaders.value = Object.keys(results.data[0])
        }
      } else {
        ElMessage.warning('CSV文件为空或格式不正确')
        csvData.value = []
        previewData.value = []
        previewHeaders.value = []
      }
    },
    error: (error) => {
      console.error('解析CSV出错:', error)
      ElMessage.error('解析CSV文件出错')
      csvData.value = []
      previewData.value = []
      previewHeaders.value = []
    }
  })
}

// 提交导入数据
const submitImport = async () => {
  if (!csvData.value.length) {
    ElMessage.warning('没有数据可导入')
    return
  }
  
  submitting.value = true
  
  try {
    const res = await fetch('/api/account-management/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rows: csvData.value })
    })
    
    if (res.ok) {
      const result = await res.json()
      ElMessage.success(`成功导入${result.inserted || 0}条数据`)
      importDialogVisible.value = false
      fetchAccounts()
    } else {
      const error = await res.json()
      ElMessage.error(error.error || '导入失败')
    }
  } catch (err) {
    console.error('导入出错:', err)
    ElMessage.error('导入出错')
  } finally {
    submitting.value = false
  }
}

// 页面加载时获取数据
fetchAccounts()
</script>

<style scoped>
.account-management {
  padding: 16px;
}

.actions {
  margin-bottom: 16px;
}

.preview-container {
  margin-top: 20px;
}

.upload-demo {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
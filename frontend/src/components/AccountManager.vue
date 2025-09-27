<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3>账套列表</h3>
      <el-button type="primary" @click="openAddDialog">新增账套</el-button>
    </div>
    <el-table :data="accounts" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="账套名称" />
      <el-table-column prop="code" label="账套编码" />
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="账套名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="账套编码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const accounts = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive({ id: null, name: '', code: '' })
const formRef = ref(null)
const rules = {
  name: [{ required: true, message: '请输入账套名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账套编码', trigger: 'blur' }],
}

function fetchAccounts() {
  loading.value = true
  fetch('/api/accounts')
    .then(res => res.json())
    .then(data => {
      accounts.value = data
    })
    .finally(() => {
      loading.value = false
    })
}

function openAddDialog() {
  dialogTitle.value = '新增账套'
  Object.assign(form, { id: null, name: '', code: '' })
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑账套'
  Object.assign(form, row)
  dialogVisible.value = true
}

function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    const method = form.id ? 'PUT' : 'POST'
    const url = form.id ? `/api/accounts/${form.id}` : '/api/accounts'
    const body = JSON.stringify({ name: form.name, code: form.code })
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    })
      .then(res => res.json())
      .then(() => {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        fetchAccounts()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该账套吗？', '提示', { type: 'warning' })
    .then(() => {
      loading.value = true
      fetch(`/api/accounts/${row.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
          ElMessage.success('删除成功')
          fetchAccounts()
        })
        .finally(() => {
          loading.value = false
        })
    })
}

onMounted(fetchAccounts)
</script>

<style scoped>
.el-table {
  margin-bottom: 16px;
}
</style>

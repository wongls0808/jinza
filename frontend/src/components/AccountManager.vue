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
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="账套名称" prop="name">
          <el-input v-model="form.name" @input="onNameInput" placeholder="自动转大写" />
        </el-form-item>
        <el-form-item label="账套编码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="注册号" prop="regNo">
          <el-input v-model="form.regNo" />
        </el-form-item>
        <el-form-item label="税号" prop="taxNo">
          <el-input v-model="form.taxNo" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="银行名称" prop="bankName">
          <el-input v-model="form.bankName" />
        </el-form-item>
        <el-form-item label="银行账号" prop="bankAccount">
          <el-input v-model="form.bankAccount" />
        </el-form-item>
        <el-form-item label="银行名称Ⅱ" prop="bankName2">
          <el-input v-model="form.bankName2" />
        </el-form-item>
        <el-form-item label="银行账户Ⅱ" prop="bankAccount2">
          <el-input v-model="form.bankAccount2" />
        </el-form-item>
        <el-form-item label="LOGO" prop="logo">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :show-file-list="false"
            :on-success="(res) => handleUploadSuccess(res, 'logo')"
            :before-upload="beforePngUpload"
          >
            <img v-if="form.logo" :src="form.logo" style="height:40px;vertical-align:middle;" />
            <el-button v-else size="small">上传LOGO</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="公章" prop="seal">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :show-file-list="false"
            :on-success="(res) => handleUploadSuccess(res, 'seal')"
            :before-upload="beforePngUpload"
          >
            <img v-if="form.seal" :src="form.seal" style="height:40px;vertical-align:middle;" />
            <el-button v-else size="small">上传公章</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="签名" prop="sign">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :show-file-list="false"
            :on-success="(res) => handleUploadSuccess(res, 'sign')"
            :before-upload="beforePngUpload"
          >
            <img v-if="form.sign" :src="form.sign" style="height:40px;vertical-align:middle;" />
            <el-button v-else size="small">上传签名</el-button>
          </el-upload>
        </el-form-item>
        <el-divider>高级设置</el-divider>
        <el-form-item label="打印模板">
          <el-button size="small" @click="openTemplateDialog">管理打印模板</el-button>
        </el-form-item>
        <el-form-item label="单号生成模板">
          <el-button size="small" @click="openSerialRuleDialog">设置单号生成规则</el-button>
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
const form = reactive({
  id: null,
  name: '',
  code: '',
  regNo: '',
  taxNo: '',
  phone: '',
  email: '',
  address: '',
  bankName: '',
  bankAccount: '',
  bankName2: '',
  bankAccount2: '',
  logo: '',
  seal: '',
  sign: ''
})
const formRef = ref(null)
const rules = {
  name: [{ required: true, message: '请输入账套名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账套编码', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}

function onNameInput(val) {
  form.name = val.toUpperCase()
}

function handleUploadSuccess(res, field) {
  // 假设后端返回 { url: 'xxx' }
  form[field] = res.url
}

function beforePngUpload(file) {
  const isPng = file.type === 'image/png'
  if (!isPng) {
    ElMessage.error('仅支持PNG格式')
  }
  return isPng
}

function openTemplateDialog() {
  ElMessage.info('打印模板管理开发中...')
}
function openSerialRuleDialog() {
  ElMessage.info('单号生成规则设置开发中...')
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
  Object.assign(form, {
    id: null, name: '', code: '', regNo: '', taxNo: '', phone: '', email: '', address: '', bankName: '', bankAccount: '', bankName2: '', bankAccount2: '', logo: '', seal: '', sign: ''
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑账套'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    regNo: row.regNo,
    taxNo: row.taxNo,
    phone: row.phone,
    email: row.email,
    address: row.address,
    bankName: row.bankName,
    bankAccount: row.bankAccount,
    bankName2: row.bankName2,
    bankAccount2: row.bankAccount2,
    logo: row.logo,
    seal: row.seal,
    sign: row.sign
  })
  dialogVisible.value = true
}

function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    const method = form.id ? 'PUT' : 'POST'
    const url = form.id ? `/api/accounts/${form.id}` : '/api/accounts'
    // 提交所有字段
    const body = JSON.stringify({
      name: form.name,
      code: form.code,
      regNo: form.regNo,
      taxNo: form.taxNo,
      phone: form.phone,
      email: form.email,
      address: form.address,
      bankName: form.bankName,
      bankAccount: form.bankAccount,
      bankName2: form.bankName2,
      bankAccount2: form.bankAccount2,
      logo: form.logo,
      seal: form.seal,
      sign: form.sign
    })
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

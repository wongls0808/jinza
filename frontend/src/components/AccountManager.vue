<template>
  <div>
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <el-button type="primary" size="large" style="font-weight:bold;letter-spacing:2px;box-shadow:0 2px 8px #409eff33;" @click="openAddDialog">
        <el-icon style="margin-right:6px"><Plus /></el-icon> 新增账套
      </el-button>
      <span style="font-size:18px;font-weight:bold;margin-left:24px;">账套管理</span>
    </div>
    <el-row :gutter="20" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in accounts" :key="item.id" style="margin-bottom: 20px;">
        <el-card class="account-card" shadow="hover">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:18px;font-weight:bold;">{{ item.name }}</div>
            <div>
              <el-button size="small" type="primary" circle @click="openEditDialog(item)"><el-icon><Edit /></el-icon></el-button>
              <el-button size="small" type="danger" circle @click="handleDelete(item)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
          <div style="color:#888;font-size:13px;margin-bottom:8px;">账套编码：{{ item.code }}</div>
          <el-divider style="margin:8px 0" />
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <img v-if="item.logo" :src="item.logo" style="height:32px;max-width:60px;object-fit:contain;border-radius:4px;" title="LOGO" />
            <img v-if="item.seal" :src="item.seal" style="height:32px;max-width:60px;object-fit:contain;border-radius:4px;" title="公章" />
            <img v-if="item.sign" :src="item.sign" style="height:32px;max-width:60px;object-fit:contain;border-radius:4px;" title="签名" />
          </div>
          <div class="card-info-row"><span>注册号：</span>{{ item.regNo }}</div>
          <div class="card-info-row"><span>税号：</span>{{ item.taxNo }}</div>
          <div class="card-info-row"><span>联系电话：</span>{{ item.phone }}</div>
          <div class="card-info-row"><span>邮箱：</span>{{ item.email }}</div>
          <div class="card-info-row"><span>地址：</span>{{ item.address }}</div>
          <div class="card-info-row"><span>银行名称：</span>{{ item.bankName }}</div>
          <div class="card-info-row"><span>银行账号：</span>{{ item.bankAccount }}</div>
          <div class="card-info-row"><span>银行名称Ⅱ：</span>{{ item.bankName2 }}</div>
          <div class="card-info-row"><span>银行账户Ⅱ：</span>{{ item.bankAccount2 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="字段信息" name="fields">
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
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="素材提交" name="assets">
          <div class="upload-row">
            <div class="upload-block">
              <div class="upload-label">LOGO</div>
              <el-upload
                class="upload-demo"
                action="/api/upload"
                :show-file-list="false"
                :on-success="(res) => handleUploadSuccess(res, 'logo')"
                :before-upload="beforePngUpload"
              >
                <el-button size="small">上传LOGO</el-button>
              </el-upload>
              <div v-if="form.logo" class="upload-preview"><img :src="form.logo" style="height:48px;max-width:120px;object-fit:contain;border-radius:4px;" /></div>
            </div>
            <div class="upload-block">
              <div class="upload-label">公章</div>
              <el-upload
                class="upload-demo"
                action="/api/upload"
                :show-file-list="false"
                :on-success="(res) => handleUploadSuccess(res, 'seal')"
                :before-upload="beforePngUpload"
              >
                <el-button size="small">上传公章</el-button>
              </el-upload>
              <div v-if="form.seal" class="upload-preview"><img :src="form.seal" style="height:48px;max-width:120px;object-fit:contain;border-radius:4px;" /></div>
            </div>
            <div class="upload-block">
              <div class="upload-label">签名</div>
              <el-upload
                class="upload-demo"
                action="/api/upload"
                :show-file-list="false"
                :on-success="(res) => handleUploadSuccess(res, 'sign')"
                :before-upload="beforePngUpload"
              >
                <el-button size="small">上传签名</el-button>
              </el-upload>
              <div v-if="form.sign" class="upload-preview"><img :src="form.sign" style="height:48px;max-width:120px;object-fit:contain;border-radius:4px;" /></div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="打印模板" name="template">
          <div>
            <el-upload
              class="upload-demo"
              action="/api/upload"
              :show-file-list="false"
              :on-success="(res) => handleTemplateUploadSuccess(res)"
              :before-upload="beforeTemplateUpload"
            >
              <el-button size="small" type="primary">上传打印模板</el-button>
            </el-upload>
            <div v-if="form.templates && form.templates.length" style="margin-top:16px;">
              <el-table :data="form.templates" border size="small" style="width:100%;">
                <el-table-column prop="name" label="文件名" />
                <el-table-column label="预览">
                  <template #default="scope">
                    <el-link type="primary" :href="scope.row.url" target="_blank">预览</el-link>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="scope">
                    <el-button size="small" type="danger" @click="removeTemplate(scope.$index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else style="color:#888;margin-top:12px;">暂无打印模板文件</div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="单号生成模板" name="serial">
          <el-alert title="单号生成规则设置开发中..." type="info" show-icon />
        </el-tab-pane>
      </el-tabs>
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

import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const activeTab = ref('fields')

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
  sign: '',
  templates: []
})
const formRef = ref(null)
const rules = {
  name: [{ required: true, message: '请输入账套名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账套编码', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

function beforeTemplateUpload(file) {
  const allowed = [ 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ]
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持PDF或Word文档')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('文件不能超过5MB')
    return false
  }
  return true
}

function removeTemplate(idx) {
  form.templates.splice(idx, 1)
}

function beforeTemplateUpload(file) {
  const allowed = [ 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ]
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持PDF或Word文档')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('文件不能超过5MB')
    return false
  }
  return true
}

function removeTemplate(idx) {
  form.templates.splice(idx, 1)
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
.account-card {
  border-radius: 14px;
  box-shadow: 0 4px 18px 0 rgba(0,0,0,0.06);
  transition: box-shadow .2s;
}
.account-card:hover {
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.12);
}
.card-info-row {
  font-size: 13px;
  color: #555;
  margin-bottom: 2px;
  display: flex;
  gap: 4px;
}

.upload-row {
  display: flex;
  margin-top: 24px;
  margin-bottom: 8px;
  justify-content: flex-start;
}
.upload-block {
  flex: 1 1 0%;
  min-width: 120px;
  max-width: 180px;
  padding-left: 8px;
  padding-right: 8px;
  border-right: 1px dashed #e4e7ed;
  text-align: center;
}
.upload-block:last-child {
  border-right: none;
}
.upload-label {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 15px;
}
.upload-preview {
  margin-top: 10px;
}

.upload-row {
  display: flex;
  margin-top: 24px;
  margin-bottom: 8px;
  justify-content: flex-start;
}
.upload-block {
  flex: 1 1 0%;
  min-width: 120px;
  max-width: 180px;
  padding-left: 8px;
  padding-right: 8px;
  border-right: 1px dashed #e4e7ed;
  text-align: center;
  margin-bottom: 18px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e4e7ed;
}
.upload-block:last-child {
  border-right: none;
}
.upload-label {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 15px;
}
.upload-preview {
  margin-top: 10px;
}
</style>

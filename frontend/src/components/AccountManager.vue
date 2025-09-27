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
                name="file"
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
                name="file"
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
                name="file"
              >
                <el-button size="small">上传签名</el-button>
              </el-upload>
              <div v-if="form.sign" class="upload-preview"><img :src="form.sign" style="height:48px;max-width:120px;object-fit:contain;border-radius:4px;" /></div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="打印模板" name="template">
          <div>
            <el-form :inline="true" style="margin-bottom:12px;">
              <el-form-item label="行业">
                <el-select v-model="templateIndustry" placeholder="选择行业" style="width:120px">
                  <el-option label="通用" value="common" />
                  <el-option label="制造业" value="manufacture" />
                  <el-option label="服务业" value="service" />
                  <el-option label="商贸业" value="trade" />
                </el-select>
              </el-form-item>
              <el-form-item label="模板类型">
                <el-select v-model="templateType" placeholder="选择类型" style="width:120px">
                  <el-option label="发票" value="invoice" />
                  <el-option label="收据" value="receipt" />
                  <el-option label="合同" value="contract" />
                </el-select>
              </el-form-item>
            </el-form>
            <el-upload
              class="upload-demo"
              action="/api/upload"
              :show-file-list="false"
              :on-success="(res) => handleTemplateUploadSuccess(res)"
              :before-upload="beforeTemplateUpload"
            >
              <el-button size="small" type="primary">上传打印模板</el-button>
            </el-upload>
            <div v-if="filteredTemplates.length" style="margin-top:16px;">
              <el-table :data="filteredTemplates" border size="small" style="width:100%;">
                <el-table-column prop="name" label="文件名" />
                <el-table-column prop="typeLabel" label="模板类型" />
                <el-table-column label="预览">
                  <template #default="scope">
                    <el-link type="primary" :href="scope.row.url" target="_blank">预览</el-link>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="scope">
                    <el-button size="small" type="danger" @click="removeTemplate(scope.$index, scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else style="color:#888;margin-top:12px;">暂无该行业/类型模板</div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="单号生成模板" name="serial">
          <div style="margin-bottom:12px;">
            <el-button size="small" type="primary" @click="addSerialRule">新增规则</el-button>
          </div>
          <el-tabs v-model="currentSerialIndex" type="card">
            <el-tab-pane
              v-for="(rule, idx) in serialRules"
              :key="idx"
              :label="industryOptions.find(i=>i.value===rule.industry)?.label + '-' + (serialTypeOptions.find(t=>t.value===rule.type)?.label||'')"
              :name="idx"
            >
              <el-form label-width="90px" style="max-width:400px;margin-top:8px;">
                <el-form-item label="行业">
                  <el-select v-model="rule.industry" placeholder="选择行业">
                    <el-option v-for="opt in industryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="类型">
                  <el-select v-model="rule.type" placeholder="选择类型">
                    <el-option v-for="opt in serialTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="前缀">
                  <el-input v-model="rule.prefix" placeholder="如：INV" style="width:120px" />
                </el-form-item>
                <el-form-item label="日期格式">
                  <el-select v-model="rule.dateFormat" style="width:120px">
                    <el-option label="yyyyMMdd" value="yyyyMMdd" />
                    <el-option label="yyMMdd" value="yyMMdd" />
                    <el-option label="yyyyMM" value="yyyyMM" />
                    <el-option label="yyMM" value="yyMM" />
                    <el-option label="无" value="none" />
                  </el-select>
                </el-form-item>
                <el-form-item label="流水号位数">
                  <el-input-number v-model="rule.seqLength" :min="2" :max="8" />
                </el-form-item>
                <el-form-item label="预览">
                  <el-input :value="getSerialPreview(rule)" readonly />
                </el-form-item>
                <el-form-item>
                  <el-button size="small" type="danger" @click="removeSerialRule(idx)" v-if="serialRules.length>1">删除此规则</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

// 行业与模板类型选项
const templateIndustry = ref('common')
const templateType = ref('invoice')
const industryOptions = [
  { label: '通用', value: 'common' },
  { label: '制造业', value: 'manufacture' },
  { label: '服务业', value: 'service' },
  { label: '商贸业', value: 'trade' }
]
const templateTypeOptions = [
  { label: '发票', value: 'invoice' },
  { label: '收据', value: 'receipt' },
  { label: '合同', value: 'contract' }
]
const serialTypeOptions = [
  { label: '发票', value: 'invoice' },
  { label: '收据', value: 'receipt' },
  { label: '合同', value: 'contract' }
]

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
  templates: [],
  serialRules: [
    { industry: 'common', type: 'invoice', prefix: 'INV', dateFormat: 'yyyyMMdd', seqLength: 4 }
  ]
})
const formRef = ref(null)
const rules = {
  name: [{ required: true, message: '请输入账套名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账套编码', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

// 打印模板Tab：按行业/类型过滤
const filteredTemplates = computed(() => {
  return form.templates.filter(t => t.industry === templateIndustry.value && t.type === templateType.value)
    .map(t => ({ ...t, typeLabel: templateTypeOptions.find(opt => opt.value === t.type)?.label || t.type }))
})

function handleTemplateUploadSuccess(res) {
  // 假设后端返回 { url, name }
  if (!res || !res.url) {
    ElMessage.error('上传失败，请重试')
    return
  }
  // 检查是否已存在同类型模板，避免重复
  const exists = form.templates.some(t => t.url === res.url)
  if (exists) {
    ElMessage.warning('该模板已存在')
    return
  }
  form.templates.push({
    name: res.name || '模板文件',
    url: res.url,
    industry: templateIndustry.value,
    type: templateType.value
  })
  ElMessage.success('模板上传成功')
}

function removeTemplate(idx, row) {
  // 只删除当前行业/类型下的模板
  const i = form.templates.findIndex(t => t.url === row.url && t.industry === row.industry && t.type === row.type)
  if (i !== -1) form.templates.splice(i, 1)
}

// 单号生成Tab：多规格数组
const serialRules = ref([
  { industry: 'common', type: 'invoice', prefix: 'INV', dateFormat: 'yyyyMMdd', seqLength: 4 }
])
const currentSerialIndex = ref(0)
const serialRule = computed({
  get: () => serialRules.value[currentSerialIndex.value] || {},
  set: v => { serialRules.value[currentSerialIndex.value] = v }
})
function getSerialPreview(rule) {
  if (!rule) return ''
  const now = new Date()
  let dateStr = ''
  switch (rule.dateFormat) {
    case 'yyyyMMdd': dateStr = now.getFullYear() + pad2(now.getMonth()+1) + pad2(now.getDate()); break
    case 'yyMMdd': dateStr = String(now.getFullYear()).slice(-2) + pad2(now.getMonth()+1) + pad2(now.getDate()); break
    case 'yyyyMM': dateStr = now.getFullYear() + pad2(now.getMonth()+1); break
    case 'yyMM': dateStr = String(now.getFullYear()).slice(-2) + pad2(now.getMonth()+1); break
    default: dateStr = ''
  }
  return rule.prefix + (dateStr ? dateStr : '') + '0'.repeat((rule.seqLength||4)-1) + '1'
}
function pad2(n) { return n < 10 ? '0'+n : ''+n }
const serialPreview = computed(() => getSerialPreview(serialRule.value))
function addSerialRule() {
  serialRules.value.push({ industry: 'common', type: 'invoice', prefix: '', dateFormat: 'yyyyMMdd', seqLength: 4 })
  currentSerialIndex.value = serialRules.value.length - 1
}
function removeSerialRule(idx) {
  if (serialRules.value.length === 1) return ElMessage.warning('至少保留一条规则')
  serialRules.value.splice(idx, 1)
  if (currentSerialIndex.value >= serialRules.value.length) currentSerialIndex.value = serialRules.value.length - 1
}

function openAddDialog() {
  dialogTitle.value = '新增账套'
  Object.assign(form, {
    id: null, name: '', code: '', regNo: '', taxNo: '', phone: '', email: '', address: '', bankName: '', bankAccount: '', bankName2: '', bankAccount2: '', logo: '', seal: '', sign: '', templates: []
  })
  dialogVisible.value = true
}

function openEditDialog(item) {
  dialogTitle.value = '编辑账套'
  Object.assign(form, {
    id: item.id,
    name: item.name,
    code: item.code,
    regNo: item.regNo,
    taxNo: item.taxNo,
    phone: item.phone,
    email: item.email,
    address: item.address,
    bankName: item.bankName,
    bankAccount: item.bankAccount,
    bankName2: item.bankName2,
    bankAccount2: item.bankAccount2,
    logo: item.logo,
    seal: item.seal,
    sign: item.sign,
    templates: Array.isArray(item.templates) ? [...item.templates] : []
  })
  dialogVisible.value = true
}

function beforeTemplateUpload(file) {
  // 可根据需要添加校验逻辑
  return true
}

function onNameInput(val) {
  form.name = val.toUpperCase()
}

function handleUploadSuccess(res, field) {
  // 假设后端返回 { url: 'xxx' }
  if (!res || !res.url) {
    ElMessage.error('上传失败，请重试')
    return
  }
  form[field] = res.url
  ElMessage.success('上传成功')
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

onMounted(fetchAccounts)

function handleSubmit() {
  if (!formRef.value) return
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    const method = form.id ? 'PUT' : 'POST'
    const url = form.id ? `/api/accounts/${form.id}` : '/api/accounts'
    // 提交所有字段，包括打印模板和所有行业单号规则
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
      sign: form.sign,
      templates: form.templates,
      serialRules: JSON.parse(JSON.stringify(serialRules))
    })
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    })
      .then(res => res.json())
      .then((data) => {
        if (data && data.id) {
          ElMessage.success('保存成功')
          dialogVisible.value = false
          fetchAccounts()
        } else {
          ElMessage.error('保存失败，请检查必填项')
        }
      })
      .catch(() => {
        ElMessage.error('保存失败，服务器异常')
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

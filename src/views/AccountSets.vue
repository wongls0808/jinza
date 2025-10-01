<template>
  <div class="account-sets">
    <div class="header">
      <h2>账套管理</h2>
      <el-button type="primary" @click="showAddDialog = true">新增账套</el-button>
    </div>

    <!-- 账套列表 -->
    <el-table :data="accountSets" style="width: 100%">
      <el-table-column prop="code" label="账套代码" width="120" />
      <el-table-column prop="name" label="账套名称" />
      <el-table-column prop="tax_number" label="税号" />
      <el-table-column prop="phone" label="联系电话" />
      <el-table-column prop="is_active" label="状态" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">
            {{ scope.row.is_active ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="scope">
          <el-button size="small" @click="editAccountSet(scope.row)">编辑</el-button>
          <el-button size="small" @click="manageMaterials(scope.row)">素材</el-button>
          <el-button size="small" @click="manageTemplates(scope.row)">模板</el-button>
          <el-button size="small" @click="manageCodeRules(scope.row)">编码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑账套对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingAccountSet ? '编辑账套' : '新增账套'" width="800px">
      <el-form :model="accountSetForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账套名称" required>
              <el-input v-model="accountSetForm.name" placeholder="请输入账套名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账套代码">
              <el-input v-model="accountSetForm.code" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="注册号">
              <el-input v-model="accountSetForm.registration_number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税号">
              <el-input v-model="accountSetForm.tax_number" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="联系电话">
          <el-input v-model="accountSetForm.phone" />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-model="accountSetForm.email" />
        </el-form-item>

        <el-form-item label="地址">
          <el-input v-model="accountSetForm.address" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider>银行信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="银行名称">
              <el-input v-model="accountSetForm.bank_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号">
              <el-input v-model="accountSetForm.bank_account" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="银行名称Ⅱ">
              <el-input v-model="accountSetForm.bank_name2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号Ⅱ">
              <el-input v-model="accountSetForm.bank_account2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAccountSet">确定</el-button>
      </template>
    </el-dialog>

    <!-- 素材管理对话框 -->
    <el-dialog v-model="showMaterialDialog" title="素材管理" width="600px">
      <div class="material-management">
        <div class="material-header">
          <h3>账套: {{ currentAccountSet?.name }}</h3>
        </div>

        <el-form label-width="100px">
          <el-form-item label="LOGO">
            <el-upload
              class="upload-demo"
              action="/api/upload/logo"
              :data="{ account_set_id: currentAccountSet?.id }"
              :on-success="handleLogoSuccess"
              :show-file-list="false"
            >
              <el-button type="primary">点击上传</el-button>
              <template #tip>
                <div class="el-upload__tip">建议尺寸: 200x200px, PNG格式</div>
              </template>
            </el-upload>
            <div v-if="currentAccountSet?.logo_path" class="preview">
              <img :src="currentAccountSet.logo_path" alt="LOGO" class="preview-image" />
            </div>
          </el-form-item>

          <el-form-item label="印章">
            <el-upload
              class="upload-demo"
              action="/api/upload/seal"
              :data="{ account_set_id: currentAccountSet?.id }"
              :on-success="handleSealSuccess"
              :show-file-list="false"
            >
              <el-button type="primary">点击上传</el-button>
              <template #tip>
                <div class="el-upload__tip">建议尺寸: 150x150px, PNG格式</div>
              </template>
            </el-upload>
            <div v-if="currentAccountSet?.seal_path" class="preview">
              <img :src="currentAccountSet.seal_path" alt="印章" class="preview-image" />
            </div>
          </el-form-item>

          <el-form-item label="签名">
            <el-upload
              class="upload-demo"
              action="/api/upload/signature"
              :data="{ account_set_id: currentAccountSet?.id }"
              :on-success="handleSignatureSuccess"
              :show-file-list="false"
            >
              <el-button type="primary">点击上传</el-button>
              <template #tip>
                <div class="el-upload__tip">建议尺寸: 200x80px, PNG格式</div>
              </template>
            </el-upload>
            <div v-if="currentAccountSet?.signature_path" class="preview">
              <img :src="currentAccountSet.signature_path" alt="签名" class="preview-image" />
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>

    <!-- 打印模板管理对话框 -->
    <el-dialog v-model="showTemplateDialog" title="打印模板管理" width="900px">
      <div class="template-management">
        <div class="template-header">
          <h3>账套: {{ currentAccountSet?.name }}</h3>
          <el-button type="primary" @click="showAddTemplate = true">新增模板</el-button>
        </div>

        <el-table :data="printTemplates" style="width: 100%">
          <el-table-column prop="name" label="模板名称" />
          <el-table-column prop="type" label="类型">
            <template #default="scope">
              <el-tag>{{ getTemplateTypeText(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="paper_size" label="纸张规格" />
          <el-table-column label="默认模板">
            <template #default="scope">
              <el-tag v-if="scope.row.is_default" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="editTemplate(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteTemplate(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 新增模板对话框 -->
        <el-dialog v-model="showAddTemplate" title="新增打印模板" width="600px" append-to-body>
          <el-form :model="templateForm" label-width="100px">
            <el-form-item label="模板名称" required>
              <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
            </el-form-item>
            <el-form-item label="模板类型" required>
              <el-select v-model="templateForm.type" placeholder="请选择模板类型">
                <el-option label="发票" value="invoice" />
                <el-option label="收据" value="receipt" />
                <el-option label="合同" value="contract" />
                <el-option label="报价单" value="quotation" />
                <el-option label="送货单" value="delivery" />
              </el-select>
            </el-form-item>
            <el-form-item label="纸张规格">
              <el-select v-model="templateForm.paper_size">
                <el-option label="A4" value="A4" />
                <el-option label="A5" value="A5" />
                <el-option label="B5" value="B5" />
                <el-option label="80mm" value="80mm" />
                <el-option label="58mm" value="58mm" />
              </el-select>
            </el-form-item>
            <el-form-item label="设为默认">
              <el-switch v-model="templateForm.is_default" />
            </el-form-item>
            <el-form-item label="模板内容">
              <el-input v-model="templateForm.content" type="textarea" :rows="6" placeholder="请输入模板内容（支持HTML）" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showAddTemplate = false">取消</el-button>
            <el-button type="primary" @click="saveTemplate">保存模板</el-button>
          </template>
        </el-dialog>
      </div>
    </el-dialog>

    <!-- 编码规则管理对话框 -->
    <el-dialog v-model="showCodeRuleDialog" title="编码规则管理" width="800px">
      <div class="code-rule-management">
        <div class="code-rule-header">
          <h3>账套: {{ currentAccountSet?.name }}</h3>
          <el-button type="primary" @click="showAddCodeRule = true">新增规则</el-button>
        </div>

        <el-table :data="codeRules" style="width: 100%">
          <el-table-column prop="name" label="规则名称" />
          <el-table-column prop="type" label="类型">
            <template #default="scope">
              <el-tag>{{ getCodeTypeText(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="format" label="格式" />
          <el-table-column prop="current_number" label="当前编号" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="generateCode(scope.row)">生成</el-button>
              <el-button size="small" @click="editCodeRule(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteCodeRule(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 新增编码规则对话框 -->
        <el-dialog v-model="showAddCodeRule" title="新增编码规则" width="600px" append-to-body>
          <el-form :model="codeRuleForm" label-width="100px">
            <el-form-item label="规则名称" required>
              <el-input v-model="codeRuleForm.name" placeholder="请输入规则名称" />
            </el-form-item>
            <el-form-item label="编码类型" required>
              <el-select v-model="codeRuleForm.type" placeholder="请选择编码类型">
                <el-option label="发票编号" value="invoice" />
                <el-option label="收据编号" value="receipt" />
                <el-option label="合同编号" value="contract" />
                <el-option label="客户编码" value="customer" />
                <el-option label="项目编码" value="project" />
              </el-select>
            </el-form-item>
            <el-form-item label="前缀">
              <el-input v-model="codeRuleForm.prefix" placeholder="如: INVOICE" />
            </el-form-item>
            <el-form-item label="后缀">
              <el-input v-model="codeRuleForm.suffix" placeholder="如: -01" />
            </el-form-item>
            <el-form-item label="编码格式" required>
              <el-input v-model="codeRuleForm.format" placeholder="如: {prefix}{year}{month}{number}{suffix}" />
              <div class="format-tips">
                可用变量: {prefix}前缀, {suffix}后缀, {number}序号, {year}年, {month}月, {day}日
              </div>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showAddCodeRule = false">取消</el-button>
            <el-button type="primary" @click="saveCodeRule">保存规则</el-button>
          </template>
        </el-dialog>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const accountSets = ref([]);
const showAddDialog = ref(false);
const editingAccountSet = ref(null);
const accountSetForm = ref({
  name: '',
  code: '',
  registration_number: '',
  tax_number: '',
  phone: '',
  email: '',
  address: '',
  bank_name: '',
  bank_account: '',
  bank_name2: '',
  bank_account2: ''
});

// 素材管理相关
const showMaterialDialog = ref(false);

// 模板管理相关
const showTemplateDialog = ref(false);
const showAddTemplate = ref(false);
const currentAccountSet = ref(null);
const printTemplates = ref([]);
const templateForm = ref({
  name: '',
  type: '',
  paper_size: 'A4',
  content: '',
  is_default: false
});

// 编码规则管理相关
const showCodeRuleDialog = ref(false);
const showAddCodeRule = ref(false);
const codeRules = ref([]);
const codeRuleForm = ref({
  name: '',
  type: '',
  prefix: '',
  suffix: '',
  format: ''
});

onMounted(async () => {
  await loadAccountSets();
});

const loadAccountSets = async () => {
  try {
    const response = await fetch('/api/account-sets');
    if (response.ok) {
      accountSets.value = await response.json();
    }
  } catch (error) {
    console.error('加载账套失败:', error);
    ElMessage.error('加载账套失败');
  }
};

const saveAccountSet = async () => {
  try {
    // 表单验证
    if (!accountSetForm.value.name) {
      ElMessage.error('请输入账套名称');
      return;
    }

    const response = await fetch('/api/account-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountSetForm.value)
    });
    
    if (response.ok) {
      const data = await response.json();
      showAddDialog.value = false;
      editingAccountSet.value = null;
      accountSetForm.value = {
        name: '', code: '', registration_number: '', tax_number: '',
        phone: '', email: '', address: '', bank_name: '', bank_account: '',
        bank_name2: '', bank_account2: ''
      };
      await loadAccountSets();
      ElMessage.success('账套创建成功');
    } else {
      const errorData = await response.json();
      ElMessage.error(errorData.error || '创建账套失败');
    }
  } catch (error) {
    console.error('保存账套失败:', error);
    ElMessage.error('保存账套失败，请检查网络连接');
  }
};

const editAccountSet = (accountSet) => {
  editingAccountSet.value = accountSet;
  accountSetForm.value = { ...accountSet };
  showAddDialog.value = true;
};

const manageMaterials = async (accountSet) => {
  currentAccountSet.value = accountSet;
  showMaterialDialog.value = true;
};

const manageTemplates = async (accountSet) => {
  currentAccountSet.value = accountSet;
  showTemplateDialog.value = true;
  await loadPrintTemplates(accountSet.id);
};

const loadPrintTemplates = async (accountSetId) => {
  try {
    const response = await fetch(`/api/print-templates?account_set_id=${accountSetId}`);
    if (response.ok) {
      printTemplates.value = await response.json();
    }
  } catch (error) {
    console.error('加载打印模板失败:', error);
  }
};

const saveTemplate = async () => {
  try {
    if (!templateForm.value.name || !templateForm.value.type) {
      ElMessage.error('请填写模板名称和类型');
      return;
    }

    const response = await fetch('/api/print-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...templateForm.value,
        account_set_id: currentAccountSet.value.id
      })
    });
    
    if (response.ok) {
      showAddTemplate.value = false;
      templateForm.value = {
        name: '', type: '', paper_size: 'A4', content: '', is_default: false
      };
      await loadPrintTemplates(currentAccountSet.value.id);
      ElMessage.success('模板创建成功');
    }
  } catch (error) {
    console.error('保存模板失败:', error);
    ElMessage.error('保存模板失败');
  }
};

const manageCodeRules = async (accountSet) => {
  currentAccountSet.value = accountSet;
  showCodeRuleDialog.value = true;
  await loadCodeRules(accountSet.id);
};

const loadCodeRules = async (accountSetId) => {
  try {
    const response = await fetch(`/api/code-rules?account_set_id=${accountSetId}`);
    if (response.ok) {
      codeRules.value = await response.json();
    }
  } catch (error) {
    console.error('加载编码规则失败:', error);
  }
};

const saveCodeRule = async () => {
  try {
    if (!codeRuleForm.value.name || !codeRuleForm.value.type || !codeRuleForm.value.format) {
      ElMessage.error('请填写规则名称、类型和格式');
      return;
    }

    const response = await fetch('/api/code-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...codeRuleForm.value,
        account_set_id: currentAccountSet.value.id
      })
    });
    
    if (response.ok) {
      showAddCodeRule.value = false;
      codeRuleForm.value = {
        name: '', type: '', prefix: '', suffix: '', format: ''
      };
      await loadCodeRules(currentAccountSet.value.id);
      ElMessage.success('编码规则创建成功');
    }
  } catch (error) {
    console.error('保存编码规则失败:', error);
    ElMessage.error('保存编码规则失败');
  }
};

const generateCode = async (rule) => {
  try {
    const response = await fetch('/api/generate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_id: rule.id })
    });
    
    if (response.ok) {
      const data = await response.json();
      ElMessage.success(`生成的编码: ${data.code}`);
      await loadCodeRules(currentAccountSet.value.id);
    }
  } catch (error) {
    console.error('生成编码失败:', error);
    ElMessage.error('生成编码失败');
  }
};

// 文件上传处理
const handleLogoSuccess = (response) => {
  if (currentAccountSet.value) {
    currentAccountSet.value.logo_path = response.file_path;
  }
  ElMessage.success('LOGO上传成功');
};

const handleSealSuccess = (response) => {
  if (currentAccountSet.value) {
    currentAccountSet.value.seal_path = response.file_path;
  }
  ElMessage.success('印章上传成功');
};

const handleSignatureSuccess = (response) => {
  if (currentAccountSet.value) {
    currentAccountSet.value.signature_path = response.file_path;
  }
  ElMessage.success('签名上传成功');
};

// 辅助函数
const getTemplateTypeText = (type) => {
  const types = {
    invoice: '发票',
    receipt: '收据',
    contract: '合同',
    quotation: '报价单',
    delivery: '送货单'
  };
  return types[type] || type;
};

const getCodeTypeText = (type) => {
  const types = {
    invoice: '发票编号',
    receipt: '收据编号',
    contract: '合同编号',
    customer: '客户编码',
    project: '项目编码'
  };
  return types[type] || type;
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.template-header,
.code-rule-header,
.material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6e6e6;
}

.preview {
  margin-top: 10px;
}

.preview-image {
  max-width: 150px;
  max-height: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
}

.format-tips {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}
</style>
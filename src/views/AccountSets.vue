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
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="editAccountSet(scope.row)">编辑</el-button>
          <el-button size="small" @click="manageTemplates(scope.row)">模板</el-button>
          <el-button size="small" @click="manageCodeRules(scope.row)">编码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑账套对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingAccountSet ? '编辑账套' : '新增账套'">
      <el-form :model="accountSetForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账套名称">
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

    <!-- 打印模板管理对话框 -->
    <el-dialog v-model="showTemplateDialog" title="打印模板管理" width="800px">
      <div class="template-management">
        <div class="template-header">
          <h3>账套: {{ currentAccountSet?.name }}</h3>
          <el-button type="primary" @click="showAddTemplate = true">新增模板</el-button>
        </div>

        <el-table :data="printTemplates" style="width: 100%">
          <el-table-column prop="name" label="模板名称" />
          <el-table-column prop="type" label="类型" />
          <el-table-column prop="paper_size" label="纸张规格" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" @click="editTemplate(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteTemplate(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
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
          <el-table-column prop="type" label="类型" />
          <el-table-column prop="format" label="格式" />
          <el-table-column prop="current_number" label="当前编号" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" @click="generateCode(scope.row)">生成</el-button>
              <el-button size="small" type="danger" @click="deleteCodeRule(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

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

// 模板管理相关
const showTemplateDialog = ref(false);
const showAddTemplate = ref(false);
const currentAccountSet = ref(null);
const printTemplates = ref([]);

// 编码规则管理相关
const showCodeRuleDialog = ref(false);
const showAddCodeRule = ref(false);
const codeRules = ref([]);

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
  }
};

const saveAccountSet = async () => {
  try {
    const url = editingAccountSet.value 
      ? `/api/account-sets/${editingAccountSet.value.id}`
      : '/api/account-sets';
    
    const method = editingAccountSet.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountSetForm.value)
    });
    
    if (response.ok) {
      showAddDialog.value = false;
      editingAccountSet.value = null;
      accountSetForm.value = {
        name: '', code: '', registration_number: '', tax_number: '',
        phone: '', email: '', address: '', bank_name: '', bank_account: '',
        bank_name2: '', bank_account2: ''
      };
      await loadAccountSets();
      ElMessage.success(editingAccountSet.value ? '更新成功' : '创建成功');
    }
  } catch (error) {
    console.error('保存账套失败:', error);
    ElMessage.error('保存失败');
  }
};

const editAccountSet = (accountSet) => {
  editingAccountSet.value = accountSet;
  accountSetForm.value = { ...accountSet };
  showAddDialog.value = true;
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
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.template-header,
.code-rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6e6e6;
}
</style>
<template>
  <div class="account-sets-modern">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">账套管理</h1>
        <p class="page-description">管理企业财务账套信息，包括基础信息、银行账户和业务素材</p>
      </div>
      <el-button type="primary" size="large" @click="showAddDialog = true" class="add-button">
        <el-icon><Plus /></el-icon>
        新增账套
      </el-button>
    </div>

    <!-- 账套卡片列表 -->
    <div class="account-cards" v-if="accountSets.length > 0">
      <el-card 
        v-for="account in accountSets" 
        :key="account.id" 
        class="account-card"
        :class="{ 'active-card': account.is_active }"
      >
        <div class="card-header">
          <div class="account-badge">
            <span class="account-code">{{ account.code }}</span>
            <el-tag :type="account.is_active ? 'success' : 'info'" size="small">
              {{ account.is_active ? '启用' : '停用' }}
            </el-tag>
          </div>
          <el-dropdown @command="(command) => handleAccountCommand(command, account)">
            <el-button text class="card-menu">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑账套</el-dropdown-item>
                <el-dropdown-item command="materials">管理素材</el-dropdown-item>
                <el-dropdown-item command="templates">打印模板</el-dropdown-item>
                <el-dropdown-item command="codes">编码规则</el-dropdown-item>
                <el-dropdown-item divided command="toggleStatus">
                  {{ account.is_active ? '停用' : '启用' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <div class="card-content">
          <h3 class="account-name">{{ account.name }}</h3>
          <div class="account-info">
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <span>{{ account.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <el-icon><Message /></el-icon>
              <span>{{ account.email || '未设置' }}</span>
            </div>
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span class="address">{{ account.address || '未设置地址' }}</span>
            </div>
          </div>

          <!-- 素材预览 -->
          <div class="material-previews" v-if="hasMaterials(account)">
            <div class="preview-title">素材预览</div>
            <div class="preview-items">
              <div v-if="account.logo_path" class="preview-item" @click="previewMaterial(account.logo_path, 'LOGO')">
                <div class="preview-label">LOGO</div>
                <div class="preview-image">
                  <img :src="getMaterialUrl(account.logo_path)" alt="LOGO" />
                </div>
              </div>
              <div v-if="account.seal_path" class="preview-item" @click="previewMaterial(account.seal_path, '印章')">
                <div class="preview-label">印章</div>
                <div class="preview-image">
                  <img :src="getMaterialUrl(account.seal_path)" alt="印章" />
                </div>
              </div>
              <div v-if="account.signature_path" class="preview-item" @click="previewMaterial(account.signature_path, '签名')">
                <div class="preview-label">签名</div>
                <div class="preview-image">
                  <img :src="getMaterialUrl(account.signature_path)" alt="签名" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <div class="action-buttons">
            <el-button size="small" @click="editAccountSet(account)">编辑</el-button>
            <el-button size="small" type="primary" @click="manageMaterials(account)">素材</el-button>
            <el-button size="small" type="primary" @click="manageTemplates(account)">模板</el-button>
            <el-button size="small" type="primary" @click="manageCodeRules(account)">编码</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="暂无账套数据" class="empty-state">
      <el-button type="primary" @click="showAddDialog = true">创建第一个账套</el-button>
    </el-empty>

    <!-- 新增/编辑账套对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingAccountSet ? '编辑账套' : '新增账套'" 
      width="600px"
      class="modern-dialog"
      @closed="handleDialogClosed"
    >
      <el-form :model="accountSetForm" label-width="100px" class="modern-form" ref="accountFormRef">
        <el-form-item 
          label="账套名称" 
          required
          :rules="[{ required: true, message: '请输入账套名称', trigger: 'blur' }]"
        >
          <el-input 
            v-model="accountSetForm.name" 
            placeholder="请输入账套名称"
            size="large"
            @input="handleNameInput"
          />
        </el-form-item>

        <el-form-item label="账套代码">
          <el-input 
            v-model="accountSetForm.code" 
            disabled 
            placeholder="自动生成"
            size="large"
          />
        </el-form-item>

        <el-form-item label="注册信息">
          <div class="form-row">
            <el-input 
              v-model="accountSetForm.registration_number" 
              placeholder="注册号"
            />
            <el-input 
              v-model="accountSetForm.tax_number" 
              placeholder="税号"
            />
          </div>
        </el-form-item>

        <el-form-item label="联系信息">
          <div class="form-row">
            <el-input 
              v-model="accountSetForm.phone" 
              placeholder="联系电话"
            />
            <el-input 
              v-model="accountSetForm.email" 
              placeholder="邮箱地址"
            />
          </div>
        </el-form-item>

        <el-form-item label="地址">
          <el-input 
            v-model="accountSetForm.address" 
            type="textarea" 
            :rows="2" 
            placeholder="详细地址"
          />
        </el-form-item>

        <el-divider content-position="left">银行账户信息</el-divider>

        <el-form-item label="主要账户">
          <div class="form-row">
            <el-input 
              v-model="accountSetForm.bank_name" 
              placeholder="银行名称"
            />
            <el-input 
              v-model="accountSetForm.bank_account" 
              placeholder="银行账号"
            />
          </div>
        </el-form-item>

        <el-form-item label="备用账户">
          <div class="form-row">
            <el-input 
              v-model="accountSetForm.bank_name2" 
              placeholder="银行名称"
            />
            <el-input 
              v-model="accountSetForm.bank_account2" 
              placeholder="银行账号"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false" size="large">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveAccountSet" 
            size="large"
            :loading="saving"
          >
            {{ saving ? '保存中...' : '确认保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 素材管理对话框 -->
    <MaterialManagement 
      v-model="showMaterialDialog" 
      :account-set="currentAccountSet"
      @update="loadAccountSets"
    />

    <!-- 模板管理对话框 -->
    <TemplateManagement 
      v-model="showTemplateDialog" 
      :account-set="currentAccountSet"
    />

    <!-- 编码规则管理对话框 -->
    <CodeRuleManagement 
      v-model="showCodeRuleDialog" 
      :account-set="currentAccountSet"
    />

    <!-- 素材预览对话框 -->
    <el-dialog v-model="showMaterialPreview" :title="`${previewMaterialType}预览`" width="500px" align-center>
      <div class="material-preview-dialog">
        <img :src="previewMaterialUrl" :alt="previewMaterialType" class="preview-full-image" />
        <div class="preview-info">
          <p>素材类型: {{ previewMaterialType }}</p>
          <p>建议尺寸: {{ getMaterialSize(previewMaterialType) }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, MoreFilled, Phone, Message, Location 
} from '@element-plus/icons-vue';

// 导入组件
import MaterialManagement from '../components/account/MaterialManagement.vue';
import TemplateManagement from '../components/account/TemplateManagement.vue';
import CodeRuleManagement from '../components/account/CodeRuleManagement.vue';

const accountSets = ref([]);
const showAddDialog = ref(false);
const editingAccountSet = ref(null);
const saving = ref(false);
const accountFormRef = ref(null);
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

// 管理对话框
const showMaterialDialog = ref(false);
const showTemplateDialog = ref(false);
const showCodeRuleDialog = ref(false);
const currentAccountSet = ref(null);

// 素材预览
const showMaterialPreview = ref(false);
const previewMaterialUrl = ref('');
const previewMaterialType = ref('');

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

// 账套名称输入处理 - 自动转为大写
const handleNameInput = (value) => {
  accountSetForm.value.name = value.toUpperCase();
  
  // 自动生成账套代码（名称前3个字母 + 2位随机数）
  if (value.length >= 2) {
    const namePrefix = value.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 90 + 10); // 10-99
    accountSetForm.value.code = `${namePrefix}${randomNum}`;
  } else {
    accountSetForm.value.code = '';
  }
};

// 对话框关闭处理
const handleDialogClosed = () => {
  editingAccountSet.value = null;
  accountSetForm.value = {
    name: '', code: '', registration_number: '', tax_number: '',
    phone: '', email: '', address: '', bank_name: '', bank_account: '',
    bank_name2: '', bank_account2: ''
  };
  if (accountFormRef.value) {
    accountFormRef.value.clearValidate();
  }
};

const saveAccountSet = async () => {
  if (!accountSetForm.value.name) {
    ElMessage.error('请输入账套名称');
    return;
  }

  saving.value = true;
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
      await loadAccountSets();
      ElMessage.success(editingAccountSet.value ? '更新成功' : '创建成功');
    } else {
      const errorData = await response.json();
      ElMessage.error(errorData.error || '保存失败');
    }
  } catch (error) {
    console.error('保存账套失败:', error);
    ElMessage.error('保存账套失败，请检查网络连接');
  } finally {
    saving.value = false;
  }
};

const editAccountSet = (accountSet) => {
  editingAccountSet.value = accountSet;
  accountSetForm.value = { ...accountSet };
  showAddDialog.value = true;
};

const manageMaterials = (accountSet) => {
  currentAccountSet.value = accountSet;
  showMaterialDialog.value = true;
};

const manageTemplates = (accountSet) => {
  currentAccountSet.value = accountSet;
  showTemplateDialog.value = true;
};

const manageCodeRules = (accountSet) => {
  currentAccountSet.value = accountSet;
  showCodeRuleDialog.value = true;
};

const handleAccountCommand = (command, account) => {
  switch (command) {
    case 'edit':
      editAccountSet(account);
      break;
    case 'materials':
      manageMaterials(account);
      break;
    case 'templates':
      manageTemplates(account);
      break;
    case 'codes':
      manageCodeRules(account);
      break;
    case 'toggleStatus':
      toggleAccountStatus(account);
      break;
  }
};

const toggleAccountStatus = async (account) => {
  try {
    const newStatus = !account.is_active;
    const response = await fetch(`/api/account-sets/${account.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newStatus ? 1 : 0 })
    });
    
    if (response.ok) {
      await loadAccountSets();
      ElMessage.success(newStatus ? '账套已启用' : '账套已停用');
    }
  } catch (error) {
    console.error('更新状态失败:', error);
    ElMessage.error('操作失败');
  }
};

// 素材相关功能
const hasMaterials = (account) => {
  return account.logo_path || account.seal_path || account.signature_path;
};

const getMaterialUrl = (path) => {
  // 如果是完整的URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }
  // 如果是相对路径，构建完整URL
  return path;
};

const previewMaterial = (url, type) => {
  previewMaterialUrl.value = getMaterialUrl(url);
  previewMaterialType.value = type;
  showMaterialPreview.value = true;
};

const getMaterialSize = (type) => {
  const sizes = {
    'LOGO': '400×400px',
    '印章': '400×400px',
    '签名': '400×150px'
  };
  return sizes[type] || '';
};
</script>

<style scoped>
.account-sets-modern {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e6e6e6;
}

.header-content .page-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.header-content .page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.add-button {
  border-radius: 8px;
  padding: 12px 24px;
}

.account-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.account-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #e6e6e6;
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.active-card {
  border-left: 4px solid #409eff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.account-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-code {
  font-weight: 600;
  color: #409eff;
  background: #ecf5ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.card-menu {
  padding: 4px;
}

.card-content {
  margin-bottom: 16px;
}

.account-name {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.info-item .el-icon {
  color: #909399;
}

.address {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 素材预览样式 */
.material-previews {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.preview-items {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.preview-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  padding: 8px;
  background: #f8f9fa;
}

.preview-item:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.preview-label {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-bottom: 4px;
}

.preview-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.preview-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-footer {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state {
  margin: 60px 0;
}

.modern-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #e6e6e6;
  margin: 0;
}

.modern-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.modern-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 素材预览对话框 */
.material-preview-dialog {
  text-align: center;
}

.preview-full-image {
  max-width: 100%;
  max-height: 400px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
  margin-bottom: 16px;
}

.preview-info {
  text-align: left;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.preview-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}
</style>
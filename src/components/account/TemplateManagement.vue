<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="打印模板管理" 
    width="900px"
    class="template-dialog"
  >
    <div class="template-management">
      <div class="dialog-header">
        <h3>账套: {{ accountSet?.name }}</h3>
        <p class="dialog-description">管理各种业务票据的打印模板，支持多种纸张规格</p>
      </div>

      <div class="template-actions">
        <el-button type="primary" @click="showAddTemplate = true">
          <el-icon><Plus /></el-icon>
          新增模板
        </el-button>
      </div>

      <!-- 模板列表 -->
      <div class="template-list">
        <el-card 
          v-for="template in printTemplates" 
          :key="template.id"
          class="template-card"
          :class="{ 'default-template': template.is_default }"
        >
          <div class="template-header">
            <div class="template-info">
              <h4 class="template-name">{{ template.name }}</h4>
              <div class="template-meta">
                <el-tag size="small">{{ getTemplateTypeText(template.type) }}</el-tag>
                <el-tag size="small" type="info">{{ template.paper_size }}</el-tag>
                <el-tag v-if="template.is_default" size="small" type="success">默认模板</el-tag>
              </div>
            </div>
            <div class="template-actions">
              <el-button size="small" text @click="editTemplate(template)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" text @click="setDefaultTemplate(template)" v-if="!template.is_default">
                <el-icon><Star /></el-icon>
              </el-button>
              <el-button size="small" text type="danger" @click="deleteTemplate(template.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          
          <div class="template-preview">
            <div class="preview-placeholder">
              {{ template.type.toUpperCase() }} 模板预览
            </div>
          </div>
          
          <div class="template-footer">
            <span class="create-time">创建时间: {{ formatDate(template.created_at) }}</span>
          </div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="printTemplates.length === 0" description="暂无打印模板">
        <el-button type="primary" @click="showAddTemplate = true">创建第一个模板</el-button>
      </el-empty>
    </div>

    <!-- 新增/编辑模板对话框 -->
    <el-dialog 
      v-model="showAddTemplate" 
      :title="editingTemplate ? '编辑模板' : '新增模板'" 
      width="90%"
      :fullscreen="isBuilderMode"
      append-to-body
    >
      <div v-if="!isBuilderMode">
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
              <el-option label="A4 (210×297mm)" value="A4" />
              <el-option label="A5 (148×210mm)" value="A5" />
              <el-option label="B5 (176×250mm)" value="B5" />
              <el-option label="80mm 小票" value="80mm" />
              <el-option label="58mm 小票" value="58mm" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="设为默认">
            <el-switch v-model="templateForm.is_default" />
          </el-form-item>
          
          <div class="template-actions">
            <el-button type="primary" @click="openVisualEditor">
              <el-icon><Edit /></el-icon> 使用可视化编辑器
            </el-button>
          </div>
          
          <el-form-item label="模板内容">
            <el-input 
              v-model="templateForm.content" 
              type="textarea" 
              :rows="12" 
              placeholder="请输入模板内容（支持HTML格式）"
            />
            <div class="template-tips">
              <p>提示：可以使用以下变量：</p>
              <ul>
                <li><code>{company_name}</code> - 公司名称</li>
                <li><code>{company_logo}</code> - 公司LOGO</li>
                <li><code>{company_seal}</code> - 公司印章</li>
                <li><code>{signature}</code> - 负责人签名</li>
                <li><code>{current_date}</code> - 当前日期</li>
                <li><code>{invoice_number}</code> - 发票编号</li>
                <li><code>{customer_name}</code> - 客户名称</li>
                <li><code>{customer_address}</code> - 客户地址</li>
                <li><code>{item_name}</code> - 商品名称</li>
                <li><code>{quantity}</code> - 商品数量</li>
                <li><code>{unit_price}</code> - 单价</li>
                <li><code>{amount}</code> - 金额</li>
                <li><code>{total_amount}</code> - 总金额</li>
              </ul>
            </div>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="showAddTemplate = false">取消</el-button>
          <el-button type="primary" @click="saveTemplate">保存</el-button>
        </template>
      </div>
      
      <!-- 可视化编辑器模式 -->
      <template-builder
        v-if="isBuilderMode"
        :initial-content="templateForm.content"
        :paper-size="templateForm.paper_size"
        @save="handleBuilderSave"
        @cancel="isBuilderMode = false"
        @update:paper-size="templateForm.paper_size = $event"
      />
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Star, Delete } from '@element-plus/icons-vue';
import TemplateBuilder from './TemplateBuilder.vue';

const props = defineProps({
  modelValue: Boolean,
  accountSet: Object
});

const emit = defineEmits(['update:modelValue']);
const isBuilderMode = ref(false);

const dialogVisible = ref(false);
const showAddTemplate = ref(false);
const printTemplates = ref([]);
const editingTemplate = ref(null);
const templateForm = ref({
  name: '',
  type: '',
  paper_size: 'A4',
  content: '',
  is_default: false
});

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
  if (val && props.accountSet) {
    loadPrintTemplates();
  }
});

watch(dialogVisible, (val) => {
  emit('update:modelValue', val);
});

const loadPrintTemplates = async () => {
  if (!props.accountSet) return;
  
  try {
    const response = await fetch(`/api/print-templates?account_set_id=${props.accountSet.id}`);
    if (response.ok) {
      printTemplates.value = await response.json();
    }
  } catch (error) {
    console.error('加载打印模板失败:', error);
    ElMessage.error('加载模板失败');
  }
};

const saveTemplate = async () => {
  if (!templateForm.value.name || !templateForm.value.type) {
    ElMessage.error('请填写模板名称和类型');
    return;
  }

  try {
    const url = editingTemplate.value 
      ? `/api/print-templates/${editingTemplate.value.id}`
      : '/api/print-templates';
    
    const method = editingTemplate.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...templateForm.value,
        account_set_id: props.accountSet.id
      })
    });
    
    if (response.ok) {
      showAddTemplate.value = false;
      editingTemplate.value = null;
      templateForm.value = {
        name: '', type: '', paper_size: 'A4', content: '', is_default: false
      };
      await loadPrintTemplates();
      ElMessage.success(editingTemplate.value ? '更新成功' : '创建成功');
    }
  } catch (error) {
    console.error('保存模板失败:', error);
    ElMessage.error('保存模板失败');
  }
};

const editTemplate = (template) => {
  editingTemplate.value = template;
  templateForm.value = { ...template };
  showAddTemplate.value = true;
};

const deleteTemplate = async (templateId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await fetch(`/api/print-templates/${templateId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await loadPrintTemplates();
      ElMessage.success('删除成功');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const setDefaultTemplate = async (template) => {
  try {
    const response = await fetch(`/api/print-templates/${template.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true })
    });

    if (response.ok) {
      await loadPrintTemplates();
      ElMessage.success('已设为默认模板');
    }
  } catch (error) {
    console.error('设置默认模板失败:', error);
    ElMessage.error('设置失败');
  }
};

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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

// 打开可视化编辑器
const openVisualEditor = () => {
  isBuilderMode.value = true;
};

// 处理可视化编辑器保存
const handleBuilderSave = (content) => {
  templateForm.value.content = content;
  isBuilderMode.value = false;
  ElMessage.success('模板内容已更新');
};
</script>

<style scoped>
.dialog-header {
  margin-bottom: 24px;
}

.dialog-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.dialog-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.template-actions {
  margin-bottom: 20px;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.template-card {
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.default-template {
  border-left: 4px solid #409eff;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.template-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.template-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.template-actions {
  display: flex;
  gap: 4px;
}

.template-preview {
  height: 120px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.preview-placeholder {
  color: #909399;
  font-size: 14px;
}

.template-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.create-time {
  font-size: 12px;
  color: #909399;
}

.template-tips {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.template-tips p {
  margin: 0 0 8px 0;
}

.template-tips ul {
  margin: 0;
  padding-left: 16px;
}

.template-tips code {
  background: #e6e6e6;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: monospace;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
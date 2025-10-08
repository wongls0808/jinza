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

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>

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
    </div>
    
    <!-- 可视化编辑器模式 -->
    <template-builder
      v-if="isBuilderMode"
      v-model="templateForm.content"
      :paper-size="templateForm.paper_size"
      @save="handleBuilderSave"
      @cancel="isBuilderMode = false"
      @update:paper-size="templateForm.paper_size = $event"
    />

    <template #footer>
      <div v-if="!isBuilderMode" class="dialog-footer">
        <el-button @click="showAddTemplate = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
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
const defaultContent = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: Arial, sans-serif; }\n    .page-content{ padding:10mm; }\n    table{ width:100%; border-collapse:collapse; }\n    th,td{ border:1px solid #ddd; padding:6px; }\n  </style>\n</head>\n<body>\n  <div class=\"page-content\">\n    <h2 style=\"text-align:center\">{{account_set_name}} 发票</h2>\n    <p>发票号：{{invoice_number}} 开票日期：{{invoice_date}}</p>\n    <table>\n      <thead><tr><th>#</th><th>商品</th><th>描述</th><th>数量</th><th>单位</th><th>单价</th><th>金额</th></tr></thead>\n      <tbody>{{invoice_items}}</tbody>\n    </table>\n    <p style=\"text-align:right\">合计：{{total_amount}}</p>\n  </div>\n</body>\n</html>`;

const templateForm = ref({
  name: '',
  type: 'invoice',
  paper_size: 'A4',
  content: defaultContent,
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

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadPrintTemplates = async () => {
  try {
    if (!props.accountSet || !props.accountSet.id) {
      console.error('账套ID为空');
      return;
    }

    // 修正查询参数名称，与后端保持一致 account_set_id；
    // 后端返回为数组，直接赋值即可
    const response = await fetch(`/api/print-templates?account_set_id=${props.accountSet.id}`);
    if (response.ok) {
      const data = await response.json();
      printTemplates.value = Array.isArray(data) ? data : [];
    } else {
      console.error('获取打印模板失败', response.statusText);
    }
  } catch (error) {
    console.error('获取打印模板出错', error);
  }
};

const getTemplateTypeText = (type) => {
  const typeMap = {
    invoice: '发票',
    receipt: '收据',
    contract: '合同',
    quotation: '报价单',
    delivery: '送货单'
  };
  
  return typeMap[type] || type;
};

const saveTemplate = async () => {
  try {
    // 表单验证
    if (!templateForm.value.name) {
      ElMessage.error('请输入模板名称');
      return;
    }
    
    if (!templateForm.value.type) {
      ElMessage.error('请选择模板类型');
      return;
    }
    
    const isUpdate = editingTemplate.value !== null;
    const url = isUpdate 
      ? `/api/print-templates/${editingTemplate.value.id}` 
      : '/api/print-templates';
    
    const method = isUpdate ? 'PUT' : 'POST';
    
    const payload = {
      account_set_id: props.accountSet.id,
      name: templateForm.value.name,
      type: templateForm.value.type,
      paper_size: templateForm.value.paper_size,
      content: templateForm.value.content, // 直接存完整HTML
      is_default: !!templateForm.value.is_default
    };
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      await loadPrintTemplates();
      showAddTemplate.value = false;
      editingTemplate.value = null;
      
      ElMessage.success(isUpdate ? '更新成功' : '创建成功');
      
      // 重置表单
      templateForm.value = {
        name: '',
        type: '',
        paper_size: 'A4',
        content: '',
        is_default: false
      };
    } else {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.error('保存模板出错:', error);
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
    // 由于后端 PUT 接口会一并更新 name/type/paper_size/content
    // 为避免仅传 is_default 导致其它字段被置空，这里携带完整字段
    const response = await fetch(`/api/print-templates/${template.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        type: template.type,
        paper_size: template.paper_size,
        content: template.content,
        is_default: true
      })
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

// 打开可视化编辑器
const openVisualEditor = () => {
  // 确保进入编辑器时有可解析的基础HTML
  if (!templateForm.value.content || typeof templateForm.value.content !== 'string') {
    templateForm.value.content = defaultContent;
  }
  isBuilderMode.value = true;
};

// 处理可视化编辑器保存
const handleBuilderSave = (content) => {
  // content 为 TemplateBuilder 输出的完整 HTML
  templateForm.value.content = content;
  isBuilderMode.value = false;
  ElMessage.success('模板内容已更新');
};
</script>

<style scoped>
.template-dialog {
  --el-dialog-width: 900px;
}

.template-management {
  min-height: 500px;
}

.dialog-header {
  margin-bottom: 20px;
}

.dialog-header h3 {
  margin-bottom: 8px;
  color: #303133;
}

.dialog-description {
  color: #606266;
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
  transition: all 0.3s;
  position: relative;
}

.template-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.default-template {
  border-color: var(--el-color-success-light-5);
  box-shadow: 0 0 8px var(--el-color-success-light-3);
}

.template-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.template-name {
  margin: 0 0 8px;
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
  margin-bottom: 16px;
}

.preview-placeholder {
  color: #909399;
  font-size: 14px;
}

.template-footer {
  display: flex;
  justify-content: space-between;
}

.create-time {
  color: #909399;
  font-size: 12px;
}

/* 可视化编辑器相关样式 */
.template-tips {
  margin-top: 12px;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.template-tips p {
  margin-top: 0;
  margin-bottom: 8px;
  font-weight: bold;
}

.template-tips ul {
  margin: 0;
  padding-left: 20px;
}

.template-tips li {
  margin-bottom: 6px;
}

.template-tips code {
  background: #ecf5ff;
  padding: 2px 4px;
  border-radius: 3px;
  color: #409eff;
}
</style>
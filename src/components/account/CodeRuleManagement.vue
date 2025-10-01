<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="编码规则管理" 
    width="800px"
    class="code-rule-dialog"
  >
    <div class="code-rule-management">
      <div class="dialog-header">
        <h3>账套: {{ accountSet?.name }}</h3>
        <p class="dialog-description">管理各种业务编码的生成规则，支持自定义格式</p>
      </div>

      <div class="code-rule-actions">
        <el-button type="primary" @click="showAddCodeRule = true">
          <el-icon><Plus /></el-icon>
          新增规则
        </el-button>
      </div>

      <!-- 编码规则列表 -->
      <el-table :data="codeRules" style="width: 100%">
        <el-table-column prop="name" label="规则名称" />
        <el-table-column prop="type" label="类型">
          <template #default="scope">
            <el-tag>{{ getCodeTypeText(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="格式" />
        <el-table-column prop="current_number" label="当前编号" width="100" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="generateCode(scope.row)">生成</el-button>
            <el-button size="small" @click="editCodeRule(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCodeRule(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="codeRules.length === 0" description="暂无编码规则">
        <el-button type="primary" @click="showAddCodeRule = true">创建第一个规则</el-button>
      </el-empty>

      <!-- 编码预览 -->
      <div v-if="generatedCodes.length > 0" class="code-preview">
        <h4>最近生成的编码</h4>
        <div class="code-list">
          <div v-for="(code, index) in generatedCodes" :key="index" class="code-item">
            <span class="code-value">{{ code.code }}</span>
            <span class="code-time">{{ code.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑编码规则对话框 -->
    <el-dialog 
      v-model="showAddCodeRule" 
      :title="editingCodeRule ? '编辑编码规则' : '新增编码规则'" 
      width="600px"
      append-to-body
    >
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
            <el-option label="订单编号" value="order" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="前缀">
          <el-input v-model="codeRuleForm.prefix" placeholder="如: INVOICE" />
        </el-form-item>
        
        <el-form-item label="后缀">
          <el-input v-model="codeRuleForm.suffix" placeholder="如: -01" />
        </el-form-item>
        
        <el-form-item label="起始编号">
          <el-input-number v-model="codeRuleForm.current_number" :min="0" />
        </el-form-item>
        
        <el-form-item label="编码格式" required>
          <el-input v-model="codeRuleForm.format" placeholder="如: {prefix}{year}{month}{number}{suffix}" />
          <div class="format-tips">
            <p>可用变量：</p>
            <div class="format-variables">
              <el-tag 
                v-for="variable in formatVariables" 
                :key="variable.name"
                size="small"
                class="variable-tag"
                @click="insertVariable(variable.name)"
              >
                {{ variable.name }} - {{ variable.description }}
              </el-tag>
            </div>
            <p class="preview-text">预览: <code>{{ formatPreview }}</code></p>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddCodeRule = false">取消</el-button>
        <el-button type="primary" @click="saveCodeRule">保存</el-button>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: Boolean,
  accountSet: Object
});

const emit = defineEmits(['update:modelValue']);

const dialogVisible = ref(false);
const showAddCodeRule = ref(false);
const codeRules = ref([]);
const editingCodeRule = ref(null);
const generatedCodes = ref([]);
const codeRuleForm = ref({
  name: '',
  type: '',
  prefix: '',
  suffix: '',
  current_number: 0,
  format: ''
});

const formatVariables = [
  { name: '{prefix}', description: '前缀' },
  { name: '{suffix}', description: '后缀' },
  { name: '{number}', description: '序号' },
  { name: '{year}', description: '年份' },
  { name: '{month}', description: '月份' },
  { name: '{day}', description: '日期' },
  { name: '{hour}', description: '小时' },
  { name: '{minute}', description: '分钟' }
];

const formatPreview = computed(() => {
  if (!codeRuleForm.value.format) return '';
  
  return codeRuleForm.value.format
    .replace('{prefix}', codeRuleForm.value.prefix || 'PRE')
    .replace('{suffix}', codeRuleForm.value.suffix || '')
    .replace('{number}', (codeRuleForm.value.current_number + 1).toString().padStart(4, '0'))
    .replace('{year}', new Date().getFullYear())
    .replace('{month}', (new Date().getMonth() + 1).toString().padStart(2, '0'))
    .replace('{day}', new Date().getDate().toString().padStart(2, '0'))
    .replace('{hour}', new Date().getHours().toString().padStart(2, '0'))
    .replace('{minute}', new Date().getMinutes().toString().padStart(2, '0'));
});

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
  if (val && props.accountSet) {
    loadCodeRules();
  }
});

watch(dialogVisible, (val) => {
  emit('update:modelValue', val);
});

const loadCodeRules = async () => {
  if (!props.accountSet) return;
  
  try {
    const response = await fetch(`/api/code-rules?account_set_id=${props.accountSet.id}`);
    if (response.ok) {
      codeRules.value = await response.json();
    }
  } catch (error) {
    console.error('加载编码规则失败:', error);
    ElMessage.error('加载编码规则失败');
  }
};

const saveCodeRule = async () => {
  if (!codeRuleForm.value.name || !codeRuleForm.value.type || !codeRuleForm.value.format) {
    ElMessage.error('请填写规则名称、类型和格式');
    return;
  }

  try {
    const url = editingCodeRule.value 
      ? `/api/code-rules/${editingCodeRule.value.id}`
      : '/api/code-rules';
    
    const method = editingCodeRule.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...codeRuleForm.value,
        account_set_id: props.accountSet.id
      })
    });
    
    if (response.ok) {
      showAddCodeRule.value = false;
      editingCodeRule.value = null;
      codeRuleForm.value = {
        name: '', type: '', prefix: '', suffix: '', current_number: 0, format: ''
      };
      await loadCodeRules();
      ElMessage.success(editingCodeRule.value ? '更新成功' : '创建成功');
    }
  } catch (error) {
    console.error('保存编码规则失败:', error);
    ElMessage.error('保存编码规则失败');
  }
};

const editCodeRule = (codeRule) => {
  editingCodeRule.value = codeRule;
  codeRuleForm.value = { ...codeRule };
  showAddCodeRule.value = true;
};

const deleteCodeRule = async (ruleId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个编码规则吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await fetch(`/api/code-rules/${ruleId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await loadCodeRules();
      ElMessage.success('删除成功');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除编码规则失败:', error);
      ElMessage.error('删除失败');
    }
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
      
      // 添加到生成记录
      generatedCodes.value.unshift({
        code: data.code,
        time: new Date().toLocaleTimeString(),
        rule: rule.name
      });
      
      // 只保留最近5条记录
      if (generatedCodes.value.length > 5) {
        generatedCodes.value = generatedCodes.value.slice(0, 5);
      }
      
      ElMessage.success(`生成的编码: ${data.code}`);
      await loadCodeRules();
    }
  } catch (error) {
    console.error('生成编码失败:', error);
    ElMessage.error('生成编码失败');
  }
};

const insertVariable = (variable) => {
  const currentFormat = codeRuleForm.value.format || '';
  const textarea = document.querySelector('.el-textarea__inner');
  
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newFormat = currentFormat.substring(0, start) + variable + currentFormat.substring(end);
    codeRuleForm.value.format = newFormat;
    
    // 聚焦到文本框并设置光标位置
    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  } else {
    codeRuleForm.value.format += variable;
  }
};

const getCodeTypeText = (type) => {
  const types = {
    invoice: '发票编号',
    receipt: '收据编号',
    contract: '合同编号',
    customer: '客户编码',
    project: '项目编码',
    order: '订单编号'
  };
  return types[type] || type;
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

.code-rule-actions {
  margin-bottom: 20px;
}

.code-preview {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.code-preview h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.code-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.code-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

.code-value {
  font-family: monospace;
  font-weight: 500;
  color: #409eff;
}

.code-time {
  font-size: 12px;
  color: #909399;
}

.format-tips {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.format-tips p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
}

.format-variables {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.variable-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.variable-tag:hover {
  transform: scale(1.05);
}

.preview-text {
  margin-top: 8px !important;
}

.preview-text code {
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
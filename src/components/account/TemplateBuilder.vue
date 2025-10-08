<template>
  <div class="template-builder">
    <div class="builder-toolbar">
      <div class="left">
        <span class="back-link" @click="goBackToTemplates">&lt; 返回模板管理</span>
        <span class="paper">纸张：{{ paperSize }}</span>
      </div>
      <div class="middle">
        <el-button-group>
          <el-button size="small" @click="insertToken(TOKENS.invoiceItems)">插入明细表格</el-button>
          <el-button size="small" @click="insertToken(TOKENS.logo)">插入LOGO</el-button>
          <el-button size="small" @click="insertToken(TOKENS.seal)">插入印章</el-button>
          <el-button size="small" @click="insertToken(TOKENS.signature)">插入签名</el-button>
        </el-button-group>
        <el-divider direction="vertical" />
        <span class="toolbar-label">缩放：</span>
        <el-button size="small" @click="zoomOut">-</el-button>
        <el-button size="small">{{ Math.round(zoom * 100) }}%</el-button>
        <el-button size="small" @click="zoomIn">+</el-button>
        <el-button size="small" @click="resetZoom">重置</el-button>
        <el-divider direction="vertical" />
        <span class="toolbar-label">字号：</span>
        <el-input-number v-model="fontSize" :min="8" :max="72" size="small" style="width:80px" @change="updateFontStyle" />
        <span class="toolbar-label">字体：</span>
        <el-select v-model="fontFamily" size="small" style="width:120px" @change="updateFontStyle">
          <el-option label="Arial" value="Arial, Helvetica, sans-serif" />
          <el-option label="微软雅黑" value="'Microsoft YaHei', '微软雅黑', Arial, sans-serif" />
          <el-option label="黑体" value="'SimHei', '黑体', Arial, sans-serif" />
          <el-option label="宋体" value="'SimSun', '宋体', serif" />
          <el-option label="Times" value="'Times New Roman', Times, serif" />
        </el-select>
      </div>
      <div class="right">
        <el-button-group>
          <el-button size="small" @click="toggleEditorMode">{{ editorMode === 'wysiwyg' ? '预览模式' : '编辑模式' }}</el-button>
          <el-button type="primary" size="small" @click="openHtmlEditor">编辑HTML</el-button>
        </el-button-group>
      </div>
    </div>
    
    <!-- 双栏布局：左侧组件，右侧预览 -->
    <div class="editor-main">
      <!-- 左侧组件列表 -->
      <div class="component-sidebar">
        <div class="sidebar-tabs">
          <div :class="['tab', {'active': activeTab === 'components'}]" @click="activeTab = 'components'">组件</div>
          <div :class="['tab', {'active': activeTab === 'fields'}]" @click="activeTab = 'fields'">字段</div>
        </div>
        
        <div v-if="activeTab === 'components'" class="component-list">
          <!-- 基础组件 -->
          <div class="component-group">
            <div class="group-title">基础组件</div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'heading')" @click="insertComponent('heading')">
              <div class="item-icon">H</div>
              <div class="item-label">标题</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'paragraph')" @click="insertComponent('paragraph')">
              <div class="item-icon">P</div>
              <div class="item-label">段落</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'divider')" @click="insertComponent('divider')">
              <div class="item-icon">—</div>
              <div class="item-label">分隔线</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'image')" @click="insertComponent('image')">
              <div class="item-icon">🖼️</div>
              <div class="item-label">图片</div>
            </div>
          </div>
          
          <!-- 布局组件 -->
          <div class="component-group">
            <div class="group-title">布局组件</div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'two-columns')" @click="insertComponent('two-columns')">
              <div class="item-icon">||</div>
              <div class="item-label">两列布局</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'three-columns')" @click="insertComponent('three-columns')">
              <div class="item-icon">|||</div>
              <div class="item-label">三列布局</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'header-footer')" @click="insertComponent('header-footer')">
              <div class="item-icon">⊥</div>
              <div class="item-label">页眉页脚</div>
            </div>
          </div>
          
          <!-- 发票组件 -->
          <div class="component-group">
            <div class="group-title">发票组件</div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'invoice-info')" @click="insertComponent('invoice-info')">
              <div class="item-icon">#</div>
              <div class="item-label">发票信息</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'customer-info')" @click="insertComponent('customer-info')">
              <div class="item-icon">👤</div>
              <div class="item-label">客户信息</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'supplier-info')" @click="insertComponent('supplier-info')">
              <div class="item-icon">🏢</div>
              <div class="item-label">供应商信息</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'item-table')" @click="insertComponent('item-table')">
              <div class="item-icon">📋</div>
              <div class="item-label">明细表格</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'totals')" @click="insertComponent('totals')">
              <div class="item-icon">💰</div>
              <div class="item-label">金额汇总</div>
            </div>
          </div>
          
          <!-- 账套组件 -->
          <div class="component-group">
            <div class="group-title">账套组件</div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'code-rule')" @click="insertComponent('code-rule')">
              <div class="item-icon">🔢</div>
              <div class="item-label">编号规则</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'account-set-info')" @click="insertComponent('account-set-info')">
              <div class="item-icon">📒</div>
              <div class="item-label">账套信息</div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'fields'" class="component-list">
          <!-- 发票字段 -->
          <div class="component-group">
            <div class="group-title">发票字段</div>
            <div class="field-list">
              <div class="field-item" draggable="true" v-for="field in invoiceFields" :key="field.id" 
                   @dragstart="handleFieldDragStart($event, field)" @click="insertField(field)">
                {{ field.label }}
              </div>
            </div>
          </div>
          
          <!-- 客户字段 -->
          <div class="component-group">
            <div class="group-title">客户字段</div>
            <div class="field-list">
              <div class="field-item" draggable="true" v-for="field in customerFields" :key="field.id" 
                   @dragstart="handleFieldDragStart($event, field)" @click="insertField(field)">
                {{ field.label }}
              </div>
            </div>
          </div>
          
          <!-- 账套字段 -->
          <div class="component-group">
            <div class="group-title">账套字段</div>
            <div class="field-list">
              <div class="field-item" draggable="true" v-for="field in accountSetFields" :key="field.id" 
                   @dragstart="handleFieldDragStart($event, field)" @click="insertField(field)">
                {{ field.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧预览区域 -->
      <div class="preview-container" ref="previewContainer">
        <div class="paper-preview" :style="paperStyle">
          <div class="paper-content" 
               ref="paperContent" 
               @click="handleContentClick"
               @dragover.prevent 
               @drop="handleDropComponent">
            <template v-if="editorMode === 'wysiwyg'">
              <div v-for="(component, index) in components" 
                   :key="index"
                   :class="['editor-component', {'selected': selectedComponentIndex === index}]"
                   :style="component.style"
                   @click.stop="selectComponent(index)"
                   draggable="true"
                   @dragstart="handleDragStart($event, index)"
                   @dragend="handleDragEnd">
                <div class="component-content" v-html="component.content"></div>
                <div class="component-controls" v-show="selectedComponentIndex === index">
                  <button class="control-btn delete-btn" @click.stop="deleteComponent(index)" title="删除">×</button>
                  <button class="control-btn move-btn" title="拖动">⋮⋮</button>
                </div>
              </div>
            </template>
            <div v-else v-html="previewContent"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- HTML编辑器对话框 -->
    <el-dialog
      v-model="htmlEditorVisible"
      title="HTML编辑器"
      width="80%"
      :before-close="closeHtmlEditor">
      <el-tabs v-model="editorTab">
        <el-tab-pane label="HTML编辑" name="html">
          <el-input
            v-model="htmlContent"
            type="textarea"
            :rows="20"
            placeholder="编辑HTML内容"
            class="html-editor"
          />
        </el-tab-pane>
        <el-tab-pane label="CSS样式" name="css">
          <el-input
            v-model="cssContent"
            type="textarea"
            :rows="20"
            placeholder="编辑CSS样式"
            class="css-editor"
          />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeHtmlEditor">取消</el-button>
          <el-button type="primary" @click="applyHtmlChanges">应用更改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, defineExpose } from 'vue';

// =====================================
// 属性和事件
// =====================================
const props = defineProps({
  modelValue: { type: String, default: '' },
  paperSize: { type: String, default: 'A4' }
});

const emit = defineEmits(['update:modelValue']);

// =====================================
// 状态变量
// =====================================
const previewContainer = ref(null);
const paperContent = ref(null);
const zoom = ref(1);
const fontSize = ref(12);
const fontFamily = ref("Arial, Helvetica, sans-serif");
const editorMode = ref('wysiwyg'); // 'wysiwyg' 或 'preview'
const activeTab = ref('components'); // 'components' 或 'fields'
const components = ref([]);
const selectedComponentIndex = ref(-1);
const draggedComponentType = ref(null);
const draggedComponent = ref(null);
const dragPosition = ref({ x: 0, y: 0 });

// HTML编辑器状态
const htmlEditorVisible = ref(false);
const htmlContent = ref('');
const cssContent = ref('');
const editorTab = ref('html');

// 字段列表
const invoiceFields = ref([
  { id: 'invoice_number', label: '发票号', value: '{{invoice_number}}' },
  { id: 'invoice_date', label: '发票日期', value: '{{invoice_date}}' },
  { id: 'due_date', label: '到期日', value: '{{due_date}}' },
  { id: 'subtotal', label: '小计', value: '{{subtotal}}' },
  { id: 'tax_amount', label: '税额', value: '{{tax_amount}}' },
  { id: 'discount_amount', label: '折扣', value: '{{discount_amount}}' },
  { id: 'total_amount', label: '合计', value: '{{total_amount}}' }
]);

const customerFields = ref([
  { id: 'customer_name', label: '客户名称', value: '{{customer_name}}' },
  { id: 'customer_address', label: '客户地址', value: '{{customer_address}}' },
  { id: 'customer_phone', label: '客户电话', value: '{{customer_phone}}' },
  { id: 'customer_email', label: '客户邮箱', value: '{{customer_email}}' },
  { id: 'customer_contact', label: '联系人', value: '{{customer_contact}}' }
]);

const accountSetFields = ref([
  { id: 'company_name', label: '公司名称', value: '{{company_name}}' },
  { id: 'company_address', label: '公司地址', value: '{{company_address}}' },
  { id: 'company_phone', label: '公司电话', value: '{{company_phone}}' },
  { id: 'company_email', label: '公司邮箱', value: '{{company_email}}' },
  { id: 'tax_id', label: '税号', value: '{{tax_id}}' }
]);

// 令牌（占位符）
const TOKENS = {
  invoiceItems: '{{invoice_items}}',
  logo: '<img src="{{company_logo}}" alt="LOGO" style="max-height:48px;"/>',
  seal: '<img src="{{company_seal}}" alt="SEAL" style="max-height:72px;"/>',
  signature: '<img src="{{signature}}" alt="SIGN" style="max-height:36px;"/>'
};

// 组件模板
const COMPONENTS = {
  'heading': '<h2 style="margin:8px 0">标题文本</h2>',
  'paragraph': '<p style="margin:6px 0">请输入文本内容...</p>',
  'divider': '<hr style="border:none;border-top:1px solid #ccc;margin:12px 0" />',
  'two-columns': `
    <div style="display:flex;width:100%;gap:16px">
      <div style="flex:1">左侧内容</div>
      <div style="flex:1">右侧内容</div>
    </div>
  `,
  'three-columns': `
    <div style="display:flex;width:100%;gap:12px">
      <div style="flex:1">第一列</div>
      <div style="flex:1">第二列</div>
      <div style="flex:1">第三列</div>
    </div>
  `,
  'invoice-info': `
    <div style="margin:6px 0">
      <div>发票号: {{invoice_number}}</div>
      <div>日期: {{invoice_date}}</div>
      <div>到期日: {{due_date}}</div>
    </div>
  `,
  'customer-info': `
    <div style="margin:6px 0">
      <div><strong>客户信息</strong></div>
      <div>{{customer_name}}</div>
      <div>{{customer_address}}</div>
      <div>电话: {{customer_phone}}</div>
    </div>
  `,
  'item-table': `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">#</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">产品</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">描述</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">数量</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">单位</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">单价</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">税率</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">折扣</th>
          <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">金额</th>
        </tr>
      </thead>
      <tbody>{{invoice_items}}</tbody>
    </table>
  `,
  'totals': `
    <table style="width:220px;border-collapse:collapse;margin-left:auto">
      <tr>
        <td style="text-align:left;padding:4px">小计:</td>
        <td style="text-align:right;padding:4px">{{subtotal}}</td>
      </tr>
      <tr>
        <td style="text-align:left;padding:4px">税额:</td>
        <td style="text-align:right;padding:4px">{{tax_amount}}</td>
      </tr>
      <tr>
        <td style="text-align:left;padding:4px">折扣:</td>
        <td style="text-align:right;padding:4px">{{discount_amount}}</td>
      </tr>
      <tr style="font-weight:bold">
        <td style="text-align:left;padding:4px;border-top:1px solid #ddd">合计:</td>
        <td style="text-align:right;padding:4px;border-top:1px solid #ddd">{{total_amount}}</td>
      </tr>
    </table>
  `
};

// 纸张尺寸计算
const paperSizes = {
  'A4': { width: '210mm', height: '297mm' },
  'A5': { width: '148mm', height: '210mm' },
  'B5': { width: '176mm', height: '250mm' },
  '80mm': { width: '80mm', height: 'auto' },
  '58mm': { width: '58mm', height: 'auto' }
};

// 计算纸张样式
const paperStyle = computed(() => {
  const size = paperSizes[props.paperSize] || paperSizes['A4'];
  return {
    width: size.width,
    minHeight: size.height === 'auto' ? '400px' : size.height,
    transform: `scale(${zoom.value})`,
    transformOrigin: 'top center',
    fontFamily: fontFamily.value,
    fontSize: `${fontSize.value}px`
  };
});

// 解析和准备初始内容
const templateData = ref({
  head: '',
  body: '<div class="page-content"><p>点击左侧组件或顶部按钮添加内容</p></div>',
  css: ''
});

// 预览内容
const previewContent = ref('');

// =====================================
// 初始化与解析
// =====================================

// 初始化组件
onMounted(() => {
  // 解析初始HTML
  parseTemplate(props.modelValue);
  
  // 从模板数据中解析组件
  parseComponentsFromTemplate();
  
  // 更新预览内容
  updatePreviewContent();
  
  // 监听窗口大小变化
  window.addEventListener('resize', updatePreviewStyle);
});

// 解析模板HTML
function parseTemplate(html) {
  if (!html) return;
  
  try {
    // 提取head内容
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) templateData.value.head = headMatch[1];
    
    // 提取style内容
    const styleMatch = templateData.value.head.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch) templateData.value.css = styleMatch[1];
    
    // 提取body内容
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      templateData.value.body = bodyMatch[1];
    } else {
      // 无完整HTML结构，将整个内容视为body
      templateData.value.body = html.trim();
    }

    // 如果body为空，添加默认内容
    if (!templateData.value.body.trim()) {
      templateData.value.body = '<div class="page-content"><p>点击左侧组件或顶部按钮添加内容</p></div>';
    }
    
    // 如果没有page-content类的容器，添加一个
    if (!templateData.value.body.includes('class="page-content"')) {
      templateData.value.body = `<div class="page-content">${templateData.value.body}</div>`;
    }
  } catch (error) {
    console.warn('解析模板失败，使用默认内容', error);
    templateData.value.body = '<div class="page-content"><p>点击左侧组件或顶部按钮添加内容</p></div>';
  }
}

// 更新预览内容
function updatePreviewContent() {
  previewContent.value = templateData.value.body;
  updateModelValue();
}

// 重建HTML并更新model
function updateModelValue() {
  const fullHtml = rebuildHtml(
    templateData.value.head,
    templateData.value.body,
    templateData.value.css
  );
  emit('update:modelValue', fullHtml);
}

// 重建完整HTML
function rebuildHtml(head, body, css = '') {
  // 从head中移除style标签
  let cleanHead = head || '';
  cleanHead = cleanHead.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // 创建样式标签
  const cssTag = css && css.trim() ? `<style>\n${css}\n</style>` : '';
  
  return `<!DOCTYPE html>
<html>
<head>
  ${cleanHead}
  ${cssTag}
</head>
<body>
  ${body || ''}
</body>
</html>`;
}

// =====================================
// 编辑器功能
// =====================================

// 插入组件
function insertComponent(componentType) {
  const componentHtml = COMPONENTS[componentType];
  if (!componentHtml) return;
  
  // 在组件数组中添加新组件
  components.value.push({
    type: componentType,
    content: componentHtml,
    style: {
      position: 'relative',
      margin: '8px 0'
    }
  });
  
  // 同时更新模板数据
  updateModelFromComponents();
}

// 更新组件到模板数据
function updateModelFromComponents() {
  let content = '';
  components.value.forEach(component => {
    content += component.content;
  });
  
  // 使用page-content容器包装
  const wrappedContent = `<div class="page-content">${content}</div>`;
  
  // 更新模板数据
  templateData.value.body = wrappedContent;
  updatePreviewContent();
}

// 从模板数据解析组件
function parseComponentsFromTemplate() {
  // 提取page-content内的内容
  const pageContentRegex = /<div\s+class="page-content"[^>]*>([\s\S]*?)<\/div>/i;
  const contentMatch = templateData.value.body.match(pageContentRegex);
  
  if (contentMatch && contentMatch[1]) {
    const content = contentMatch[1];
    
    // 解析组件
    // 这里简化处理，将内容按组件类型分割
    // 实际应用中可能需要更复杂的解析逻辑
    components.value = [];
    
    // 简单解析，将内容按常见HTML标签分割
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // 将DOM节点转换为组件对象
    Array.from(tempDiv.children).forEach((child) => {
      // 尝试判断组件类型
      let type = 'paragraph';
      if (child.tagName === 'H1' || child.tagName === 'H2' || child.tagName === 'H3') {
        type = 'heading';
      } else if (child.tagName === 'HR') {
        type = 'divider';
      } else if (child.tagName === 'TABLE') {
        if (child.innerHTML.includes('{{invoice_items}}')) {
          type = 'item-table';
        } else {
          type = 'totals';
        }
      } else if (child.tagName === 'DIV' && child.innerHTML.includes('display:flex')) {
        if (child.innerHTML.includes('三列')) {
          type = 'three-columns';
        } else {
          type = 'two-columns';
        }
      }
      
      components.value.push({
        type: type,
        content: child.outerHTML,
        style: {
          position: 'relative',
          margin: '8px 0'
        }
      });
    });
  }
}

// 选择组件
function selectComponent(index) {
  selectedComponentIndex.value = index;
}

// 删除组件
function deleteComponent(index) {
  components.value.splice(index, 1);
  selectedComponentIndex.value = -1;
  updateModelFromComponents();
}

// 处理组件拖拽开始
function handleComponentDragStart(event, componentType) {
  draggedComponentType.value = componentType;
  event.dataTransfer.setData('text/plain', componentType);
  event.dataTransfer.effectAllowed = 'copy';
}

// 处理字段拖拽开始
function handleFieldDragStart(event, field) {
  event.dataTransfer.setData('text/plain', JSON.stringify(field));
  event.dataTransfer.effectAllowed = 'copy';
}

// 处理组件拖动开始
function handleDragStart(event, index) {
  draggedComponent.value = components.value[index];
  selectedComponentIndex.value = index;
  event.dataTransfer.setData('text/plain', 'move-component');
  event.dataTransfer.effectAllowed = 'move';
  
  // 记录鼠标在组件内的位置，用于精确定位
  const rect = event.target.getBoundingClientRect();
  dragPosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

// 处理组件拖动结束
function handleDragEnd() {
  draggedComponentType.value = null;
  draggedComponent.value = null;
}

// 处理组件放置
function handleDropComponent(event) {
  event.preventDefault();
  
  const paperRect = paperContent.value.getBoundingClientRect();
  const x = event.clientX - paperRect.left;
  const y = event.clientY - paperRect.top;
  
  // 获取拖放的数据类型
  const data = event.dataTransfer.getData('text/plain');
  
  if (data === 'move-component' && draggedComponent.value) {
    // 移动现有组件
    const index = components.value.indexOf(draggedComponent.value);
    if (index !== -1) {
      const component = { ...components.value[index] };
      
      // 更新位置样式
      component.style = {
        ...component.style,
        position: 'absolute',
        left: `${x - dragPosition.value.x}px`,
        top: `${y - dragPosition.value.y}px`
      };
      
      // 更新组件
      components.value.splice(index, 1);
      components.value.push(component);
      selectedComponentIndex.value = components.value.length - 1;
      
      updateModelFromComponents();
    }
  } else if (draggedComponentType.value) {
    // 添加新组件
    const componentHtml = COMPONENTS[draggedComponentType.value];
    if (componentHtml) {
      const newComponent = {
        type: draggedComponentType.value,
        content: componentHtml,
        style: {
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`
        }
      };
      
      components.value.push(newComponent);
      selectedComponentIndex.value = components.value.length - 1;
      updateModelFromComponents();
    }
  } else {
    // 可能是字段拖放
    try {
      const fieldData = JSON.parse(data);
      if (fieldData && fieldData.value) {
        // 在拖放位置添加字段
        insertFieldAt(fieldData, x, y);
      }
    } catch (error) {
      console.error('无法解析拖放数据', error);
    }
  }
}

// 在指定位置插入字段
function insertFieldAt(field, x, y) {
  const fieldHtml = `<span style="padding:2px 4px;background:#f0f7ff;border:1px solid #d0e3ff;border-radius:3px;white-space:nowrap;">${field.value}</span>`;
  
  const newComponent = {
    type: 'field',
    content: fieldHtml,
    style: {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 10
    }
  };
  
  components.value.push(newComponent);
  selectedComponentIndex.value = components.value.length - 1;
  updateModelFromComponents();
}

// 插入字段（点击方式）
function insertField(field) {
  const fieldHtml = `<span style="padding:2px 4px;background:#f0f7ff;border:1px solid #d0e3ff;border-radius:3px;white-space:nowrap;">${field.value}</span>`;
  
  const newComponent = {
    type: 'field',
    content: fieldHtml,
    style: {
      position: 'relative',
      margin: '8px 0'
    }
  };
  
  components.value.push(newComponent);
  selectedComponentIndex.value = components.value.length - 1;
  updateModelFromComponents();
}

// 处理内容区域点击
function handleContentClick() {
  // 点击空白区域取消组件选择
  selectedComponentIndex.value = -1;
}

// 切换编辑模式
function toggleEditorMode() {
  editorMode.value = editorMode.value === 'wysiwyg' ? 'preview' : 'wysiwyg';
}

// 返回模板管理页面
function goBackToTemplates() {
  // 这里应该使用Vue Router导航
  // 如果没有router，可以使用window.history或emit事件
  if (window.history && window.history.back) {
    window.history.back();
  }
}

// 插入令牌
function insertToken(token) {
  if (!token) return;
  
  // 创建令牌组件
  let componentType = 'item-table';
  if (token === TOKENS.logo) {
    componentType = 'logo';
  } else if (token === TOKENS.seal) {
    componentType = 'seal';
  } else if (token === TOKENS.signature) {
    componentType = 'signature';
  }
  
  const newComponent = {
    type: componentType,
    content: token,
    style: {
      position: 'relative',
      margin: '8px 0'
    }
  };
  
  components.value.push(newComponent);
  selectedComponentIndex.value = components.value.length - 1;
  updateModelFromComponents();
}

// 缩放控制
function zoomIn() {
  zoom.value = Math.min(2, zoom.value + 0.1);
  updatePreviewStyle();
}

function zoomOut() {
  zoom.value = Math.max(0.2, zoom.value - 0.1);
  updatePreviewStyle();
}

function resetZoom() {
  zoom.value = 1;
  updatePreviewStyle();
}

// 更新预览样式
function updatePreviewStyle() {
  nextTick(() => {
    if (paperContent.value) {
      paperContent.value.style.fontFamily = fontFamily.value;
      paperContent.value.style.fontSize = `${fontSize.value}px`;
    }
  });
}

// =====================================
// HTML编辑器功能
// =====================================

// 打开HTML编辑器
function openHtmlEditor() {
  htmlContent.value = templateData.value.body;
  cssContent.value = templateData.value.css || '';
  htmlEditorVisible.value = true;
}

// 关闭HTML编辑器
function closeHtmlEditor() {
  htmlEditorVisible.value = false;
}

// 应用HTML更改
function applyHtmlChanges() {
  // 更新模板数据
  templateData.value.body = htmlContent.value;
  templateData.value.css = cssContent.value;
  
  // 从更新后的HTML中解析组件
  parseComponentsFromTemplate();
  
  // 更新预览
  updatePreviewContent();
  
  // 关闭对话框
  htmlEditorVisible.value = false;
}

// =====================================
// 监听属性变化
// =====================================
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    parseTemplate(newValue);
    parseComponentsFromTemplate();
    updatePreviewContent();
  }
});

watch(() => props.paperSize, () => {
  nextTick(updatePreviewStyle);
});

// 暴露方法给父组件
defineExpose({
  insertToken,
  openHtmlEditor
});
</script>

<style scoped>
/* 模板构建器样式 */
.template-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
  position: relative;
}

.builder-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.builder-toolbar .left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.builder-toolbar .right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.builder-toolbar .paper {
  font-size: 12px;
  color: #606266;
}

.builder-toolbar .toolbar-label {
  font-size: 12px;
  color: #606266;
  margin: 0 4px;
}

/* 编辑器主区域 */
.editor-main {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

/* 左侧组件栏 */
.component-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  background-color: #ffffff;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-title {
  margin: 0 0 12px 0;
  padding: 0 0 8px 0;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.component-group {
  margin-bottom: 16px;
}

.group-title {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #ebeef5;
}

.component-item {
  display: flex;
  align-items: center;
  padding: 6px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #fff;
}

.component-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 3px;
  margin-right: 8px;
  font-size: 12px;
}

.item-label {
  font-size: 12px;
}

/* 预览区域 */
.preview-container {
  flex: 1;
  padding: 24px;
  overflow: auto;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
}

.paper-preview {
  background-color: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  padding: 15mm;
  box-sizing: border-box;
  transform-origin: top center;
  transition: transform 0.2s ease;
}

.paper-content {
  position: relative;
  min-height: 200px;
}

/* 组件拖拽相关样式 */
.editor-component {
  position: relative;
  cursor: move;
  padding: 2px;
  border: 1px solid transparent;
  transition: all 0.2s;
  min-height: 20px;
}

.editor-component:hover {
  border: 1px dashed #ddd;
}

.editor-component.selected {
  border: 1px solid #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

.component-content {
  pointer-events: none;  /* 确保点击穿透到组件本身 */
}

.component-controls {
  position: absolute;
  right: -30px;
  top: 0;
  display: flex;
  flex-direction: column;
}

.control-btn {
  width: 24px;
  height: 24px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  margin-bottom: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  background: #fef0f0;
}

.move-btn {
  cursor: move;
}

.move-btn:hover {
  background: #ecf5ff;
}

/* HTML编辑器样式 */
.html-editor,
.css-editor {
  font-family: monospace;
}
</style>

<style>
/* 页面内容样式 */
.page-content {
  min-height: 400px;
}

.page-content * {
  box-sizing: border-box;
}

.page-content table {
  width: 100%;
  border-collapse: collapse;
}

.page-content td, 
.page-content th {
  border: 1px solid #ddd;
  padding: 8px;
}

.page-content hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 10px 0;
}
</style>
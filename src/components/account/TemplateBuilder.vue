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
          <el-button size="small" @click="openHtmlEditor">编辑HTML</el-button>
          <el-button type="primary" size="small" @click="saveTemplate">保存模板</el-button>
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
          <div :class="['tab', {'active': activeTab === 'style'}]" @click="activeTab = 'style'">样式</div>
          <div :class="['tab', {'active': activeTab === 'layout'}]" @click="activeTab = 'layout'">排版</div>
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
          
          <!-- 图形组件 -->
          <div class="component-group">
            <div class="group-title">图形组件</div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'horizontal-line')" @click="insertComponent('horizontal-line')">
              <div class="item-icon">—</div>
              <div class="item-label">水平线</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'vertical-line')" @click="insertComponent('vertical-line')">
              <div class="item-icon">|</div>
              <div class="item-label">垂直线</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'rectangle')" @click="insertComponent('rectangle')">
              <div class="item-icon">□</div>
              <div class="item-label">矩形</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'circle')" @click="insertComponent('circle')">
              <div class="item-icon">○</div>
              <div class="item-label">圆形</div>
            </div>
            <div class="component-item" draggable="true" @dragstart="handleComponentDragStart($event, 'rounded-rectangle')" @click="insertComponent('rounded-rectangle')">
              <div class="item-icon">⬭</div>
              <div class="item-label">圆角矩形</div>
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
          <!-- 字段分类选择器 -->
          <div class="field-filter">
            <el-radio-group v-model="fieldCategory" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="basic">基础</el-radio-button>
              <el-radio-button label="amount">金额</el-radio-button>
              <el-radio-button label="contact">联系</el-radio-button>
              <el-radio-button label="other">其他</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 发票字段 -->
          <div class="component-group">
            <div class="group-title">发票字段</div>
            <div class="field-list">
              <div class="field-item" draggable="true" v-for="field in filteredInvoiceFields" :key="field.id" 
                   @dragstart="handleFieldDragStart($event, field)" @click="insertField(field)">
                {{ field.label }}
              </div>
            </div>
          </div>
          
          <!-- 客户字段 -->
          <div class="component-group">
            <div class="group-title">客户字段</div>
            <div class="field-list">
              <div class="field-item" draggable="true" v-for="field in filteredCustomerFields" :key="field.id" 
                   @dragstart="handleFieldDragStart($event, field)" @click="insertField(field)">
                {{ field.label }}
              </div>
            </div>
          </div>
          
          <!-- 账套字段 -->
          <div class="component-group">
            <div class="group-title">账套字段</div>
            <div class="field-list">
              <div class="field-item" draggable="true" v-for="field in filteredAccountSetFields" :key="field.id" 
                   @dragstart="handleFieldDragStart($event, field)" @click="insertField(field)">
                {{ field.label }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 样式选项卡 -->
        <div v-if="activeTab === 'style'" class="component-list">
          <!-- 字体样式 -->
          <div class="component-group">
            <div class="group-title">字体样式</div>
            
            <div class="style-control">
              <div class="style-label">字体</div>
              <el-select v-model="selectedFontFamily" size="small" style="width:100%" @change="applyFontStyle">
                <el-option label="默认" value="inherit" />
                <el-option label="Arial" value="Arial, Helvetica, sans-serif" />
                <el-option label="微软雅黑" value="'Microsoft YaHei', '微软雅黑', Arial, sans-serif" />
                <el-option label="黑体" value="'SimHei', '黑体', Arial, sans-serif" />
                <el-option label="宋体" value="'SimSun', '宋体', serif" />
                <el-option label="Times" value="'Times New Roman', Times, serif" />
              </el-select>
            </div>
            
            <div class="style-control">
              <div class="style-label">字号</div>
              <el-input-number v-model="selectedFontSize" :min="8" :max="72" size="small" @change="applyFontStyle" />
            </div>
            
            <div class="style-control">
              <div class="style-label">颜色</div>
              <el-color-picker v-model="selectedTextColor" size="small" @change="applyFontStyle" />
            </div>
            
            <div class="style-control">
              <div class="style-label">样式</div>
              <div class="text-style-buttons">
                <el-button size="small" :class="{'is-active': selectedBold}" @click="toggleBold">B</el-button>
                <el-button size="small" :class="{'is-active': selectedItalic}" @click="toggleItalic">I</el-button>
                <el-button size="small" :class="{'is-active': selectedUnderline}" @click="toggleUnderline">U</el-button>
              </div>
            </div>
          </div>
          
          <!-- 边框样式 -->
          <div class="component-group">
            <div class="group-title">边框样式</div>
            <div class="style-control">
              <div class="style-label">边框宽度</div>
              <el-input-number v-model="selectedBorderWidth" :min="0" :max="10" size="small" @change="applyBorderStyle" />
            </div>
            
            <div class="style-control">
              <div class="style-label">边框颜色</div>
              <el-color-picker v-model="selectedBorderColor" size="small" @change="applyBorderStyle" />
            </div>
            
            <div class="style-control">
              <div class="style-label">边框样式</div>
              <el-select v-model="selectedBorderStyle" size="small" style="width:100%" @change="applyBorderStyle">
                <el-option label="实线" value="solid" />
                <el-option label="虚线" value="dashed" />
                <el-option label="点线" value="dotted" />
                <el-option label="双线" value="double" />
              </el-select>
            </div>
            
            <div class="style-control">
              <div class="style-label">圆角</div>
              <el-input-number v-model="selectedBorderRadius" :min="0" :max="50" size="small" @change="applyBorderStyle" />
            </div>
          </div>
        </div>
        
        <!-- 排版选项卡 -->
        <div v-if="activeTab === 'layout'" class="component-list">
          <!-- 对齐方式 -->
          <div class="component-group">
            <div class="group-title">对齐方式</div>
            <div class="style-control">
              <div class="align-buttons">
                <el-button-group>
                  <el-button size="small" @click="applyAlignment('left')"><i class="el-icon-align-left"></i></el-button>
                  <el-button size="small" @click="applyAlignment('center')"><i class="el-icon-align-center"></i></el-button>
                  <el-button size="small" @click="applyAlignment('right')"><i class="el-icon-align-right"></i></el-button>
                  <el-button size="small" @click="applyAlignment('justify')"><i class="el-icon-menu"></i></el-button>
                </el-button-group>
              </div>
            </div>
          </div>
          
          <!-- 间距和边距 -->
          <div class="component-group">
            <div class="group-title">间距和边距</div>
            <div class="style-control">
              <div class="style-label">上边距</div>
              <el-input-number v-model="selectedMarginTop" :min="0" :max="100" size="small" @change="applyMargin" />
            </div>
            
            <div class="style-control">
              <div class="style-label">右边距</div>
              <el-input-number v-model="selectedMarginRight" :min="0" :max="100" size="small" @change="applyMargin" />
            </div>
            
            <div class="style-control">
              <div class="style-label">下边距</div>
              <el-input-number v-model="selectedMarginBottom" :min="0" :max="100" size="small" @change="applyMargin" />
            </div>
            
            <div class="style-control">
              <div class="style-label">左边距</div>
              <el-input-number v-model="selectedMarginLeft" :min="0" :max="100" size="small" @change="applyMargin" />
            </div>
            
            <div class="style-control">
              <div class="style-label">内边距</div>
              <el-input-number v-model="selectedPadding" :min="0" :max="100" size="small" @change="applyPadding" />
            </div>
          </div>
          
          <!-- 尺寸 -->
          <div class="component-group">
            <div class="group-title">尺寸</div>
            <div class="style-control">
              <div class="style-label">宽度</div>
              <el-input v-model="selectedWidth" size="small" @change="applySize">
                <template #append>
                  <el-select v-model="selectedWidthUnit" style="width:60px">
                    <el-option label="px" value="px" />
                    <el-option label="%" value="%" />
                    <el-option label="auto" value="auto" />
                  </el-select>
                </template>
              </el-input>
            </div>
            
            <div class="style-control">
              <div class="style-label">高度</div>
              <el-input v-model="selectedHeight" size="small" @change="applySize">
                <template #append>
                  <el-select v-model="selectedHeightUnit" style="width:60px">
                    <el-option label="px" value="px" />
                    <el-option label="%" value="%" />
                    <el-option label="auto" value="auto" />
                  </el-select>
                </template>
              </el-input>
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
                   @dblclick.stop="editComponentText(index)"
                   draggable="true"
                   @dragstart="handleDragStart($event, index)"
                   @dragend="handleDragEnd">
                <div class="component-content" v-if="editingComponentIndex !== index" v-html="component.content"></div>
                <div class="component-content editing" v-else>
                  <textarea v-model="editingText" @blur="saveEditedText" @keydown.enter.prevent="saveEditedText"></textarea>
                </div>
                <div class="component-controls" v-show="selectedComponentIndex === index">
                  <button class="control-btn delete-btn" @click.stop="deleteComponent(index)" title="删除">×</button>
                  <button class="control-btn move-btn" title="拖动">⋮⋮</button>
                  <button class="control-btn edit-btn" @click.stop="editComponentText(index)" title="编辑文本">✎</button>
                  <div class="resize-handle" @mousedown.stop="startResize($event, index)" title="调整大小"></div>
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
import { ElMessage } from 'element-plus';

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
const activeTab = ref('components'); // 'components', 'fields', 'style', 或 'layout'
const components = ref([]);
const selectedComponentIndex = ref(-1);
const draggedComponentType = ref(null);
const draggedComponent = ref(null);
const dragPosition = ref({ x: 0, y: 0 });
const textEditMode = ref(false);
const editingText = ref('');
const editingComponentIndex = ref(-1);
const isResizing = ref(false);
const resizeStartPos = ref({ x: 0, y: 0 });
const resizeStartDimensions = ref({ width: 0, height: 0 });

// 字段过滤
const fieldCategory = ref('all');

// 样式选项
const selectedFontFamily = ref("Arial, Helvetica, sans-serif");
const selectedFontSize = ref(12);
const selectedTextColor = ref("#000000");
const selectedBold = ref(false);
const selectedItalic = ref(false);
const selectedUnderline = ref(false);

// 边框选项
const selectedBorderWidth = ref(1);
const selectedBorderColor = ref("#000000");
const selectedBorderStyle = ref('solid');
const selectedBorderRadius = ref(0);

// 排版选项
const selectedMarginTop = ref(8);
const selectedMarginRight = ref(0);
const selectedMarginBottom = ref(8);
const selectedMarginLeft = ref(0);
const selectedPadding = ref(0);
const selectedWidth = ref('auto');
const selectedWidthUnit = ref('auto');
const selectedHeight = ref('auto');
const selectedHeightUnit = ref('auto');

// HTML编辑器状态
const htmlEditorVisible = ref(false);
const htmlContent = ref('');
const cssContent = ref('');
const editorTab = ref('html');

// 字段列表
const invoiceFields = ref([
  // 基础信息
  { id: 'invoice_number', label: '发票号码', value: '{{invoice_number}}', category: '基础' },
  { id: 'invoice_code', label: '发票代码', value: '{{invoice_code}}', category: '基础' },
  { id: 'invoice_date', label: '开票日期', value: '{{invoice_date}}', category: '基础' },
  { id: 'invoice_month', label: '所属月份', value: '{{invoice_month}}', category: '基础' },
  { id: 'due_date', label: '到期日期', value: '{{due_date}}', category: '基础' },
  { id: 'check_code', label: '校验码', value: '{{check_code}}', category: '基础' },
  { id: 'invoice_status', label: '发票状态', value: '{{invoice_status}}', category: '基础' },
  { id: 'invoice_type', label: '发票类型', value: '{{invoice_type}}', category: '基础' },
  { id: 'invoice_currency', label: '币种', value: '{{invoice_currency}}', category: '基础' },
  
  // 金额相关
  { id: 'subtotal', label: '金额小计', value: '{{subtotal}}', category: '金额' },
  { id: 'tax_rate', label: '税率', value: '{{tax_rate}}', category: '金额' },
  { id: 'tax_amount', label: '税额', value: '{{tax_amount}}', category: '金额' },
  { id: 'discount_rate', label: '折扣率', value: '{{discount_rate}}', category: '金额' },
  { id: 'discount_amount', label: '折扣金额', value: '{{discount_amount}}', category: '金额' },
  { id: 'total_amount', label: '价税合计', value: '{{total_amount}}', category: '金额' },
  { id: 'amount_in_words', label: '金额大写', value: '{{amount_in_words}}', category: '金额' },
  { id: 'paid_amount', label: '已付金额', value: '{{paid_amount}}', category: '金额' },
  { id: 'remaining_amount', label: '未付金额', value: '{{remaining_amount}}', category: '金额' },
  
  // 项目信息
  { id: 'project_id', label: '项目编号', value: '{{project_id}}', category: '项目' },
  { id: 'project_name', label: '项目名称', value: '{{project_name}}', category: '项目' },
  { id: 'contract_number', label: '合同编号', value: '{{contract_number}}', category: '项目' },
  { id: 'order_number', label: '订单编号', value: '{{order_number}}', category: '项目' },
  
  // 备注信息
  { id: 'invoice_notes', label: '发票备注', value: '{{invoice_notes}}', category: '其他' },
  { id: 'payment_terms', label: '付款条款', value: '{{payment_terms}}', category: '其他' },
  { id: 'payment_method', label: '付款方式', value: '{{payment_method}}', category: '其他' },
  { id: 'reference_number', label: '参考编号', value: '{{reference_number}}', category: '其他' },
  { id: 'creator', label: '制单人', value: '{{creator}}', category: '其他' },
  { id: 'create_time', label: '制单时间', value: '{{create_time}}', category: '其他' },
  { id: 'reviewer', label: '审核人', value: '{{reviewer}}', category: '其他' },
  { id: 'review_time', label: '审核时间', value: '{{review_time}}', category: '其他' },
  { id: 'salespeople', label: '销售人员', value: '{{salespeople}}', category: '其他' }
]);

const customerFields = ref([
  // 基本信息
  { id: 'customer_name', label: '客户名称', value: '{{customer_name}}', category: '基础' },
  { id: 'customer_code', label: '客户编号', value: '{{customer_code}}', category: '基础' },
  { id: 'customer_type', label: '客户类型', value: '{{customer_type}}', category: '基础' },
  
  // 联系信息
  { id: 'customer_address', label: '客户地址', value: '{{customer_address}}', category: '联系' },
  { id: 'customer_city', label: '城市', value: '{{customer_city}}', category: '联系' },
  { id: 'customer_state', label: '省/州', value: '{{customer_state}}', category: '联系' },
  { id: 'customer_country', label: '国家', value: '{{customer_country}}', category: '联系' },
  { id: 'customer_postal_code', label: '邮编', value: '{{customer_postal_code}}', category: '联系' },
  { id: 'customer_phone', label: '客户电话', value: '{{customer_phone}}', category: '联系' },
  { id: 'customer_mobile', label: '手机', value: '{{customer_mobile}}', category: '联系' },
  { id: 'customer_fax', label: '传真', value: '{{customer_fax}}', category: '联系' },
  { id: 'customer_email', label: '客户邮箱', value: '{{customer_email}}', category: '联系' },
  { id: 'customer_website', label: '网站', value: '{{customer_website}}', category: '联系' },
  
  // 联系人信息
  { id: 'customer_contact', label: '联系人', value: '{{customer_contact}}', category: '联系人' },
  { id: 'contact_position', label: '职位', value: '{{contact_position}}', category: '联系人' },
  { id: 'contact_phone', label: '联系人电话', value: '{{contact_phone}}', category: '联系人' },
  { id: 'contact_email', label: '联系人邮箱', value: '{{contact_email}}', category: '联系人' }
]);

const accountSetFields = ref([
  // 公司信息
  { id: 'company_name', label: '公司名称', value: '{{company_name}}', category: '公司' },
  { id: 'company_code', label: '公司代码', value: '{{company_code}}', category: '公司' },
  { id: 'company_address', label: '公司地址', value: '{{company_address}}', category: '公司' },
  { id: 'company_city', label: '城市', value: '{{company_city}}', category: '公司' },
  { id: 'company_state', label: '省/州', value: '{{company_state}}', category: '公司' },
  { id: 'company_country', label: '国家', value: '{{company_country}}', category: '公司' },
  { id: 'company_postal_code', label: '邮编', value: '{{company_postal_code}}', category: '公司' },
  { id: 'company_phone', label: '公司电话', value: '{{company_phone}}', category: '公司' },
  { id: 'company_fax', label: '公司传真', value: '{{company_fax}}', category: '公司' },
  { id: 'company_email', label: '公司邮箱', value: '{{company_email}}', category: '公司' },
  { id: 'company_website', label: '公司网站', value: '{{company_website}}', category: '公司' },
  
  // 税务和银行信息
  { id: 'tax_id', label: '税号', value: '{{tax_id}}', category: '税务' },
  { id: 'bank_name', label: '开户银行', value: '{{bank_name}}', category: '银行' },
  { id: 'bank_account', label: '银行账号', value: '{{bank_account}}', category: '银行' },
  { id: 'bank_branch', label: '开户支行', value: '{{bank_branch}}', category: '银行' }
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
  // 文本组件
  'heading': '<h2 style="margin:8px 0">标题文本</h2>',
  'paragraph': '<p style="margin:6px 0">请输入文本内容...</p>',
  'divider': '<hr style="border:none;border-top:1px solid #ccc;margin:12px 0" />',
  
  // 布局组件
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
  
  // 线条和图形组件
  'horizontal-line': `<div style="width:100%;height:1px;background-color:#000;margin:10px 0;"></div>`,
  'vertical-line': `<div style="width:1px;height:100px;background-color:#000;margin:0 10px;display:inline-block;"></div>`,
  'rectangle': `<div style="width:100px;height:60px;border:1px solid #000;"></div>`,
  'circle': `<div style="width:60px;height:60px;border-radius:50%;border:1px solid #000;"></div>`,
  'rounded-rectangle': `<div style="width:100px;height:60px;border:1px solid #000;border-radius:8px;"></div>`,
  
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

// 过滤发票字段
const filteredInvoiceFields = computed(() => {
  if (fieldCategory.value === 'all') return invoiceFields.value;
  
  const categoryMap = {
    'basic': '基础',
    'amount': '金额',
    'contact': '联系',
    'other': '其他'
  };
  
  return invoiceFields.value.filter(field => 
    field.category === categoryMap[fieldCategory.value]
  );
});

// 过滤客户字段
const filteredCustomerFields = computed(() => {
  if (fieldCategory.value === 'all') return customerFields.value;
  
  const categoryMap = {
    'basic': '基础',
    'amount': '金额',
    'contact': '联系',
    'other': '其他'
  };
  
  return customerFields.value.filter(field => 
    field.category === categoryMap[fieldCategory.value]
  );
});

// 过滤账套字段
const filteredAccountSetFields = computed(() => {
  if (fieldCategory.value === 'all') return accountSetFields.value;
  
  const categoryMap = {
    'basic': '公司',
    'amount': '税务',
    'bank': '银行',
    'contact': '公司',  // 包含地址等联系信息
    'other': '其他'
  };
  
  // 如果是联系类别，需要特殊处理包含地址等信息
  if (fieldCategory.value === 'contact') {
    return accountSetFields.value.filter(field => 
      field.category === '公司' && ['company_address', 'company_city', 'company_state', 
      'company_country', 'company_postal_code', 'company_phone', 'company_fax', 
      'company_email', 'company_website'].includes(field.id)
    );
  }
  
  return accountSetFields.value.filter(field => 
    field.category === categoryMap[fieldCategory.value]
  );
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
  
  // 切换到样式选项卡并更新样式控制面板
  if (index !== -1) {
    activeTab.value = 'style';
    updateStyleControls();
  }
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

// 文本编辑功能
function editComponentText(index) {
  if (index >= 0 && index < components.value.length) {
    // 获取要编辑的组件
    const component = components.value[index];
    
    // 检查组件类型是否支持编辑
    if (component.type === 'heading' || component.type === 'paragraph' || component.type === 'field') {
      // 提取纯文本内容（去除HTML标签）
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = component.content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // 设置编辑状态
      editingComponentIndex.value = index;
      editingText.value = textContent;
      textEditMode.value = true;
    }
  }
}

// 保存编辑的文本
function saveEditedText() {
  if (editingComponentIndex.value !== -1) {
    const component = components.value[editingComponentIndex.value];
    
    // 根据组件类型创建正确的HTML
    let newContent = '';
    
    switch (component.type) {
      case 'heading':
        newContent = `<h2>${editingText.value}</h2>`;
        break;
      case 'paragraph':
        newContent = `<p>${editingText.value}</p>`;
        break;
      case 'field':
        newContent = `<span style="padding:2px 4px;background:#f0f7ff;border:1px solid #d0e3ff;border-radius:3px;">${editingText.value}</span>`;
        break;
      default:
        newContent = editingText.value;
    }
    
    // 更新组件内容
    component.content = newContent;
    
    // 重置编辑状态
    textEditMode.value = false;
    editingComponentIndex.value = -1;
    editingText.value = '';
    
    // 更新模板数据
    updateModelFromComponents();
  }
}

// 开始调整大小
function startResize(event, index) {
  if (index >= 0 && index < components.value.length) {
    isResizing.value = true;
    const component = components.value[index];
    
    // 记录初始位置和尺寸
    resizeStartPos.value = {
      x: event.clientX,
      y: event.clientY
    };
    
    // 提取当前宽度和高度
    const style = component.style || {};
    const width = style.width ? parseInt(style.width) : 100;
    const height = style.height ? parseInt(style.height) : 100;
    
    resizeStartDimensions.value = {
      width,
      height,
      index
    };
    
    // 添加鼠标移动和鼠标释放事件处理
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', endResize);
  }
}

// 处理调整大小
function handleResize(event) {
  if (!isResizing.value) return;
  
  const deltaX = event.clientX - resizeStartPos.value.x;
  const deltaY = event.clientY - resizeStartPos.value.y;
  
  const index = resizeStartDimensions.value.index;
  const component = components.value[index];
  
  const newWidth = Math.max(50, resizeStartDimensions.value.width + deltaX);
  const newHeight = Math.max(20, resizeStartDimensions.value.height + deltaY);
  
  // 更新组件样式
  component.style = {
    ...component.style,
    width: `${newWidth}px`,
    height: `${newHeight}px`
  };
  
  // 更新模型
  updateModelFromComponents();
}

// 结束调整大小
function endResize() {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
}

// 保存模板
function saveTemplate() {
  try {
    // 更新模板数据
    updateModelFromComponents();
    
    // 创建一个表单数据对象来保存模板信息
    const templateDataToSave = {
      id: props.templateId || Date.now().toString(),
      name: props.templateName || '新模板',
      type: props.templateType || 'invoice',
      content: JSON.stringify({
        body: templateData.value.body,
        head: templateData.value.head,
        css: cssContent.value
      })
    };
    
    // 触发保存事件，传递数据给父组件
    emit('save', templateDataToSave);
    
    // 显示保存成功消息
    ElMessage.success('模板保存成功!');
  } catch (error) {
    console.error('保存模板失败:', error);
    ElMessage.error('保存模板失败: ' + error.message);
  }
}

// =====================================
// 样式编辑功能
// =====================================

// 更新当前选中组件的样式状态
function updateStyleControls() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  const component = components.value[selectedComponentIndex.value];
  const content = component.content;
  const style = component.style || {};
  
  // 提取字体样式
  const fontRegex = /font-family:\s*([^;]+)/;
  const fontMatch = content.match(fontRegex);
  if (fontMatch) {
    selectedFontFamily.value = fontMatch[1].trim();
  } else {
    selectedFontFamily.value = "Arial, Helvetica, sans-serif";
  }
  
  // 提取字体大小
  const sizeRegex = /font-size:\s*(\d+)px/;
  const sizeMatch = content.match(sizeRegex);
  if (sizeMatch) {
    selectedFontSize.value = parseInt(sizeMatch[1]);
  } else {
    selectedFontSize.value = 12;
  }
  
  // 提取文本颜色
  const colorRegex = /color:\s*([^;]+)/;
  const colorMatch = content.match(colorRegex);
  if (colorMatch) {
    selectedTextColor.value = colorMatch[1].trim();
  } else {
    selectedTextColor.value = "#000000";
  }
  
  // 提取字体样式
  selectedBold.value = content.includes('font-weight: bold') || content.includes('font-weight:bold');
  selectedItalic.value = content.includes('font-style: italic') || content.includes('font-style:italic');
  selectedUnderline.value = content.includes('text-decoration: underline') || content.includes('text-decoration:underline');
  
  // 提取边框样式
  const borderWidthRegex = /border-width:\s*(\d+)px/;
  const borderWidthMatch = content.match(borderWidthRegex);
  if (borderWidthMatch) {
    selectedBorderWidth.value = parseInt(borderWidthMatch[1]);
  } else {
    selectedBorderWidth.value = 1;
  }
  
  // 提取边距
  if (style.margin) {
    const marginValues = style.margin.split(' ');
    if (marginValues.length === 1) {
      const value = parseInt(marginValues[0]);
      selectedMarginTop.value = value;
      selectedMarginRight.value = value;
      selectedMarginBottom.value = value;
      selectedMarginLeft.value = value;
    } else if (marginValues.length === 4) {
      selectedMarginTop.value = parseInt(marginValues[0]);
      selectedMarginRight.value = parseInt(marginValues[1]);
      selectedMarginBottom.value = parseInt(marginValues[2]);
      selectedMarginLeft.value = parseInt(marginValues[3]);
    }
  }
  
  // 提取内边距
  if (style.padding) {
    selectedPadding.value = parseInt(style.padding);
  }
  
  // 提取尺寸
  if (style.width) {
    if (style.width === 'auto') {
      selectedWidth.value = 'auto';
      selectedWidthUnit.value = 'auto';
    } else if (style.width.includes('%')) {
      selectedWidth.value = style.width.replace('%', '');
      selectedWidthUnit.value = '%';
    } else {
      selectedWidth.value = style.width.replace('px', '');
      selectedWidthUnit.value = 'px';
    }
  }
  
  if (style.height) {
    if (style.height === 'auto') {
      selectedHeight.value = 'auto';
      selectedHeightUnit.value = 'auto';
    } else if (style.height.includes('%')) {
      selectedHeight.value = style.height.replace('%', '');
      selectedHeightUnit.value = '%';
    } else {
      selectedHeight.value = style.height.replace('px', '');
      selectedHeightUnit.value = 'px';
    }
  }
}

// 应用字体样式
function applyFontStyle() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  const component = components.value[selectedComponentIndex.value];
  let content = component.content;
  
  // 移除旧的字体样式
  content = content.replace(/font-family:[^;]+;/g, '');
  content = content.replace(/font-size:[^;]+;/g, '');
  content = content.replace(/color:[^;]+;/g, '');
  
  // 查找样式标签
  const styleIndex = content.indexOf('style="');
  if (styleIndex !== -1) {
    const styleEnd = content.indexOf('"', styleIndex + 7);
    if (styleEnd !== -1) {
      // 在现有样式中添加新样式
      const styles = content.substring(styleIndex + 7, styleEnd);
      const newStyles = `${styles};font-family:${selectedFontFamily.value};font-size:${selectedFontSize.value}px;color:${selectedTextColor.value}`;
      content = content.substring(0, styleIndex + 7) + newStyles + content.substring(styleEnd);
    }
  } else {
    // 添加新的样式标签
    const tagEnd = content.indexOf('>');
    if (tagEnd !== -1) {
      content = content.substring(0, tagEnd) + ` style="font-family:${selectedFontFamily.value};font-size:${selectedFontSize.value}px;color:${selectedTextColor.value}"` + content.substring(tagEnd);
    }
  }
  
  component.content = content;
  updateModelFromComponents();
}

// 切换粗体
function toggleBold() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  selectedBold.value = !selectedBold.value;
  
  const component = components.value[selectedComponentIndex.value];
  let content = component.content;
  
  // 移除旧的粗体样式
  content = content.replace(/font-weight:[^;]+;/g, '');
  
  // 查找样式标签
  const styleIndex = content.indexOf('style="');
  if (styleIndex !== -1) {
    const styleEnd = content.indexOf('"', styleIndex + 7);
    if (styleEnd !== -1) {
      // 在现有样式中添加新样式
      const styles = content.substring(styleIndex + 7, styleEnd);
      const boldStyle = selectedBold.value ? 'font-weight:bold;' : '';
      const newStyles = `${styles};${boldStyle}`;
      content = content.substring(0, styleIndex + 7) + newStyles + content.substring(styleEnd);
    }
  } else if (selectedBold.value) {
    // 添加新的样式标签
    const tagEnd = content.indexOf('>');
    if (tagEnd !== -1) {
      content = content.substring(0, tagEnd) + ` style="font-weight:bold"` + content.substring(tagEnd);
    }
  }
  
  component.content = content;
  updateModelFromComponents();
}

// 切换斜体
function toggleItalic() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  selectedItalic.value = !selectedItalic.value;
  
  const component = components.value[selectedComponentIndex.value];
  let content = component.content;
  
  // 移除旧的斜体样式
  content = content.replace(/font-style:[^;]+;/g, '');
  
  // 查找样式标签
  const styleIndex = content.indexOf('style="');
  if (styleIndex !== -1) {
    const styleEnd = content.indexOf('"', styleIndex + 7);
    if (styleEnd !== -1) {
      // 在现有样式中添加新样式
      const styles = content.substring(styleIndex + 7, styleEnd);
      const italicStyle = selectedItalic.value ? 'font-style:italic;' : '';
      const newStyles = `${styles};${italicStyle}`;
      content = content.substring(0, styleIndex + 7) + newStyles + content.substring(styleEnd);
    }
  } else if (selectedItalic.value) {
    // 添加新的样式标签
    const tagEnd = content.indexOf('>');
    if (tagEnd !== -1) {
      content = content.substring(0, tagEnd) + ` style="font-style:italic"` + content.substring(tagEnd);
    }
  }
  
  component.content = content;
  updateModelFromComponents();
}

// 切换下划线
function toggleUnderline() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  selectedUnderline.value = !selectedUnderline.value;
  
  const component = components.value[selectedComponentIndex.value];
  let content = component.content;
  
  // 移除旧的下划线样式
  content = content.replace(/text-decoration:[^;]+;/g, '');
  
  // 查找样式标签
  const styleIndex = content.indexOf('style="');
  if (styleIndex !== -1) {
    const styleEnd = content.indexOf('"', styleIndex + 7);
    if (styleEnd !== -1) {
      // 在现有样式中添加新样式
      const styles = content.substring(styleIndex + 7, styleEnd);
      const underlineStyle = selectedUnderline.value ? 'text-decoration:underline;' : '';
      const newStyles = `${styles};${underlineStyle}`;
      content = content.substring(0, styleIndex + 7) + newStyles + content.substring(styleEnd);
    }
  } else if (selectedUnderline.value) {
    // 添加新的样式标签
    const tagEnd = content.indexOf('>');
    if (tagEnd !== -1) {
      content = content.substring(0, tagEnd) + ` style="text-decoration:underline"` + content.substring(tagEnd);
    }
  }
  
  component.content = content;
  updateModelFromComponents();
}

// 应用边框样式
function applyBorderStyle() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  const component = components.value[selectedComponentIndex.value];
  let content = component.content;
  
  // 移除旧的边框样式
  content = content.replace(/border:[^;]+;/g, '');
  content = content.replace(/border-radius:[^;]+;/g, '');
  
  // 构建新的边框样式
  const borderStyle = `border:${selectedBorderWidth.value}px ${selectedBorderStyle.value} ${selectedBorderColor.value};`;
  const borderRadiusStyle = selectedBorderRadius.value > 0 ? `border-radius:${selectedBorderRadius.value}px;` : '';
  
  // 查找样式标签
  const styleIndex = content.indexOf('style="');
  if (styleIndex !== -1) {
    const styleEnd = content.indexOf('"', styleIndex + 7);
    if (styleEnd !== -1) {
      // 在现有样式中添加新样式
      const styles = content.substring(styleIndex + 7, styleEnd);
      const newStyles = `${styles};${borderStyle}${borderRadiusStyle}`;
      content = content.substring(0, styleIndex + 7) + newStyles + content.substring(styleEnd);
    }
  } else {
    // 添加新的样式标签
    const tagEnd = content.indexOf('>');
    if (tagEnd !== -1) {
      content = content.substring(0, tagEnd) + ` style="${borderStyle}${borderRadiusStyle}"` + content.substring(tagEnd);
    }
  }
  
  component.content = content;
  updateModelFromComponents();
}

// 应用对齐方式
function applyAlignment(alignment) {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  const component = components.value[selectedComponentIndex.value];
  let content = component.content;
  
  // 移除旧的对齐方式
  content = content.replace(/text-align:[^;]+;/g, '');
  
  // 查找样式标签
  const styleIndex = content.indexOf('style="');
  if (styleIndex !== -1) {
    const styleEnd = content.indexOf('"', styleIndex + 7);
    if (styleEnd !== -1) {
      // 在现有样式中添加新样式
      const styles = content.substring(styleIndex + 7, styleEnd);
      const newStyles = `${styles};text-align:${alignment};`;
      content = content.substring(0, styleIndex + 7) + newStyles + content.substring(styleEnd);
    }
  } else {
    // 添加新的样式标签
    const tagEnd = content.indexOf('>');
    if (tagEnd !== -1) {
      content = content.substring(0, tagEnd) + ` style="text-align:${alignment};"` + content.substring(tagEnd);
    }
  }
  
  component.content = content;
  updateModelFromComponents();
}

// 应用边距
function applyMargin() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  const component = components.value[selectedComponentIndex.value];
  
  // 更新组件样式
  component.style = {
    ...component.style,
    margin: `${selectedMarginTop.value}px ${selectedMarginRight.value}px ${selectedMarginBottom.value}px ${selectedMarginLeft.value}px`
  };
  
  updateModelFromComponents();
}

// 应用内边距
function applyPadding() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  const component = components.value[selectedComponentIndex.value];
  
  // 更新组件样式
  component.style = {
    ...component.style,
    padding: `${selectedPadding.value}px`
  };
  
  updateModelFromComponents();
}

// 应用尺寸
function applySize() {
  if (selectedComponentIndex.value === -1 || !components.value[selectedComponentIndex.value]) return;
  
  const component = components.value[selectedComponentIndex.value];
  
  // 处理宽度
  let width = selectedWidth.value;
  if (selectedWidthUnit.value === '%') {
    width = `${width}%`;
  } else if (selectedWidthUnit.value === 'px') {
    width = `${width}px`;
  } else {
    width = 'auto';
  }
  
  // 处理高度
  let height = selectedHeight.value;
  if (selectedHeightUnit.value === '%') {
    height = `${height}%`;
  } else if (selectedHeightUnit.value === 'px') {
    height = `${height}px`;
  } else {
    height = 'auto';
  }
  
  // 更新组件样式
  component.style = {
    ...component.style,
    width,
    height
  };
  
  updateModelFromComponents();
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

/* 字段过滤器 */
.field-filter {
  margin-bottom: 12px;
  text-align: center;
}

/* 样式控制 */
.style-control {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.component-content {
  pointer-events: none;
}

.component-content.editing {
  pointer-events: auto;
  width: 100%;
  height: 100%;
}

.component-content.editing textarea {
  width: 100%;
  height: 100%;
  min-height: 40px;
  padding: 5px;
  border: 1px dashed #4b9fff;
  background: rgba(255, 255, 255, 0.9);
  resize: none;
}

.component-controls {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 5px;
}

.resize-handle {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  background-color: #4b9fff;
  border-radius: 50%;
  cursor: se-resize;
}

.style-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.text-style-buttons {
  display: flex;
  gap: 4px;
}

.text-style-buttons .el-button {
  flex: 1;
}

.text-style-buttons .is-active {
  background-color: #ecf5ff;
  color: #409eff;
  border-color: #c6e2ff;
}

.align-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

/* 样式选项卡内容 */
.component-list .el-button--small {
  height: 28px;
  padding: 0 8px;
}
</style>
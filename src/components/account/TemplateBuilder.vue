<template>
  <div class="template-builder">
    <div class="builder-toolbar">
      <div class="left">
        <el-tag size="small" type="info">可视化编辑器</el-tag>
        <span class="paper">纸张：{{ paperSize }}</span>
      </div>
      <div class="right">
        <el-button size="small" @click="insertToken(TOKENS.invoiceItems)">插入明细表格</el-button>
        <el-button size="small" @click="insertToken(TOKENS.logo)">插入LOGO</el-button>
        <el-button size="small" @click="insertToken(TOKENS.seal)">插入印章</el-button>
        <el-button size="small" @click="insertToken(TOKENS.signature)">插入签名</el-button>
        <el-divider direction="vertical" />
        <span class="toolbar-label">缩放：</span>
        <el-button size="small" @click="zoomOut">-</el-button>
        <el-button size="small">{{ Math.round(zoom * 100) }}%</el-button>
        <el-button size="small" @click="zoomIn">+</el-button>
        <el-button size="small" @click="fitToWidth">适配宽度</el-button>
        <el-button size="small" @click="fitToPage">整页</el-button>
        <el-divider direction="vertical" />
        <span class="toolbar-label">网格：</span>
        <el-switch v-model="showGrid" active-text="显示" inactive-text="隐藏" @change="applyGrid" />
        <el-checkbox v-model="snapToGrid" :disabled="!showGrid">吸附</el-checkbox>
        <el-input-number v-model="gridSize" :min="5" :step="5" size="small" style="width:110px" :disabled="!showGrid" />
        <el-divider direction="vertical" />
        <span class="toolbar-label">字号：</span>
        <el-input-number v-model="fontSize" :min="8" :max="72" size="small" style="width:110px" @change="applyFontSize" />
        <span class="toolbar-label">字体：</span>
        <el-select v-model="fontFamily" size="small" style="width:160px" @change="applyFontFamily">
          <el-option label="Arial" value="Arial, Helvetica, sans-serif" />
          <el-option label="微软雅黑" value="'Microsoft YaHei', '微软雅黑', Arial, sans-serif" />
          <el-option label="黑体" value="'SimHei', '黑体', Arial, sans-serif" />
          <el-option label="宋体" value="'SimSun', '宋体', serif" />
          <el-option label="Times" value="'Times New Roman', Times, serif" />
        </el-select>
        <span class="toolbar-label">颜色：</span>
        <input type="color" v-model="fontColor" @change="applyFontColor" class="color-input" />
      </div>
    </div>
    
    <!-- 主编辑区域 -->
    <div class="builder-main-area">
      <!-- 左侧组件栏 -->
      <div class="builder-sidebar">
        <div ref="blocksPanel" class="blocks-panel"></div>
      </div>
      
      <!-- 中央画布区域 -->
      <div class="builder-canvas-container">
        <!-- 加载和错误状态 -->
        <div v-if="loading" class="editor-status-overlay loading-overlay">
          <div class="status-content">
            <div class="spinner"></div>
            <p>正在加载可视化编辑器...</p>
          </div>
        </div>
        <div v-else-if="loadError" class="editor-status-overlay error-overlay">
          <div class="status-content">
            <div class="error-icon">!</div>
            <h3>加载失败</h3>
            <p>{{ loadError }}</p>
            <p>请检查网络连接或使用离线资源：</p>
            <ul>
              <li>在项目的 <code>public/libs/grapesjs/</code> 目录放入 <code>grapes.min.js</code> 与 <code>css/grapes.min.css</code></li>
              <li>刷新页面后将优先从本地加载</li>
            </ul>
          </div>
        </div>
        
        <!-- 编辑器容器 -->
        <div ref="editorContainer" class="editor-container"></div>
        
        <!-- 高度控制 -->
        <div class="canvas-height-control">
          <span>画布高度：</span>
          <el-slider v-model="editorHeight" :min="600" :max="1600" :step="50" show-stops style="width:240px" />
          <span>{{ editorHeight }}px</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, defineExpose } from 'vue';

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
const editorContainer = ref(null);
const blocksPanel = ref(null);
const loading = ref(true);
const loadError = ref('');
let editor = null;

// 画布设置
const editorHeight = ref(800);
const zoom = ref(1);
const showGrid = ref(false);
const snapToGrid = ref(false);
const gridSize = ref(10);

// 文本编辑设置
const fontFamily = ref("Arial, Helvetica, sans-serif");
const fontSize = ref(12);
const fontColor = ref('#333333');

// 令牌（占位符）
const TOKENS = {
  invoiceItems: '{{invoice_items}}',
  logo: '<img src="{{company_logo}}" alt="LOGO" style="max-height:48px;"/>',
  seal: '<img src="{{company_seal}}" alt="SEAL" style="max-height:72px;"/>',
  signature: '<img src="{{signature}}" alt="SIGN" style="max-height:36px;"/>'
};

// =====================================
// GrapesJS 加载
// =====================================

// 加载GrapesJS及其依赖项
async function loadGrapesJS() {
  try {
    // 优先尝试本地资源
    const localJS = '/libs/grapesjs/grapes.min.js';
    const localCSS = '/libs/grapesjs/css/grapes.min.css';
    
    // 添加CSS
    await loadCSS(localCSS).catch(() => {
      console.warn('无法加载本地CSS，尝试CDN');
      return loadCSS('https://unpkg.com/grapesjs@0.21.5/dist/css/grapes.min.css');
    });
    
    // 添加JS
    const grapesjs = await loadScript(localJS).catch(() => {
      console.warn('无法加载本地JS，尝试CDN');
      return loadScript('https://unpkg.com/grapesjs@0.21.5/dist/grapes.min.js');
    });
    
    return window.grapesjs;
  } catch (error) {
    console.error('GrapesJS加载失败:', error);
    throw new Error('无法加载编辑器资源，请检查网络连接或离线资源');
  }
}

// 加载CSS文件
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      return resolve();
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`无法加载样式: ${href}`));
    
    document.head.appendChild(link);
  });
}

// 加载JavaScript文件
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (window.grapesjs) {
      return resolve(window.grapesjs);
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      if (window.grapesjs) {
        resolve(window.grapesjs);
      } else {
        reject(new Error('GrapesJS未正确加载到全局对象'));
      }
    };
    script.onerror = () => reject(new Error(`无法加载脚本: ${src}`));
    
    document.body.appendChild(script);
  });
}

// =====================================
// 编辑器初始化
// =====================================

// 初始化编辑器
async function initEditor() {
  try {
    loading.value = true;
    loadError.value = '';
    
    // 确保容器已渲染
    await nextTick();
    if (!editorContainer.value || !blocksPanel.value) {
      throw new Error('编辑器容器未找到');
    }
    
    // 加载GrapesJS
    const grapesjs = await loadGrapesJS();
    
    // 解析现有HTML
    const templateData = parseTemplate(props.modelValue);
    
    // 创建编辑器实例
    editor = grapesjs.init({
      container: editorContainer.value,
      height: `${editorHeight.value}px`,
      width: '100%',
      // 不从元素加载内容，我们将手动设置
      fromElement: false,
      // 禁用存储
      storageManager: false,
      // 启用编辑功能和交互控件
      deviceManager: false,
      // 面板配置 - 添加基本面板以增强交互
      panels: { 
        defaults: [
          {
            id: 'basic-actions',
            buttons: [
              {
                id: 'undo',
                className: 'fa fa-undo',
                command: 'core:undo',
                attributes: { title: '撤销' }
              },
              {
                id: 'redo',
                className: 'fa fa-repeat',
                command: 'core:redo',
                attributes: { title: '重做' }
              }
            ],
          }
        ] 
      },
      // 区块管理器
      blockManager: {
        appendTo: blocksPanel.value
      },
      // 画布配置
      canvas: {
        styles: [],
        scripts: [],
        // 强制启用自动渲染
        autoscroll: true,
        autorender: true,
        // 启用交互选项
        customBadgeLabel: (component) => {
          return component.getName() || component.get('tagName');
        },
        // 确保可拖拽和调整大小
        dragMode: 'absolute',
        frameStyle: `
          body {
            background-color: #e9ecef;
            margin: 0;
            padding: 16px;
            min-height: 100%;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            position: relative;
          }
          .page {
            background: white;
            box-shadow: 0 0 8px rgba(0,0,0,0.15);
            margin: 0 auto;
            position: relative;
            min-height: 200px; /* 确保有足够高度可交互 */
          }
        `
      },
      // 选择器管理器
      selectorManager: {
        componentFirst: true
      },
      // 启用拖拽功能
      dragMode: 'absolute',
      // 启用调整大小
      resizer: {
        ratioDefault: true,
        // 优化调整大小的交互体验
        step: 1,
        // 显示调整大小控制点
        controlsVisible: true,
      },
      // 启用组件选择和移动功能
      allowScripts: false,
      avoidInlineStyle: false,
      // 添加文本编辑模式
      textEditMode: 'absolute',
      // 其他编辑器设置
      devices: [
        {
          name: '桌面',
          width: ''
        }
      ],
    });
    
    // 配置区块
    setupBlocks();
    
    // 设置内容
    let initialContent = '';
    if (templateData.body && templateData.body.includes('class="page"')) {
      // 已有带page容器的内容
      initialContent = templateData.body;
    } else {
      // 添加page容器包装
      const content = templateData.body || '<p>点击左侧区块或顶部按钮添加内容</p>';
      initialContent = `<div class="page">${content}</div>`;
    }
    
    editor.setComponents(initialContent);
    
    // 绑定事件
    setupEditorEvents(templateData.head);
    
    // 编辑器加载完成后
    editor.on('load', () => {
      console.log('编辑器加载完成');
      
      // 应用纸张尺寸
      applyPaperSize();
      
      // 连续尝试调整视图，确保显示正确
      setTimeout(fitToWidth, 100);
      setTimeout(fitToWidth, 300);
      setTimeout(fitToWidth, 500);
    });
    
    // 立即应用纸张尺寸
    applyPaperSize();
    
    loading.value = false;
  } catch (error) {
    console.error('初始化编辑器失败:', error);
    loadError.value = error.message || '初始化失败';
    loading.value = false;
  }
}

// 解析模板HTML
function parseTemplate(html) {
  const result = {
    head: '',
    body: ''
  };
  
  if (!html) return result;
  
  try {
    // 提取head内容
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) result.head = headMatch[1];
    
    // 提取body内容
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      result.body = bodyMatch[1];
    } else {
      // 无完整HTML结构，将整个内容视为body
      result.body = html.trim();
    }
  } catch (error) {
    console.warn('解析模板失败，将作为body内容处理', error);
    result.body = html || '';
  }
  
  return result;
}

// 重建完整HTML
function rebuildHtml(head, body, css = '') {
  const cssTag = css && css.trim() ? `<style>\n${css}\n</style>` : '';
  return `<!DOCTYPE html>
<html>
<head>
  ${head || ''}
  ${cssTag}
</head>
<body>
  ${body || ''}
</body>
</html>`;
}

// =====================================
// 编辑器配置
// =====================================

// 设置区块
function setupBlocks() {
  if (!editor) return;
  
  // 注册双击编辑命令
  editor.Commands.add('tlb-edit', {
    run(editor) {
      const selected = editor.getSelected();
      if (selected) {
        editor.runCommand('core:open-text-editor', { 
          target: selected 
        });
      }
    }
  });
  
  const bm = editor.BlockManager;
  
  // 基础元素
  bm.add('heading', {
    label: '标题',
    category: '基础',
    content: '<h2 style="margin:8px 0">标题文本</h2>',
    attributes: { class: 'fa fa-header' }
  });
  
  bm.add('paragraph', {
    label: '段落',
    category: '基础',
    content: '<p style="margin:6px 0">请输入文本内容...</p>',
  });
  
  bm.add('divider', {
    label: '分隔线',
    category: '基础',
    content: '<hr style="border:none;border-top:1px solid #ccc;margin:12px 0" />',
  });
  
  // 布局元素
  bm.add('two-columns', {
    label: '两列布局',
    category: '布局',
    content: `
      <div style="display:flex;width:100%;gap:16px">
        <div style="flex:1">左侧内容</div>
        <div style="flex:1">右侧内容</div>
      </div>
    `,
  });
  
  bm.add('three-columns', {
    label: '三列布局',
    category: '布局',
    content: `
      <div style="display:flex;width:100%;gap:12px">
        <div style="flex:1">第一列</div>
        <div style="flex:1">第二列</div>
        <div style="flex:1">第三列</div>
      </div>
    `,
  });
  
  // 发票元素
  bm.add('item-table', {
    label: '明细表格',
    category: '发票',
    content: `
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
  });
  
  bm.add('logo', {
    label: '公司LOGO',
    category: '发票',
    content: TOKENS.logo,
  });
  
  bm.add('seal', {
    label: '公司印章',
    category: '发票',
    content: TOKENS.seal,
  });
  
  bm.add('signature', {
    label: '签名',
    category: '发票',
    content: TOKENS.signature,
  });
  
  // 常用字段
  bm.add('invoice-info', {
    label: '发票信息',
    category: '发票',
    content: `
      <div style="margin:6px 0">
        <div>发票号: {{invoice_number}}</div>
        <div>日期: {{invoice_date}}</div>
        <div>到期日: {{due_date}}</div>
      </div>
    `,
  });
  
  bm.add('customer-info', {
    label: '客户信息',
    category: '发票',
    content: `
      <div style="margin:6px 0">
        <div><strong>客户信息</strong></div>
        <div>{{customer_name}}</div>
        <div>{{customer_address}}</div>
        <div>电话: {{customer_phone}}</div>
      </div>
    `,
  });
  
  bm.add('totals', {
    label: '金额汇总',
    category: '发票',
    content: `
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
    `,
  });
}

// 设置编辑器事件
function setupEditorEvents(initialHead) {
  if (!editor) return;
  
  // 内容变更时更新模型值
  const updateModelValue = () => {
    try {
      // 获取编辑内容
      const body = editor.getHtml();
      const css = editor.getCss();
      
      // 重建完整HTML
      const html = rebuildHtml(initialHead, body, css);
      
      // 发出更新事件
      emit('update:modelValue', html);
    } catch (error) {
      console.error('更新模型值失败', error);
    }
  };
  
  // 添加右键菜单支持
  editor.Commands.add('tlb-delete', {
    run(editor, sender) {
      const selectedComponent = editor.getSelected();
      if (selectedComponent) {
        selectedComponent.remove();
      }
    }
  });
  
  // 启用组件选择交互
  editor.on('component:selected', (component) => {
    console.log('组件已选中:', component.getId());
  });
  
  // 监听内容变化事件
  editor.on('component:add', updateModelValue);
  editor.on('component:remove', updateModelValue);
  editor.on('component:update', updateModelValue);
  editor.on('style:property:update', updateModelValue);
  
  // 启用组件双击编辑文本内容
  editor.on('component:dblclick', (component) => {
    if (component.get('type') === 'text' || component.get('tagName') === 'p' || 
        component.get('tagName') === 'h1' || component.get('tagName') === 'h2' ||
        component.get('tagName') === 'h3' || component.get('tagName') === 'span' ||
        component.get('tagName') === 'div') {
      editor.runCommand('tlb-edit');
    }
  });
  
  // 网格吸附
  editor.on('component:drag:end', (component) => {
    if (!snapToGrid.value || !component) return;
    
    try {
      const style = component.getStyle();
      const gs = Math.max(5, gridSize.value);
      
      // 四舍五入到网格
      const roundToGrid = (value) => {
        if (!value) return value;
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        return Math.round(numValue / gs) * gs + 'px';
      };
      
      // 计算吸附后的样式
      const newStyle = {};
      
      if (style.left) newStyle.left = roundToGrid(style.left);
      if (style.top) newStyle.top = roundToGrid(style.top);
      if (style.marginLeft) newStyle.marginLeft = roundToGrid(style.marginLeft);
      if (style.marginTop) newStyle.marginTop = roundToGrid(style.marginTop);
      
      // 应用新样式
      if (Object.keys(newStyle).length > 0) {
        component.addStyle(newStyle);
      }
    } catch (error) {
      console.warn('网格吸附失败', error);
    }
  });
}

// =====================================
// 页面与样式处理
// =====================================

// 应用纸张尺寸
function applyPaperSize() {
  if (!editor) return;
  
  try {
    // 获取文档
    const canvas = editor.Canvas;
    const document = canvas.getDocument();
    if (!document) return;
    
    // 获取尺寸配置
    const size = props.paperSize || 'A4';
    const paperSizes = {
      'A4': { width: '210mm', height: '297mm' },
      'A5': { width: '148mm', height: '210mm' },
      'B5': { width: '176mm', height: '250mm' },
      '80mm': { width: '80mm', height: 'auto' },
      '58mm': { width: '58mm', height: 'auto' }
    };
    
    const paperSize = paperSizes[size] || paperSizes['A4'];
    
    // 获取或创建页面容器
    let pageEl = document.querySelector('.page');
    if (!pageEl) {
      // 创建页面元素
      pageEl = document.createElement('div');
      pageEl.className = 'page';
      
      // 移动所有内容到页面容器
      const body = document.body;
      while (body.firstChild && !body.firstChild.classList?.contains('page')) {
        pageEl.appendChild(body.firstChild);
      }
      
      // 添加页面容器到文档
      document.body.appendChild(pageEl);
    }
    
    // 设置页面样式
    pageEl.style.width = paperSize.width;
    pageEl.style.minHeight = paperSize.height;
    pageEl.style.padding = '12mm';
    pageEl.style.boxSizing = 'border-box';
    pageEl.style.margin = '0 auto';
    pageEl.style.background = 'white';
    pageEl.style.boxShadow = '0 0 8px rgba(0,0,0,0.15)';
    pageEl.style.position = 'relative';
    
    // 添加视觉指示器（顶部蓝色边框）
    const indicatorId = 'page-indicator';
    let indicator = document.getElementById(indicatorId);
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = indicatorId;
      indicator.style.position = 'absolute';
      indicator.style.top = '0';
      indicator.style.left = '0';
      indicator.style.right = '0';
      indicator.style.height = '3px';
      indicator.style.backgroundColor = '#409EFF';
      indicator.style.zIndex = '9999';
      pageEl.appendChild(indicator);
    }
    
    // 应用网格（如果启用）
    applyGrid();
    
    // 适应宽度
    fitToWidth();
  } catch (error) {
    console.error('应用纸张尺寸失败', error);
  }
}

// 应用网格
function applyGrid() {
  if (!editor) return;
  
  try {
    const document = editor.Canvas.getDocument();
    if (!document) return;
    
    const body = document.body;
    
    if (showGrid.value) {
      // 设置网格大小
      const size = Math.max(5, gridSize.value);
      
      // 创建网格背景
      const gridBg = `
        linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
      `;
      
      // 应用网格样式
      body.style.backgroundImage = gridBg;
      body.style.backgroundSize = `${size}px ${size}px`;
    } else {
      // 移除网格样式
      body.style.backgroundImage = '';
      body.style.backgroundSize = '';
    }
  } catch (error) {
    console.warn('应用网格失败', error);
  }
}

// 适应宽度
function fitToWidth() {
  if (!editor) return;
  
  try {
    // 获取页面元素
    const document = editor.Canvas.getDocument();
    if (!document) return;
    
    const pageEl = document.querySelector('.page');
    if (!pageEl) {
      console.warn('页面元素不存在，无法适应宽度');
      return;
    }
    
    // 获取容器和页面宽度
    const containerWidth = editorContainer.value.clientWidth;
    const pageWidth = pageEl.offsetWidth;
    
    if (containerWidth <= 0 || pageWidth <= 0) {
      console.warn('容器或页面宽度无效', { containerWidth, pageWidth });
      return;
    }
    
    // 计算适合的缩放比例
    let scaleRatio = (containerWidth - 40) / pageWidth; // 减去边距
    scaleRatio = Math.min(Math.max(0.1, scaleRatio), 2.0); // 限制缩放范围
    
    // 应用缩放
    zoom.value = scaleRatio;
    editor.Canvas.setZoom(scaleRatio);
    
    console.log(`适应宽度: 容器=${containerWidth}px, 页面=${pageWidth}px, 缩放=${scaleRatio.toFixed(2)}`);
  } catch (error) {
    console.error('适应宽度失败', error);
  }
}

// 适应页面
function fitToPage() {
  if (!editor) return;
  
  try {
    // 获取页面元素
    const document = editor.Canvas.getDocument();
    if (!document) return;
    
    const pageEl = document.querySelector('.page');
    if (!pageEl) return;
    
    // 获取容器和页面尺寸
    const containerWidth = editorContainer.value.clientWidth;
    const containerHeight = editorContainer.value.clientHeight;
    const pageWidth = pageEl.offsetWidth;
    const pageHeight = pageEl.offsetHeight;
    
    if (containerWidth <= 0 || containerHeight <= 0 || pageWidth <= 0 || pageHeight <= 0) {
      return;
    }
    
    // 计算适合的缩放比例
    const widthRatio = (containerWidth - 40) / pageWidth;
    const heightRatio = (containerHeight - 40) / pageHeight;
    let scaleRatio = Math.min(widthRatio, heightRatio);
    scaleRatio = Math.min(Math.max(0.1, scaleRatio), 2.0);
    
    // 应用缩放
    zoom.value = scaleRatio;
    editor.Canvas.setZoom(scaleRatio);
  } catch (error) {
    console.error('适应页面失败', error);
  }
}

// =====================================
// 工具栏操作
// =====================================

// 插入令牌
function insertToken(token) {
  if (!editor || !token) return;
  
  try {
    // 获取当前选中的组件
    const selected = editor.getSelected();
    
    if (selected) {
      // 将令牌添加到选中组件中
      selected.append(token);
    } else {
      // 没有选中组件，添加到页面中
      editor.addComponents(token);
    }
  } catch (error) {
    console.error('插入令牌失败', error);
  }
}

// 缩放控制
function zoomIn() {
  if (!editor) return;
  zoom.value = Math.min(3, zoom.value + 0.1);
  editor.Canvas.setZoom(zoom.value);
}

function zoomOut() {
  if (!editor) return;
  zoom.value = Math.max(0.1, zoom.value - 0.1);
  editor.Canvas.setZoom(zoom.value);
}

// 样式应用
function applyFontSize() {
  const selected = editor?.getSelected();
  if (selected) {
    selected.addStyle({ 'font-size': `${fontSize.value}px` });
  }
}

function applyFontFamily() {
  const selected = editor?.getSelected();
  if (selected) {
    selected.addStyle({ 'font-family': fontFamily.value });
  }
}

function applyFontColor() {
  const selected = editor?.getSelected();
  if (selected) {
    selected.addStyle({ 'color': fontColor.value });
  }
}

// =====================================
// 生命周期钩子
// =====================================

// 监听属性变化
watch(() => props.paperSize, (newSize) => {
  if (editor) {
    applyPaperSize();
    setTimeout(fitToWidth, 100);
  }
});

watch(() => editorHeight.value, (newHeight) => {
  if (editor) {
    editor.setHeight(`${newHeight}px`);
  }
});

// 窗口调整大小处理
const handleResize = () => {
  if (editor) {
    setTimeout(() => {
      fitToWidth();
    }, 100);
  }
};

// 组件挂载
onMounted(async () => {
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
  
  // 初始化编辑器
  await initEditor();
});

// 组件卸载
onBeforeUnmount(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize);
  
  // 销毁编辑器
  if (editor) {
    editor.destroy();
    editor = null;
  }
});

// 暴露方法给父组件
defineExpose({
  insertToken,
  fitToWidth,
  fitToPage
});
</script>

<style scoped>
.template-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
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

.color-input {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.builder-main-area {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  position: relative;
  height: calc(100% - 46px); /* 减去工具栏高度 */
}

.builder-sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  background-color: #ffffff;
}

.blocks-panel {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

.builder-canvas-container {
  flex-grow: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-container {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}

.canvas-height-control {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #606266;
  gap: 8px;
}

/* 状态覆盖层 */
.editor-status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.status-content {
  max-width: 500px;
  padding: 24px;
  text-align: center;
}

/* 加载动画 */
.loading-overlay .spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误样式 */
.error-overlay {
  color: #cf1322;
}

.error-overlay .error-icon {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #fff2f0;
  border: 2px solid #ffccc7;
  margin: 0 auto 16px;
}

.error-overlay h3 {
  margin-bottom: 12px;
  font-size: 18px;
}

.error-overlay ul {
  text-align: left;
  margin: 16px 0;
  padding-left: 20px;
}

.error-overlay code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}
</style>

<style>
/* 全局样式，确保GrapesJS编辑器元素可见且可交互 */
.gjs-cv-canvas {
  width: 100% !important;
  height: 100% !important;
  top: 0 !important;
  pointer-events: auto !important;
  z-index: 1 !important;
}

.gjs-frame-wrapper {
  padding: 16px !important;
}

.gjs-frame {
  transform-origin: top left;
  pointer-events: auto !important; /* 确保框架元素可交互 */
  z-index: 1 !important;
}

/* 确保编辑器中的所有画布元素可交互 */
.gjs-cv-canvas, .gjs-pn-panels, .gjs-editor, .gjs-pn-views, .gjs-pn-views-container {
  pointer-events: auto !important;
}

/* 强制启用组件选择和交互 */
.gjs-comp-selected,
.gjs-comp-selected-parent,
.gjs-frame-wrapper * {
  pointer-events: auto !important;
}

/* 编辑器内的目标区域样式 */
.gjs-toolbar {
  background-color: #444 !important;
  z-index: 11 !important;
  pointer-events: auto !important;
}

.gjs-badge {
  background-color: #409eff !important;
  z-index: 10 !important;
  pointer-events: auto !important;
}

.gjs-highlighter, .gjs-highlighter-sel {
  outline: 2px solid #409eff !important;
  outline-offset: 1px;
  z-index: 9 !important;
  pointer-events: none !important;
}

/* 修复区块拖拽预览 */
.gjs-block__media {
  margin-bottom: 5px;
}

/* 修复拖放功能 */
.gjs-block {
  cursor: grab !important;
}

.gjs-block:active {
  cursor: grabbing !important;
}
</style>
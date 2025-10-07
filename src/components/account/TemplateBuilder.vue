<template>
  <div class="template-builder">
    <div class="builder-toolbar">
      <div class="left">
        <el-tag size="small" type="info">可视化编辑器</el-tag>
        <span class="paper">纸张：{{ paperSize }}</span>
      </div>

      <div class="right">
        <el-button size="small" @click="insertToken(TOKENS.invoiceItems)">插入明细表格</el-but    .then(() => {
      if (!editor) {
        throw new Error('编辑器实例未成功创建');
      }
      
      // 设置编辑器内容
      editor.setComponents(props.initialContent || getDefaultTemplate());
      
      // 监听编辑器内容变化
      editor.on('change:component', () => {
        // 不需要再使用 update:modelValue，因为我们使用 save 事件
      });
      
      // 设置画布大小
      updatePaperSize();
      
      // 清除加载状态
      loading.value = false;
      loadError.value = null;
      console.log('编辑器初始化成功');
    })
    .catch(err => {
      console.error('初始化编辑器失败:', err);
      loadError.value = err.message || '初始化编辑器失败';
      loading.value = false;
      
      // 如果有临时创建的容器，需要清理
      const tempContainer = document.getElementById('gjs-temp-container-' + Date.now());
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
    });utton size="small" @click="insertToken(TOKENS.logo)">插入LOGO</el-button>
        <el-button size="small" @click="insertToken(TOKENS.seal)">插入印章</el-button>
        <el-button size="small" @click="insertToken(TOKENS.signature)">插入签名</el-button>
        <el-divider direction="vertical" />
        <span class="toolbar-label">缩放：</span>
        <el-button size="small" @click="zoomOut">-</el-button>
        <span style="min-width: 40px; text-align: center">{{ Math.round(zoom * 100) }}%</span>
        <el-button size="small" @click="zoomIn">+</el-button>
        <el-button size="small" @click="fitToWidth">适配宽度</el-button>
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
            <p>可能的解决方案：</p>
            <ul>
              <li>确保网络连接正常</li>
              <li>使用离线资源：在项目的 <code>public/libs/grapesjs/</code> 目录放入 <code>grapes.min.js</code> 与 <code>css/grapes.min.css</code></li>
              <li>检查浏览器控制台是否有其他错误信息</li>
            </ul>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
              <el-button type="primary" @click="retryInitEditor">重试加载</el-button>
              <el-button @click="debugHelp">显示调试信息</el-button>
            </div>
          </div>
        </div>

        <!-- 编辑器画布 -->
        <div ref="canvasContainer" class="canvas-container"></div>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="builder-footer">
      <el-button type="primary" @click="saveTemplate">保存模板</el-button>
      <el-button @click="cancelEdit">取消编辑</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  initialContent: {
    type: String,
    default: ''
  },
  paperSize: {
    type: String,
    default: 'A4'
  }
});

const emit = defineEmits(['update:paperSize', 'save', 'cancel']);

// 状态变量
const loading = ref(true);
const loadError = ref(null);
const zoom = ref(1);
const canvasContainer = ref(null);
const blocksPanel = ref(null);
let editor = null;

// 常量
const TOKENS = {
  logo: '{company_logo}',
  seal: '{company_seal}',
  signature: '{signature}',
  invoiceItems: '<div class="invoice-items">' + 
    '<table style="width:100%; border-collapse: collapse;">' +
    '<thead><tr style="background-color: #f2f2f2;">' +
    '<th style="border: 1px solid #ddd; padding: 8px;">商品</th>' +
    '<th style="border: 1px solid #ddd; padding: 8px;">数量</th>' +
    '<th style="border: 1px solid #ddd; padding: 8px;">单价</th>' +
    '<th style="border: 1px solid #ddd; padding: 8px;">金额</th>' +
    '</tr></thead><tbody>' +
    '<tr><td style="border: 1px solid #ddd; padding: 8px;">{item_name}</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{quantity}</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{unit_price}</td>' +
    '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{amount}</td>' +
    '</tr></tbody>' +
    '<tfoot><tr>' +
    '<td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>总计：</strong></td>' +
    '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{total_amount}</td>' +
    '</tr></tfoot></table></div>'
};

  // 监听属性变化
watch(() => props.paperSize, updatePaperSize);
watch(() => props.initialContent, (val) => {
  if (editor && val !== getEditorContent()) {
    editor.setComponents(val || getDefaultTemplate());
  }
});

// 监听窗口大小变化，调整编辑器大小
const handleResize = () => {
  if (editor) {
    nextTick(() => fitToWidth());
  }
};

// 监听DOM更新
watch(canvasContainer, (newVal) => {
  console.log('画布容器引用更新:', newVal);
}, { immediate: true });// 初始化编辑器 - 使用更安全的加载策略
onMounted(() => {
  // 使用setTimeout确保DOM已完全渲染
  setTimeout(() => {
    console.log('组件已挂载，准备初始化编辑器');
    initEditor();
  }, 300);
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
});

// 清理资源
onBeforeUnmount(() => {
  console.log('组件卸载，清理GrapesJS资源...');
  try {
    // 移除窗口大小变化监听
    window.removeEventListener('resize', handleResize);
    
    // 销毁编辑器
    if (editor) {
      editor.destroy();
      editor = null;
    }
    
    // 清除临时创建的容器
    const tempContainer = document.getElementById('gjs-temp-container-' + Date.now());
    if (tempContainer) {
      document.body.removeChild(tempContainer);
    }
  } catch (err) {
    console.error('清理编辑器资源时出错:', err);
  }
});

// 完全重写的初始化逻辑
function initEditor() {
  console.log('开始初始化编辑器...');
  loading.value = true;
  loadError.value = null;
  
  // 1. 验证DOM元素
  if (!canvasContainer.value || !blocksPanel.value) {
    console.log('DOM元素尚未准备好，延迟初始化');
    setTimeout(initEditor, 300);
    return;
  }
  
  // 2. 加载CSS资源
  const loadCSS = () => {
    return new Promise((resolve) => {
      // 检查是否已加载
      const existingCSS = document.querySelector('link[href*="grapes.min.css"]');
      if (existingCSS) {
        console.log('GrapesJS CSS 已加载');
        return resolve();
      }
      
      console.log('加载 GrapesJS CSS...');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/libs/grapesjs/css/grapes.min.css';
      link.onload = () => {
        console.log('本地 CSS 加载成功');
        resolve();
      };
      link.onerror = () => {
        console.warn('本地 CSS 加载失败，尝试 CDN...');
        const cdnLink = document.createElement('link');
        cdnLink.rel = 'stylesheet';
        cdnLink.href = 'https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/css/grapes.min.css';
        cdnLink.onload = resolve;
        cdnLink.onerror = () => {
          console.error('CDN CSS 加载也失败了');
          resolve(); // 即使失败也继续
        };
        document.head.appendChild(cdnLink);
      };
      document.head.appendChild(link);
    });
  };
  
  // 3. 加载JS资源
  const loadJS = () => {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (window.grapesjs) {
        console.log('GrapesJS 已加载');
        return resolve();
      }
      
      console.log('加载 GrapesJS JS...');
      const script = document.createElement('script');
      script.src = '/libs/grapesjs/grapes.min.js';
      script.async = true;
      script.onload = () => {
        console.log('本地 JS 加载成功');
        resolve();
      };
      script.onerror = () => {
        console.warn('本地 JS 加载失败，尝试 CDN...');
        const cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/grapes.min.js';
        cdnScript.async = true;
        cdnScript.onload = resolve;
        cdnScript.onerror = () => {
          reject(new Error('无法加载 GrapesJS 资源'));
        };
        document.head.appendChild(cdnScript);
      };
      document.head.appendChild(script);
    });
  };
  
  // 4. 按顺序执行加载和初始化
  loadCSS()
    .then(() => loadJS())
    .then(() => {
      // 确保库已加载并且全局可用
      if (!window.grapesjs) {
        throw new Error('GrapesJS 全局对象不可用');
      }
      
      // 再次验证DOM元素
      if (!canvasContainer.value || !blocksPanel.value) {
        throw new Error('编辑器容器元素不存在');
      }
      
      return new Promise(resolve => setTimeout(() => resolve(), 200));
    })
    .then(() => {
      // 创建编辑器实例
      console.log('创建编辑器实例...');
      try {
        // 重要：确保DOM元素已准备就绪，并且已挂载到文档中
        if (!document.body.contains(canvasContainer.value)) {
          throw new Error('编辑器容器尚未挂载到DOM中');
        }
        
        // 创建一个临时DIV作为备用容器
        const tempContainer = document.createElement('div');
        tempContainer.id = 'gjs-temp-container-' + Date.now();
        tempContainer.style.cssText = 'width:100%;height:500px;display:none;';
        document.body.appendChild(tempContainer);
        
        // 尝试使用Vue ref，如果失败则使用临时容器
        const containerElement = canvasContainer.value || tempContainer;
        console.log('使用容器:', containerElement);
        
        editor = window.grapesjs.init({
          container: containerElement,
          height: '100%', 
          width: '100%',
          fromElement: false,
          storageManager: false,
          panels: { defaults: [] },
          deviceManager: { devices: [] },
        blockManager: {
          appendTo: blocksPanel.value,
          blocks: [
            {
              id: 'section',
              label: '<div>区块</div>',
              category: '基础元素',
              content: '<section class="section"><h2>区块标题</h2><div>区块内容</div></section>',
            },
            {
              id: 'text',
              label: '<div>文本</div>',
              category: '基础元素',
              content: '<div style="padding: 10px;">编辑这里的文字</div>',
            },
            {
              id: 'image',
              label: '<div>图片</div>',
              category: '基础元素',
              content: { type: 'image' },
            },
            {
              id: 'table',
              label: '<div>表格</div>',
              category: '基础元素',
              content: `
                <table style="width:100%; border-collapse: collapse;">
                  <thead>
                    <tr>
                      <th style="border: 1px solid #ddd; padding: 8px;">标题1</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">标题2</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">标题3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">内容1</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">内容2</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">内容3</td>
                    </tr>
                  </tbody>
                </table>
              `,
            },
            {
              id: 'invoice-details',
              label: '<div>发票明细表</div>',
              category: '业务组件',
              content: TOKENS.invoiceItems,
            },
            {
              id: 'company-header',
              label: '<div>公司抬头</div>',
              category: '业务组件',
              content: `
                <div class="company-header" style="display: flex; align-items: center; margin-bottom: 20px;">
                  <div class="logo" style="margin-right: 20px;">${TOKENS.logo}</div>
                  <div>
                    <h1 style="margin: 0 0 10px 0;">{company_name}</h1>
                    <div>{company_address}</div>
                    <div>电话: {company_phone} | 邮箱: {company_email}</div>
                  </div>
                </div>
              `,
            },
            {
              id: 'signature',
              label: '<div>签名区域</div>',
              category: '业务组件',
              content: `
                <div class="signatures" style="display: flex; justify-content: space-between; margin-top: 40px;">
                  <div>
                    <p>客户签名：</p>
                    <div style="height: 60px; width: 120px; border-bottom: 1px solid #000;"></div>
                  </div>
                  <div>
                    <p>公司盖章：</p>
                    <div style="height: 60px; width: 120px;">${TOKENS.seal}</div>
                  </div>
                </div>
              `,
            }
          ],
        },
      });
      
      // 设置编辑器内容
      editor.setComponents(props.initialContent || getDefaultTemplate());
      
      // 监听编辑器内容变化
      editor.on('change:component', () => {
        // 不需要再使用 update:modelValue，因为我们使用 save 事件
      });
      
      // 设置画布大小
      updatePaperSize();
      
      loading.value = false;
    } catch (err) {
      console.error('初始化编辑器失败:', err);
      loadError.value = err.message || '初始化编辑器失败';
      loading.value = false;
    }
  });
}

// 重试初始化编辑器
function retryInitEditor() {
  console.log('用户触发重试，重新加载GrapesJS...');
  loading.value = true;
  loadError.value = null;
  
  // 重置状态后重新初始化编辑器
  setTimeout(() => {
    initEditor();
  }, 100);
}

// 获取编辑器内容
function getEditorContent() {
  return editor ? editor.getHtml() : '';
}

// 保存模板
function saveTemplate() {
  emit('save', getEditorContent());
}

// 取消编辑
function cancelEdit() {
  emit('cancel');
}

// 更新纸张尺寸
function updatePaperSize() {
  if (!editor) return;
  
  const wrapper = editor.Canvas.getBody().querySelector('[data-gjs-type="wrapper"]');
  if (!wrapper) return;
  
  const sizes = {
    'A4': { width: '210mm', height: '297mm' },
    'A5': { width: '148mm', height: '210mm' },
    'B5': { width: '176mm', height: '250mm' },
    '80mm': { width: '80mm', height: 'auto', minHeight: '200mm' },
    '58mm': { width: '58mm', height: 'auto', minHeight: '200mm' },
  };
  
  const size = sizes[props.paperSize] || sizes['A4'];
  
  wrapper.style.width = size.width;
  wrapper.style.height = size.height;
  wrapper.style.minHeight = size.minHeight || 'auto';
  wrapper.style.margin = '0 auto';
  wrapper.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  wrapper.style.backgroundColor = '#fff';
  
  fitToWidth();
}

// 在编辑器光标位置插入令牌
function insertToken(token) {
  if (!editor) return;
  
  const selectedComponent = editor.getSelected();
  if (selectedComponent) {
    // 如果选择的是文本组件，将令牌插入内容中
    if (selectedComponent.is('text')) {
      const content = selectedComponent.get('content') || '';
      selectedComponent.set('content', content + token);
    } else {
      // 否则创建新的文本组件
      const component = editor.DomComponents.addComponent({
        type: 'text',
        content: token,
        style: { padding: '10px' }
      });
      selectedComponent.append(component);
    }
  } else {
    // 如果没有选择，就在画布顶部添加
    editor.DomComponents.addComponent({
      type: 'text',
      content: token,
      style: { padding: '10px' }
    });
  }
}

// 缩放操作
function zoomIn() {
  if (!editor) return;
  zoom.value = Math.min(2, zoom.value + 0.1);
  editor.Canvas.setZoom(zoom.value);
}

function zoomOut() {
  if (!editor) return;
  zoom.value = Math.max(0.3, zoom.value - 0.1);
  editor.Canvas.setZoom(zoom.value);
}

function fitToWidth() {
  if (!editor) return;
  
  // 获取画布容器宽度和模板宽度
  const canvasWidth = canvasContainer.value.clientWidth;
  const wrapper = editor.Canvas.getBody().querySelector('[data-gjs-type="wrapper"]');
  if (!wrapper) return;
  
  // 计算缩放比例（减去一些边距空间）
  const contentWidth = wrapper.offsetWidth;
  const scaleFactor = (canvasWidth - 60) / contentWidth;
  
  // 设置适当的缩放级别
  zoom.value = Math.min(1, scaleFactor);
  editor.Canvas.setZoom(zoom.value);
}

// 显示调试信息
function debugHelp() {
  let debugInfo = '';
  
  // 检查GrapesJS全局对象
  debugInfo += `GrapesJS全局对象: ${window.grapesjs ? '已加载' : '未加载'}\n`;
  
  // 检查DOM元素
  debugInfo += `画布容器元素: ${canvasContainer.value ? '存在' : '不存在'}\n`;
  debugInfo += `组件面板元素: ${blocksPanel.value ? '存在' : '不存在'}\n`;
  
  // 检查CSS资源
  const cssLoaded = document.querySelector('link[href*="grapes.min.css"]');
  debugInfo += `GrapesJS CSS: ${cssLoaded ? '已加载' : '未加载'}\n`;
  
  // 检查浏览器支持
  debugInfo += `浏览器信息: ${navigator.userAgent}\n`;
  
  // 显示调试信息
  ElMessage({
    type: 'info',
    message: '调试信息已打印到控制台',
    duration: 3000
  });
  
  // 将详细信息打印到控制台
  console.log('GrapesJS 调试信息:');
  console.log(debugInfo);
  console.log('DOM状态:', {
    canvasContainer: canvasContainer.value,
    blocksPanel: blocksPanel.value,
    document: document.readyState
  });
}

// 默认模板
function getDefaultTemplate() {
  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0;">{company_name}</h2>
          <p style="margin: 5px 0;">地址: {company_address}</p>
          <p style="margin: 5px 0;">电话: {company_phone}</p>
        </div>
        <div style="text-align: right;">
          <h1>发票</h1>
          <p>发票号: {invoice_number}</p>
          <p>日期: {current_date}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 5px;">收款方:</h3>
        <p style="margin: 0;">{customer_name}</p>
        <p style="margin: 0;">{customer_address}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">商品</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">数量</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">单价</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">金额</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">{item_name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{unit_price}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{amount}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>合计:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{total_amount}</td>
          </tr>
        </tfoot>
      </table>
      
      <div style="display: flex; justify-content: space-between;">
        <div>
          <p style="margin-bottom: 50px;">客户签名:</p>
          <div style="border-top: 1px solid black; width: 200px;"></div>
        </div>
        <div style="text-align: right;">
          <p>公司盖章:</p>
          <div style="height: 80px; width: 80px; margin-left: auto;">{company_seal}</div>
        </div>
      </div>
    </div>
  `;
}
</script>

<style scoped>
.template-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
}

.builder-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #ffffff;
  border-bottom: 1px solid #dcdfe6;
}

.builder-toolbar .left, 
.builder-toolbar .right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.paper {
  font-size: 14px;
  color: #606266;
  margin-left: 10px;
}

.toolbar-label {
  color: #606266;
  font-size: 14px;
}

.builder-main-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.builder-sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #dcdfe6;
  overflow-y: auto;
}

.blocks-panel {
  height: 100%;
  padding: 10px;
}

.builder-canvas-container {
  flex: 1;
  position: relative;
  overflow: auto;
  background-color: #ebeef5;
}

.canvas-container {
  min-height: 100%;
}

.builder-footer {
  padding: 15px;
  background-color: #ffffff;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #dcdfe6;
}

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
  z-index: 10;
}

.status-content {
  text-align: center;
  max-width: 500px;
  padding: 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  width: 50px;
  height: 50px;
  line-height: 50px;
  border-radius: 50%;
  background-color: #F56C6C;
  color: white;
  font-size: 30px;
  font-weight: bold;
  margin: 0 auto 15px;
}

/* GrapesJS样式覆盖 */
:deep(.gjs-cv-canvas) {
  background-color: #ebeef5;
}

:deep(.gjs-block) {
  display: flex;
  padding: 10px;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin: 10px 0;
  transition: all 0.3s;
}

:deep(.gjs-block:hover) {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>

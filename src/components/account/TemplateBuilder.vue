<template><template>

  <div class="template-editor-container">  <div class="template-builder">

    <div v-if="loading" class="editor-loading">    <div class="builder-toolbar">

      <el-spinner />      <div class="left">

      <p>加载编辑器中...</p>        <el-tag size="small" type="info">可视化编辑器</el-tag>

    </div>        <span class="paper">纸张：{{ paperSize }}</span>

          </div>

    <!-- 可视化编辑器工作区 -->      <div class="right">

    <div class="editor-workspace" v-show="!loading">        <el-button size="small" @click="insertToken(TOKENS.invoiceItems)">插入明细表格</el-button>

      <!-- 顶部工具栏 -->        <el-button size="small" @click="insertToken(TOKENS.logo)">插入LOGO</el-button>

      <div class="editor-toolbar">        <el-button size="small" @click="insertToken(TOKENS.seal)">插入印章</el-button>

        <div class="left-actions">        <el-button size="small" @click="insertToken(TOKENS.signature)">插入签名</el-button>

          <el-button size="small" @click="emitSave" type="primary">        <el-divider direction="vertical" />

            <el-icon><Check /></el-icon> 保存        <span class="toolbar-label">缩放：</span>

          </el-button>        <el-button size="small" @click="zoomOut">-</el-button>

          <el-button size="small" @click="emitCancel">        <span style="min-width: 40px; text-align: center">{{ Math.round(zoom * 100) }}%</span>

            <el-icon><Close /></el-icon> 取消        <el-button size="small" @click="zoomIn">+</el-button>

          </el-button>        <el-button size="small" @click="fitToWidth">适配宽度</el-button>

        </div>      </div>

            </div>

        <div class="center-actions">    

          <el-radio-group v-model="editorMode" size="small">    <!-- 主编辑区域 -->

            <el-radio-button label="visual">可视化编辑</el-radio-button>    <div class="builder-main-area">

            <el-radio-button label="code">源码编辑</el-radio-button>      <!-- 左侧组件栏 -->

          </el-radio-group>      <div class="builder-sidebar">

        </div>        <div ref="blocksPanel" class="blocks-panel"></div>

              </div>

        <div class="right-actions">      

          <el-select       <!-- 中央画布区域 -->

            v-model="paperSize"       <div class="builder-canvas-container">

            size="small"         <!-- 加载和错误状态 -->

            placeholder="选择纸张规格"        <div v-if="loading" class="editor-status-overlay loading-overlay">

            style="width: 120px;"          <div class="status-content">

            @change="handlePaperChange"            <div class="spinner"></div>

          >            <p>正在加载可视化编辑器...</p>

            <el-option label="A4 (210×297mm)" value="A4" />          </div>

            <el-option label="A5 (148×210mm)" value="A5" />        </div>

            <el-option label="B5 (176×250mm)" value="B5" />        <div v-else-if="loadError" class="editor-status-overlay error-overlay">

            <el-option label="80mm 小票" value="80mm" />          <div class="status-content">

            <el-option label="58mm 小票" value="58mm" />            <div class="error-icon">!</div>

          </el-select>            <h3>加载失败</h3>

                      <p>{{ loadError }}</p>

          <el-button size="small" @click="fitToPage">            <p>请检查网络连接或使用离线资源：</p>

            <el-icon><ZoomIn /></el-icon> 适应页面            <ul>

          </el-button>              <li>在项目的 <code>public/libs/grapesjs/</code> 目录放入 <code>grapes.min.js</code> 与 <code>css/grapes.min.css</code></li>

        </div>              <li>刷新页面后将优先从本地加载</li>

      </div>            </ul>

                  <el-button type="primary" @click="retryInitEditor">重试</el-button>

      <!-- 编辑区域 -->          </div>

      <div class="editor-content">        </div>

        <!-- 可视化编辑模式 -->        

        <div class="visual-editor" v-show="editorMode === 'visual'">        <!-- 编辑器容器 -->

          <div class="panels-container">        <div ref="editorContainer" class="editor-container"></div>

            <div id="gjs-blocks" class="panel-blocks"></div>      </div>

            <div id="gjs-editor" class="panel-editor"></div>    </div>

          </div>  </div>

        </div></template>

        

        <!-- 源码编辑模式 --><script setup>

        <div class="code-editor" v-show="editorMode === 'code'">import { ref, onMounted, onBeforeUnmount, watch, nextTick, defineExpose } from 'vue';

          <el-input 

            v-model="htmlContent" // =====================================

            type="textarea" // 属性和事件

            :rows="20" // =====================================

            placeholder="HTML模板代码"const props = defineProps({

            @input="updateVisualFromCode"  modelValue: { type: String, default: '' },

          />  paperSize: { type: String, default: 'A4' }

        </div>});

      </div>

    </div>const emit = defineEmits(['update:modelValue']);

  </div>

</template>// =====================================

// 状态变量

<script setup>// =====================================

import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';const editorContainer = ref(null);

import { ElMessage } from 'element-plus';const blocksPanel = ref(null);

import { Check, Close, ZoomIn } from '@element-plus/icons-vue';const loading = ref(true);

const loadError = ref('');

const props = defineProps({let editor = null;

  initialContent: {

    type: String,// 画布设置

    default: ''const zoom = ref(1);

  },

  paperSize: {// 令牌（占位符）

    type: String,const TOKENS = {

    default: 'A4'  invoiceItems: '{{invoice_items}}',

  }  logo: '<img src="{{company_logo}}" alt="LOGO" style="max-height:48px;"/>',

});  seal: '<img src="{{company_seal}}" alt="SEAL" style="max-height:72px;"/>',

  signature: '<img src="{{signature}}" alt="SIGN" style="max-height:36px;"/>'

const emit = defineEmits(['save', 'cancel', 'update:paperSize']);};



// 状态变量// =====================================

const loading = ref(true);// GrapesJS 加载

const editorMode = ref('visual');// =====================================

const htmlContent = ref(props.initialContent || getDefaultTemplate());

const paperSize = ref(props.paperSize);// 加载GrapesJS及其依赖项

const editor = ref(null);async function loadGrapesJS() {

const isUpdatingFromCode = ref(false);  try {

const isUpdatingFromVisual = ref(false);    if (window.grapesjs) {

      console.log('GrapesJS已加载，使用现有实例');

// 监听纸张尺寸变化      return window.grapesjs;

watch(() => paperSize.value, (newValue) => {    }

  emit('update:paperSize', newValue);    

  if (editor.value) {    console.log('开始加载GrapesJS资源...');

    updateCanvasSize();    

  }    // 优先尝试本地资源

});    const localJS = '/libs/grapesjs/grapes.min.js';

    const localCSS = '/libs/grapesjs/css/grapes.min.css';

// 监听模板内容变化    

watch(() => props.initialContent, (newValue) => {    // 添加CSS

  if (newValue !== undefined && newValue !== htmlContent.value) {    await loadCSS(localCSS).catch(() => {

    htmlContent.value = newValue || getDefaultTemplate();      console.warn('无法加载本地CSS，尝试CDN');

    if (editor.value && !isUpdatingFromVisual.value) {      return loadCSS('https://unpkg.com/grapesjs@0.21.5/dist/css/grapes.min.css');

      isUpdatingFromCode.value = true;    });

      editor.value.setComponents(htmlContent.value);    

      setTimeout(() => {    // 添加JS

        isUpdatingFromCode.value = false;    await loadScript(localJS).catch(() => {

      }, 100);      console.warn('无法加载本地JS，尝试CDN');

    }      return loadScript('https://unpkg.com/grapesjs@0.21.5/dist/grapes.min.js');

  }    });

});    

    if (!window.grapesjs) {

// 初始化编辑器      throw new Error('GrapesJS加载失败，全局对象不存在');

onMounted(async () => {    }

  await loadGrapesJS();    

  nextTick(() => initEditor());    console.log('GrapesJS资源加载成功');

});    return window.grapesjs;

  } catch (error) {

// 清理资源    console.error('GrapesJS加载失败:', error);

onBeforeUnmount(() => {    throw new Error('无法加载编辑器资源，请检查网络连接或离线资源');

  if (editor.value) {  }

    editor.value.destroy();}

    editor.value = null;

  }// 加载CSS文件

});function loadCSS(href) {

  return new Promise((resolve, reject) => {

// 加载GrapesJS资源    // 检查是否已经加载

async function loadGrapesJS() {    const existingLink = document.querySelector(`link[href="${href}"]`);

  loading.value = true;    if (existingLink) {

        console.log(`CSS已存在: ${href}`);

  try {      return resolve();

    // 检查是否已经加载了GrapesJS    }

    if (window.grapesjs) {    

      loading.value = false;    console.log(`加载CSS: ${href}`);

      return;    const link = document.createElement('link');

    }    link.rel = 'stylesheet';

        link.href = href;

    // 尝试从本地加载    

    const localScript = document.createElement('script');    link.onload = () => {

    localScript.src = '/libs/grapesjs/grapes.min.js';      console.log(`CSS加载成功: ${href}`);

          resolve();

    const localStyles = document.createElement('link');    };

    localStyles.rel = 'stylesheet';    

    localStyles.href = '/libs/grapesjs/css/grapes.min.css';    link.onerror = () => {

          console.error(`CSS加载失败: ${href}`);

    document.head.appendChild(localStyles);      reject(new Error(`无法加载样式: ${href}`));

        };

    // 监听脚本加载情况    

    const loadPromise = new Promise((resolve, reject) => {    document.head.appendChild(link);

      localScript.onload = resolve;  });

      localScript.onerror = () => {}

        // 本地加载失败，尝试从CDN加载

        console.warn('本地GrapesJS资源加载失败，尝试从CDN加载...');// 加载JavaScript文件

        function loadScript(src) {

        const cdnScript = document.createElement('script');  return new Promise((resolve, reject) => {

        cdnScript.src = 'https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/grapes.min.js';    // 检查是否已经加载

            if (window.grapesjs) {

        const cdnStyles = document.createElement('link');      console.log('GrapesJS已在全局对象中');

        cdnStyles.rel = 'stylesheet';      return resolve(window.grapesjs);

        cdnStyles.href = 'https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/css/grapes.min.css';    }

            

        document.head.appendChild(cdnStyles);    console.log(`加载JS: ${src}`);

            const script = document.createElement('script');

        cdnScript.onload = resolve;    script.src = src;

        cdnScript.onerror = () => reject(new Error('无法加载GrapesJS资源'));    script.async = true;

            

        document.head.appendChild(cdnScript);    script.onload = () => {

      };      if (window.grapesjs) {

    });        console.log(`JS加载成功: ${src}`);

            resolve(window.grapesjs);

    document.head.appendChild(localScript);      } else {

    await loadPromise;        console.error('JS加载但GrapesJS对象不存在');

            reject(new Error('GrapesJS未正确加载到全局对象'));

    loading.value = false;      }

  } catch (error) {    };

    console.error('加载GrapesJS失败:', error);    

    ElMessage.error('编辑器加载失败，请刷新页面重试');    script.onerror = () => {

    loading.value = false;      console.error(`JS加载失败: ${src}`);

  }      reject(new Error(`无法加载脚本: ${src}`));

}    };

    

// 初始化GrapesJS编辑器    document.body.appendChild(script);

function initEditor() {  });

  if (!window.grapesjs) {}

    ElMessage.error('编辑器资源加载失败');

    return;// =====================================

  }// 编辑器初始化

  // =====================================

  // 创建编辑器实例

  editor.value = window.grapesjs.init({// 初始化编辑器

    container: '#gjs-editor',async function initEditor() {

    height: '70vh',  try {

    width: '100%',    console.log('开始初始化编辑器...');

    fromElement: false,    loading.value = true;

    storageManager: false,    loadError.value = '';

    panels: { defaults: [] },    

    deviceManager: { devices: [] },    // 确保容器已渲染

    blockManager: {    await nextTick();

      appendTo: '#gjs-blocks',    

      blocks: [    if (!editorContainer.value) {

        {      throw new Error('编辑器容器未找到');

          id: 'section',    }

          label: '<div>区块</div>',    

          category: '基础元素',    // 加载GrapesJS

          content: '<section class="section"><h2>区块标题</h2><div>区块内容</div></section>',    const grapesjs = await loadGrapesJS();

        },    console.log('GrapesJS库加载完成');

        {    

          id: 'text',    // 解析现有HTML

          label: '<div>文本</div>',    let templateHtml = props.modelValue || '';

          category: '基础元素',    const templateData = parseTemplate(templateHtml);

          content: '<div style="padding: 10px;">编辑这里的文字</div>',    console.log('解析模板数据完成');

        },    

        {    // 确保编辑器容器可见且具有尺寸

          id: 'image',    editorContainer.value.style.display = 'block';

          label: '<div>图片</div>',    editorContainer.value.style.width = '100%';

          category: '基础元素',    editorContainer.value.style.height = '600px';

          content: { type: 'image' },    

        },    console.log('创建GrapesJS编辑器实例...');

        {    

          id: 'table',    // 创建编辑器实例

          label: '<div>表格</div>',    editor = grapesjs.init({

          category: '基础元素',      // 基本设置

          content: `      container: editorContainer.value,

            <table style="width:100%; border-collapse: collapse;">      height: '100%',

              <thead>      width: '100%',

                <tr>      

                  <th style="border: 1px solid #ddd; padding: 8px;">标题1</th>      // 不从元素加载内容，我们将手动设置

                  <th style="border: 1px solid #ddd; padding: 8px;">标题2</th>      fromElement: false,

                  <th style="border: 1px solid #ddd; padding: 8px;">标题3</th>      

                </tr>      // 禁用存储

              </thead>      storageManager: false,

              <tbody>      

                <tr>      // 调试模式（可以查看控制台中的日志）

                  <td style="border: 1px solid #ddd; padding: 8px;">内容1</td>      debug: true,

                  <td style="border: 1px solid #ddd; padding: 8px;">内容2</td>      

                  <td style="border: 1px solid #ddd; padding: 8px;">内容3</td>      // 面板配置

                </tr>      panels: { 

              </tbody>        defaults: [] // 不使用默认面板

            </table>      },

          `,      

        },      // 区块管理器

        {      blockManager: {

          id: 'invoice-details',        appendTo: blocksPanel.value

          label: '<div>发票明细表</div>',      },

          category: '业务组件',      

          content: `      // 画布配置

            <div class="invoice-details">      canvas: {

              <table style="width:100%; border-collapse: collapse;">        styles: [],

                <thead>        scripts: [],

                  <tr style="background-color: #f2f2f2;">        autoscroll: true,

                    <th style="border: 1px solid #ddd; padding: 8px;">序号</th>        frameStyle: `

                    <th style="border: 1px solid #ddd; padding: 8px;">商品名称</th>          body {

                    <th style="border: 1px solid #ddd; padding: 8px;">数量</th>            background-color: #f5f5f5 !important;

                    <th style="border: 1px solid #ddd; padding: 8px;">单价</th>            margin: 0;

                    <th style="border: 1px solid #ddd; padding: 8px;">金额</th>            padding: 20px;

                  </tr>            min-height: 100%;

                </thead>            box-sizing: border-box;

                <tbody>            display: flex;

                  <tr>            justify-content: center;

                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">1</td>            align-items: flex-start;

                    <td style="border: 1px solid #ddd; padding: 8px;">{item_name}</td>            font-family: Arial, sans-serif;

                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{quantity}</td>            overflow: auto;

                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{unit_price}</td>          }

                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{amount}</td>          .page {

                  </tr>            background-color: white !important;

                </tbody>            box-shadow: 0 0 10px rgba(0,0,0,0.2);

                <tfoot>            margin: 0 auto;

                  <tr>            position: relative;

                    <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>合计：</strong></td>            box-sizing: border-box;

                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{total_amount}</td>            min-height: 200px;

                  </tr>            padding: 10mm;

                </tfoot>            overflow: visible;

              </table>            border: 1px solid #ddd;

            </div>          }

          `,          

        },          /* 确保编辑器渲染正确 */

        {          .gjs-dashed *[data-highlightable] {

          id: 'company-header',            outline: 1px dashed #3b97e3 !important;

          label: '<div>公司抬头</div>',          }

          category: '业务组件',        `

          content: `      },

            <div class="company-header" style="display: flex; align-items: center; margin-bottom: 20px;">      

              <div class="logo" style="margin-right: 20px;">{company_logo}</div>      // 其他编辑器设置

              <div>      deviceManager: {

                <h1 style="margin: 0 0 10px 0;">{company_name}</h1>        devices: [

                <div>{company_address}</div>          {

                <div>电话: {company_phone} | 邮箱: {company_email}</div>            name: '桌面',

              </div>            width: '', // 全宽

            </div>          }

          `,        ]

        },      },

        {    });

          id: 'signature',    

          label: '<div>签名区域</div>',    console.log('编辑器实例创建成功');

          category: '业务组件',    

          content: `    // 设置编辑器事件

            <div class="signatures" style="display: flex; justify-content: space-between; margin-top: 40px;">    setupEditorEvents(templateData.head);

              <div>    console.log('编辑器事件设置完成');

                <p>客户签名：</p>    

                <div style="height: 60px; width: 120px; border-bottom: 1px solid #000;"></div>    // 配置区块

              </div>    setupBlocks();

              <div>    console.log('区块设置完成');

                <p>公司盖章：</p>    

                <div style="height: 60px; width: 120px;">{company_seal}</div>    // 准备页面内容

              </div>    let initialContent = '';

            </div>    if (templateData.body && templateData.body.includes('class="page"')) {

          `,      // 已有带page容器的内容

        }      initialContent = templateData.body;

      ],    } else {

    },      // 添加page容器包装

  });      const content = templateData.body || '<p style="text-align:center">点击左侧区块添加内容</p>';

        initialContent = `<div class="page">${content}</div>`;

  // 设置编辑器内容    }

  editor.value.setComponents(htmlContent.value);    

      console.log('设置初始内容...');

  // 监听编辑器内容变化    

  editor.value.on('change:component', () => {    // 设置内容

    if (!isUpdatingFromCode.value) {    editor.setComponents(initialContent);

      isUpdatingFromVisual.value = true;    

      htmlContent.value = editor.value.getHtml();    // 应用纸张尺寸

      setTimeout(() => {    console.log('应用纸张尺寸...');

        isUpdatingFromVisual.value = false;    applyPaperSize();

      }, 100);    

    }    // 编辑器加载完成事件

  });    editor.on('load', () => {

        console.log('编辑器完全加载完成');

  // 设置画布大小      

  updateCanvasSize();      // 连续尝试调整视图，确保显示正确

}      setTimeout(() => {

        fitToWidth();

// 更新可视化编辑器中的画布大小        console.log('初始适配宽度完成');

function updateCanvasSize() {      }, 300);

  if (!editor.value) return;    });

      

  const wrapper = editor.value.Canvas.getBody().querySelector('[data-gjs-type="wrapper"]');    loading.value = false;

  if (!wrapper) return;    console.log('编辑器初始化成功完成');

      

  const sizes = {    // 最后再次尝试适配宽度并确保正确渲染

    'A4': { width: '210mm', height: '297mm' },    setTimeout(() => {

    'A5': { width: '148mm', height: '210mm' },      fitToWidth();

    'B5': { width: '176mm', height: '250mm' },      refreshCanvas();

    '80mm': { width: '80mm', height: 'auto' },    }, 500);

    '58mm': { width: '58mm', height: 'auto' },    

  };  } catch (error) {

      console.error('初始化编辑器失败:', error);

  const size = sizes[paperSize.value] || sizes['A4'];    loadError.value = error.message || '初始化失败';

      loading.value = false;

  wrapper.style.width = size.width;  }

  wrapper.style.height = size.height;}

  wrapper.style.margin = '0 auto';

  wrapper.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';// 重试初始化

  wrapper.style.backgroundColor = '#fff';function retryInitEditor() {

    if (editor) {

  fitToPage();    editor.destroy();

}    editor = null;

  }

// 从源码更新可视化编辑器  

function updateVisualFromCode() {  // 清除可能的CSS缓存

  if (!editor.value || isUpdatingFromVisual.value) return;  const links = document.querySelectorAll('link[href*="grapesjs"]');

    links.forEach(link => {

  isUpdatingFromCode.value = true;    link.parentNode.removeChild(link);

  editor.value.setComponents(htmlContent.value);  });

    

  setTimeout(() => {  // 重新初始化

    isUpdatingFromCode.value = false;  initEditor();

  }, 100);}

}

// 解析模板HTML

// 保存模板function parseTemplate(html) {

function emitSave() {  const result = {

  emit('save', htmlContent.value);    head: '',

}    body: ''

  };

// 取消编辑  

function emitCancel() {  if (!html) return result;

  emit('cancel');  

}  try {

    // 提取head内容

// 适应页面大小    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);

function fitToPage() {    if (headMatch) result.head = headMatch[1];

  if (!editor.value) return;    

  setTimeout(() => {    // 提取body内容

    editor.value.Canvas.setZoom(80);    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  }, 100);    if (bodyMatch) {

}      result.body = bodyMatch[1];

    } else {

// 纸张尺寸变化处理      // 无完整HTML结构，将整个内容视为body

function handlePaperChange(newSize) {      result.body = html.trim();

  paperSize.value = newSize;    }

  updateCanvasSize();  } catch (error) {

}    console.warn('解析模板失败，将作为body内容处理', error);

    result.body = html || '';

// 默认模板  }

function getDefaultTemplate() {  

  return `  return result;

    <div style="padding: 20px; font-family: Arial, sans-serif;">}

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">

        <div>// 重建完整HTML

          <h2 style="margin: 0;">{company_name}</h2>function rebuildHtml(head, body, css = '') {

          <p style="margin: 5px 0;">地址: {company_address}</p>  const cssTag = css && css.trim() ? `<style>\n${css}\n</style>` : '';

          <p style="margin: 5px 0;">电话: {company_phone}</p>  return `<!DOCTYPE html>

        </div><html>

        <div style="text-align: right;"><head>

          <h1>发票</h1>  ${head || ''}

          <p>发票号: {invoice_number}</p>  ${cssTag}

          <p>日期: {current_date}</p></head>

        </div><body>

      </div>  ${body || ''}

      </body>

      <div style="margin-bottom: 20px;"></html>`;

        <h3 style="margin-bottom: 5px;">收款方:</h3>}

        <p style="margin: 0;">{customer_name}</p>

        <p style="margin: 0;">{customer_address}</p>// =====================================

      </div>// 编辑器配置

      // =====================================

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">

        <thead>// 设置区块

          <tr style="background-color: #f2f2f2;">function setupBlocks() {

            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">商品</th>  if (!editor) return;

            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">数量</th>  

            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">单价</th>  const bm = editor.BlockManager;

            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">金额</th>  

          </tr>  // 基础元素

        </thead>  bm.add('heading', {

        <tbody>    label: '标题',

          <tr>    category: '基础',

            <td style="padding: 8px; border: 1px solid #ddd;">{item_name}</td>    content: '<h2 style="margin:8px 0">标题文本</h2>',

            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{quantity}</td>    attributes: { class: 'fa fa-header' }

            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{unit_price}</td>  });

            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{amount}</td>  

          </tr>  bm.add('paragraph', {

        </tbody>    label: '段落',

        <tfoot>    category: '基础',

          <tr>    content: '<p style="margin:6px 0">请输入文本内容...</p>',

            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>合计:</strong></td>  });

            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{total_amount}</td>  

          </tr>  bm.add('divider', {

        </tfoot>    label: '分隔线',

      </table>    category: '基础',

          content: '<hr style="border:none;border-top:1px solid #ccc;margin:12px 0" />',

      <div style="display: flex; justify-content: space-between;">  });

        <div>  

          <p style="margin-bottom: 50px;">客户签名:</p>  // 布局元素

          <div style="border-top: 1px solid black; width: 200px;"></div>  bm.add('two-columns', {

        </div>    label: '两列布局',

        <div style="text-align: right;">    category: '布局',

          <p>公司盖章:</p>    content: `

          <div style="height: 80px; width: 80px; margin-left: auto;">{company_seal}</div>      <div style="display:flex;width:100%;gap:16px">

        </div>        <div style="flex:1">左侧内容</div>

      </div>        <div style="flex:1">右侧内容</div>

    </div>      </div>

  `;    `,

}  });

</script>  

  bm.add('three-columns', {

<style scoped>    label: '三列布局',

.template-editor-container {    category: '布局',

  width: 100%;    content: `

  height: 100%;      <div style="display:flex;width:100%;gap:12px">

  background-color: #f5f7fa;        <div style="flex:1">第一列</div>

}        <div style="flex:1">第二列</div>

        <div style="flex:1">第三列</div>

.editor-loading {      </div>

  display: flex;    `,

  flex-direction: column;  });

  align-items: center;  

  justify-content: center;  // 发票元素

  height: 100%;  bm.add('item-table', {

  padding: 20px;    label: '明细表格',

}    category: '发票',

    content: `

.editor-workspace {      <table style="width:100%;border-collapse:collapse">

  display: flex;        <thead>

  flex-direction: column;          <tr>

  height: 100%;            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">#</th>

}            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">产品</th>

            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">描述</th>

.editor-toolbar {            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">数量</th>

  display: flex;            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">单位</th>

  justify-content: space-between;            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">单价</th>

  align-items: center;            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">税率</th>

  padding: 8px 12px;            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">折扣</th>

  background-color: #ffffff;            <th style="border:1px solid #ddd;padding:6px;background:#f8f8f8">金额</th>

  border-bottom: 1px solid #e4e7ed;          </tr>

}        </thead>

        <tbody>{{invoice_items}}</tbody>

.left-actions,      </table>

.center-actions,    `,

.right-actions {  });

  display: flex;  

  align-items: center;  bm.add('logo', {

  gap: 8px;    label: '公司LOGO',

}    category: '发票',

    content: TOKENS.logo,

.editor-content {  });

  flex-grow: 1;  

  overflow: hidden;  bm.add('seal', {

}    label: '公司印章',

    category: '发票',

.panels-container {    content: TOKENS.seal,

  display: flex;  });

  height: 100%;  

}  bm.add('signature', {

    label: '签名',

.panel-blocks {    category: '发票',

  width: 240px;    content: TOKENS.signature,

  overflow-y: auto;  });

  background-color: #ffffff;  

  border-right: 1px solid #e4e7ed;  // 常用字段

  padding: 10px;  bm.add('invoice-info', {

}    label: '发票信息',

    category: '发票',

.panel-editor {    content: `

  flex-grow: 1;      <div style="margin:6px 0">

  overflow: auto;        <div>发票号: {{invoice_number}}</div>

}        <div>日期: {{invoice_date}}</div>

        <div>到期日: {{due_date}}</div>

.code-editor {      </div>

  height: 100%;    `,

  padding: 12px;  });

}  

  bm.add('customer-info', {

/* 调整GrapesJS默认样式 */    label: '客户信息',

:deep(.gjs-one-bg) {    category: '发票',

  background-color: #ffffff;    content: `

}      <div style="margin:6px 0">

        <div><strong>客户信息</strong></div>

:deep(.gjs-two-color) {        <div>{{customer_name}}</div>

  color: #409eff;        <div>{{customer_address}}</div>

}        <div>电话: {{customer_phone}}</div>

      </div>

:deep(.gjs-four-color) {    `,

  color: #409eff;  });

}  

  bm.add('totals', {

:deep(.gjs-four-color-h:hover) {    label: '金额汇总',

  color: #79bbff;    category: '发票',

}    content: `

</style>      <table style="width:220px;border-collapse:collapse;margin-left:auto">
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
  
  // 监听内容变化事件
  editor.on('component:add', updateModelValue);
  editor.on('component:remove', updateModelValue);
  editor.on('component:update', updateModelValue);
  editor.on('style:property:update', updateModelValue);
  
  // 监听选择事件
  editor.on('component:selected', component => {
    if (!component) return;
    
    console.log('选择了组件:', component.getName());
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
    if (!document) {
      console.error('Canvas文档不存在');
      return;
    }
    
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
      const children = Array.from(body.children);
      
      children.forEach(child => {
        // 跳过已有的.page元素
        if (child.classList && !child.classList.contains('page')) {
          pageEl.appendChild(child);
        }
      });
      
      // 添加页面容器到文档
      document.body.appendChild(pageEl);
    }
    
    // 设置页面样式
    pageEl.style.width = paperSize.width;
    pageEl.style.minHeight = paperSize.height !== 'auto' ? paperSize.height : '200mm';
    pageEl.style.padding = '10mm';
    pageEl.style.boxSizing = 'border-box';
    pageEl.style.margin = '0 auto';
    pageEl.style.background = 'white';
    pageEl.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
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
    
    console.log(`应用纸张尺寸: ${paperSize.width} x ${paperSize.height}`);
  } catch (error) {
    console.error('应用纸张尺寸失败', error);
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
    scaleRatio = Math.min(Math.max(0.3, scaleRatio), 1.5); // 限制缩放范围
    
    // 应用缩放
    zoom.value = scaleRatio;
    editor.Canvas.setZoom(scaleRatio);
    
    console.log(`适应宽度: 容器=${containerWidth}px, 页面=${pageWidth}px, 缩放=${scaleRatio.toFixed(2)}`);
  } catch (error) {
    console.error('适应宽度失败', error);
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
      const pageComponents = editor.Pages.getSelected().getMainComponent();
      if (pageComponents) {
        pageComponents.append(token);
      } else {
        editor.addComponents(token);
      }
    }
  } catch (error) {
    console.error('插入令牌失败', error);
  }
}

// 缩放控制
function zoomIn() {
  if (!editor) return;
  zoom.value = Math.min(2.0, zoom.value + 0.1);
  editor.Canvas.setZoom(zoom.value);
}

function zoomOut() {
  if (!editor) return;
  zoom.value = Math.max(0.3, zoom.value - 0.1);
  editor.Canvas.setZoom(zoom.value);
}

// 刷新画布渲染
function refreshCanvas() {
  if (!editor) return;
  
  try {
    // 获取文档
    const canvas = editor.Canvas;
    const document = canvas.getDocument();
    if (!document) return;
    
    // 确保页面元素正确设置
    const pageEl = document.querySelector('.page');
    if (pageEl) {
      // 强制重新渲染
      pageEl.style.backgroundColor = 'white';
      pageEl.style.display = 'block';
      
      // 添加默认内容（如果为空）
      if (!pageEl.innerHTML.trim()) {
        pageEl.innerHTML = '<p style="text-align:center">点击左侧区块添加内容</p>';
      }
    }
    
    // 刷新编辑器视图
    editor.refresh();
    console.log('画布刷新完成');
  } catch (error) {
    console.error('刷新画布失败:', error);
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
  console.log('TemplateBuilder组件挂载');
  
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
    console.log('销毁编辑器实例');
    editor.destroy();
    editor = null;
  }
});

// 暴露方法给父组件
defineExpose({
  insertToken,
  fitToWidth,
  retryInitEditor,
  refreshCanvas
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
  overflow: auto;
  position: relative;
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
}

.gjs-frame-wrapper {
  padding: 16px !important;
}

.gjs-frame {
  transform-origin: top left;
}

/* 确保编辑器工具可见 */
.gjs-toolbar {
  background-color: #444 !important;
}

.gjs-badge {
  background-color: #409eff !important;
}

.gjs-highlighter, .gjs-highlighter-sel {
  outline: 2px solid #409eff !important;
  outline-offset: 1px;
}

/* 增强区块可见性 */
.gjs-blocks-c {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.gjs-block {
  min-height: 60px;
  width: calc(50% - 10px) !important;
  margin: 5px !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gjs-block:hover {
  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.gjs-block__media {
  margin-bottom: 5px;
}

/* 确保画布组件可见 */
.gjs-selected {
  outline: 2px solid #409eff !important;
  outline-offset: 1px;
}

/* 使页面容器更明显 */
.page {
  border: 1px dashed #ccc;
  min-height: 200px;
}

/* 修复可能的编辑器UI问题 */
.gjs-editor, .gjs-cv-canvas, .gjs-pn-panels {
  z-index: auto !important;
}

/* 确保块面板正确显示 */
.gjs-blocks-cs {
  display: block !important;
}
</style>
<template>
  <div class="invoice-preview-container">
    <div class="preview-header">
      <div class="header-left">
        <h2>{{ title }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="$emit('close')" icon="Close">关闭</el-button>
        <el-button type="primary" @click="printInvoice" icon="Printer">打印</el-button>
        <el-button type="success" @click="downloadPDF" icon="Download">下载 PDF</el-button>
      </div>
    </div>
    
    <div class="preview-actions">
      <el-form :inline="true" class="preview-form">
        <el-form-item label="打印模板">
          <el-select v-model="selectedTemplate" placeholder="选择模板">
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="纸张大小">
          <el-select v-model="paperSize" placeholder="选择纸张">
            <el-option label="A4" value="A4" />
            <el-option label="A5" value="A5" />
            <el-option label="B5" value="B5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshPreview">刷新预览</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="preview-content" v-loading="loading">
      <div 
        v-if="!loading && previewHtml" 
        class="preview-frame-container"
        :class="paperSize.toLowerCase()"
      >
        <div class="paper-frame" ref="previewFrame">
          <div class="print-content" v-html="previewHtml"></div>
        </div>
      </div>
      <div v-else-if="!loading && !previewHtml" class="no-template">
        <el-empty description="请选择打印模板">
          <el-button type="primary" @click="fetchTemplates">加载模板</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';

// Props
const props = defineProps({
  invoiceId: {
    type: [Number, String],
    required: true
  },
  // Optional default template ID
  defaultTemplateId: {
    type: [Number, String],
    default: null
  }
});

// Emits
defineEmits(['close']);

// Data
const loading = ref(false);
const invoice = ref(null);
const templates = ref([]);
const selectedTemplate = ref(null);
const paperSize = ref('A4');
const previewHtml = ref('');
const previewFrame = ref(null);

// Computed
const title = computed(() => {
  return invoice.value ? `${invoice.value.invoice_number} - 打印预览` : '发票打印预览';
});

// Lifecycle hooks
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchInvoiceDetails(),
      fetchTemplates()
    ]);
    
    // Set default template
    if (props.defaultTemplateId) {
      selectedTemplate.value = props.defaultTemplateId;
    } else if (templates.value.length > 0) {
      // Find default template
      const defaultTemplate = templates.value.find(t => t.is_default && t.type === 'invoice');
      if (defaultTemplate) {
        selectedTemplate.value = defaultTemplate.id;
      } else if (templates.value.length > 0) {
        selectedTemplate.value = templates.value[0].id;
      }
    }
    
    // Generate initial preview
    if (selectedTemplate.value) {
      await generatePreview();
    }
  } catch (error) {
    console.error('初始化预览失败:', error);
    ElMessage.error('加载预览数据失败');
  } finally {
    loading.value = false;
  }
});

// Methods
async function fetchInvoiceDetails() {
  try {
    const response = await fetch(`/api/invoices/${props.invoiceId}`);
    if (response.ok) {
      invoice.value = await response.json();
    } else {
      throw new Error('获取发票详情失败');
    }
  } catch (error) {
    console.error('加载发票详情失败:', error);
    ElMessage.error('加载发票详情失败');
  }
}

async function fetchTemplates() {
  try {
    // Get the account_set_id from the invoice to fetch relevant templates
    if (invoice.value && invoice.value.account_set_id) {
      const response = await fetch(`/api/print-templates?account_set_id=${invoice.value.account_set_id}&type=invoice`);
      if (response.ok) {
        templates.value = await response.json();
      } else {
        throw new Error('获取模板失败');
      }
    } else {
      // Fetch all invoice templates
      const response = await fetch('/api/print-templates?type=invoice');
      if (response.ok) {
        templates.value = await response.json();
      } else {
        throw new Error('获取模板失败');
      }
    }
  } catch (error) {
    console.error('加载打印模板失败:', error);
    ElMessage.error('加载打印模板失败');
  }
}

async function generatePreview() {
  if (!selectedTemplate.value || !props.invoiceId) {
    previewHtml.value = '';
    return;
  }
  
  loading.value = true;
  try {
    const response = await fetch(`/api/invoices/${props.invoiceId}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: selectedTemplate.value,
        paper_size: paperSize.value
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      previewHtml.value = data.html;
      
      // Apply custom styles to preview
      setTimeout(() => {
        applyPreviewStyles();
      }, 100);
    } else {
      throw new Error('生成预览失败');
    }
  } catch (error) {
    console.error('生成打印预览失败:', error);
    ElMessage.error('生成打印预览失败');
  } finally {
    loading.value = false;
  }
}

function applyPreviewStyles() {
  if (previewFrame.value) {
    // Apply any necessary styles to the preview frame
    // This could include fixing image paths, adjusting font sizes, etc.
  }
}

function refreshPreview() {
  generatePreview();
}

  function printInvoice() {
    if (!previewHtml.value) {
      ElMessage.warning('请先生成预览');
      return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title.value}</title>
          <style>
            @media print {
              @page {
                size: ${paperSize.value};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
            }
            .print-content {
              padding: 10mm;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${previewHtml.value}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            };
          <\/script>
        <\/body>
      <\/html>
    `);
    
      printWindow.document.close();
    } else {
      ElMessage.error('打印窗口被浏览器拦截，请允许弹出窗口');
    }
  }

async function downloadPDF() {
  if (!selectedTemplate.value || !props.invoiceId) {
    ElMessage.warning('请先选择模板');
    return;
  }
  
  try {
    ElMessage.info('正在生成PDF，请稍候...');
    
    const response = await fetch(`/api/invoices/${props.invoiceId}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: selectedTemplate.value,
        paper_size: paperSize.value
      })
    });
    
    if (response.ok) {
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `发票-${invoice.value.invoice_number}.pdf`;
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename=(.+)/i);
        if (matches && matches.length > 1) {
          filename = matches[1].replace(/["']/g, '');
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      ElMessage.success('PDF下载成功');
    } else {
      throw new Error('生成PDF失败');
    }
  } catch (error) {
    console.error('下载PDF失败:', error);
    ElMessage.error('下载PDF失败');
  }
}
</script>

<style scoped>
.invoice-preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-light);
}

.preview-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--el-color-primary);
}

.header-right {
  display: flex;
  gap: 10px;
}

.preview-actions {
  padding: 10px 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.preview-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-frame-container {
  position: relative;
  margin: 0 auto;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  background-color: white;
}

.preview-frame-container.a4 {
  width: 210mm;
  min-height: 297mm;
}

.preview-frame-container.a5 {
  width: 148mm;
  min-height: 210mm;
}

.preview-frame-container.b5 {
  width: 176mm;
  min-height: 250mm;
}

.paper-frame {
  padding: 10mm;
  box-sizing: border-box;
}

.no-template {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .preview-actions {
    padding: 10px;
  }
  
  .preview-form {
    flex-direction: column;
  }
  
  .preview-form .el-form-item {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>
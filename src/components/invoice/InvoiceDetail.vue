<template>
  <div class="invoice-detail-container" v-loading="loading">
    <div class="detail-header">
      <div class="header-left">
  <h2 class="invoice-title">发票 {{ invoice.invoice_number }}</h2>
        <div class="invoice-status">
          <el-tag :type="getStatusType(invoice.status)">
            {{ getStatusText(invoice.status) }}
          </el-tag>
          <el-tag :type="getPaymentStatusType(invoice.payment_status)" class="payment-tag">
            {{ getPaymentStatusText(invoice.payment_status) }}
          </el-tag>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="$emit('close')" icon="Close">关闭</el-button>
        <el-button type="primary" @click="$emit('edit', invoiceId)" icon="Edit">编辑</el-button>
        <el-button type="success" @click="printInvoice" icon="Printer">打印</el-button>
      </div>
    </div>

    <div class="detail-content" v-if="!loading && invoice.id">
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :xs="24" :sm="24" :md="10" :lg="8">
          <div class="detail-section">
            <h3 class="section-title">基本信息</h3>
            <ul class="info-list">
              <li>
                <span class="info-label">发票编号：</span>
                <span class="info-value">{{ invoice.invoice_number }}</span>
              </li>
              <li>
                <span class="info-label">开票日期：</span>
                <span class="info-value">{{ formatDate(invoice.invoice_date) }}</span>
              </li>
              <li v-if="invoice.due_date">
                <span class="info-label">到期日期：</span>
                <span class="info-value">{{ formatDate(invoice.due_date) }}</span>
              </li>
              <li>
                <span class="info-label">账套：</span>
                <span class="info-value">{{ invoice.account_set_name || '-' }}</span>
              </li>
              <li>
                <span class="info-label">业务员：</span>
                <span class="info-value">{{ invoice.salesperson_name || '-' }}</span>
              </li>
              <li>
                <span class="info-label">创建时间：</span>
                <span class="info-value">{{ formatDateTime(invoice.created_at) }}</span>
              </li>
              <li>
                <span class="info-label">最后更新：</span>
                <span class="info-value">{{ formatDateTime(invoice.updated_at) }}</span>
              </li>
            </ul>
          </div>

          <!-- 客户信息 -->
          <div class="detail-section" v-if="invoice.customer_name">
            <h3 class="section-title">客户信息</h3>
            <ul class="info-list">
              <li>
                <span class="info-label">名称：</span>
                <span class="info-value">{{ invoice.customer_name }}</span>
              </li>
              <li v-if="invoice.customer_contact">
                <span class="info-label">联系人：</span>
                <span class="info-value">{{ invoice.customer_contact }}</span>
              </li>
              <li v-if="invoice.customer_phone">
                <span class="info-label">电话：</span>
                <span class="info-value">{{ invoice.customer_phone }}</span>
              </li>
              <li v-if="invoice.customer_email">
                <span class="info-label">邮箱：</span>
                <span class="info-value">{{ invoice.customer_email }}</span>
              </li>
              <li v-if="invoice.customer_address">
                <span class="info-label">地址：</span>
                <span class="info-value">{{ invoice.customer_address }}</span>
              </li>
            </ul>
          </div>

          <!-- 备注信息 -->
          <div class="detail-section" v-if="invoice.notes">
            <h3 class="section-title">备注信息</h3>
            <div class="notes-content">{{ invoice.notes }}</div>
          </div>
        </el-col>

        <!-- 明细信息 -->
        <el-col :xs="24" :sm="24" :md="14" :lg="16">
          <div class="detail-section">
            <h3 class="section-title">发票明细</h3>
            
            <el-table :data="invoice.items" border stripe class="detail-table">
              <el-table-column label="商品/编码" min-width="220">
                <template #default="scope">
                  <div class="product-cell">
                    <div>{{ scope.row.description }}</div>
                    <small v-if="scope.row.product_name || scope.row.product_code" class="muted">
                      {{ scope.row.product_name || '' }}
                      <span v-if="scope.row.product_code">[{{ scope.row.product_code }}]</span>
                    </small>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="100" align="right">
                <template #default="scope">
                  {{ formatQuantity(scope.row.quantity) }}
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80" align="center" />
              <el-table-column prop="unit_price" label="单价" width="120" align="right">
                <template #default="scope">
                  {{ formatAmount(scope.row.unit_price) }}
                </template>
              </el-table-column>
              <el-table-column prop="tax_rate" label="税率%" width="80" align="right">
                <template #default="scope">
                  {{ scope.row.tax_rate || 0 }}%
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="scope">
                  {{ formatAmount(scope.row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="tax_amount" label="税额" width="120" align="right">
                <template #default="scope">
                  {{ formatAmount(scope.row.tax_amount) }}
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 合计信息 -->
            <div class="invoice-summary">
              <div class="summary-row">
                <span class="summary-label">合计金额：</span>
                <span class="summary-value">¥{{ formatAmount(invoice.subtotal ?? invoice.total_amount) }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">税额合计：</span>
                <span class="summary-value">¥{{ formatAmount(invoice.tax_amount || 0) }}</span>
              </div>
              <div class="summary-row total">
                <span class="summary-label">应付总计：</span>
                <span class="summary-value">¥{{ formatAmount(parseFloat(invoice.total_amount || 0)) }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// Props
const props = defineProps({
  invoiceId: {
    type: [Number, String],
    required: true
  }
});

// Emits
defineEmits(['close', 'edit', 'print']);

// Data
const loading = ref(true);
const invoice = ref({
  items: []
});

// Lifecycle hooks
onMounted(async () => {
  await fetchInvoiceDetails();
});

// Methods
async function fetchInvoiceDetails() {
  loading.value = true;
  try {
    const response = await fetch(`/api/invoices/${props.invoiceId}`);
    if (response.ok) {
      const data = await response.json();
      // 直接使用后端已联表的别名字段
      invoice.value = {
        ...data,
        // 确保 items 数组存在
        items: Array.isArray(data.items) ? data.items : []
      };
    } else {
      throw new Error('获取发票详情失败');
    }
  } catch (error) {
    console.error('加载发票详情失败:', error);
    ElMessage.error('加载发票详情失败');
  } finally {
    loading.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '-';
  const date = new Date(dateTimeString);
  return date.toLocaleString('zh-CN');
}

function formatAmount(amount) {
  return parseFloat(amount || 0).toFixed(2);
}

function formatQuantity(quantity) {
  return parseFloat(quantity || 0).toLocaleString('zh-CN');
}

function getStatusType(status) {
  const types = {
    draft: 'info',
    published: 'primary',
    paid: 'success',
    cancelled: 'danger'
  };
  return types[status] || 'info';
}

function getStatusText(status) {
  const texts = {
    draft: '草稿',
    published: '已发布',
    paid: '已付款',
    cancelled: '已取消'
  };
  return texts[status] || status;
}

function getPaymentStatusType(status) {
  const types = {
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success'
  };
  return types[status] || 'info';
}

function getPaymentStatusText(status) {
  const texts = {
    unpaid: '未付款',
    partial: '部分付款',
    paid: '已付款'
  };
  return texts[status] || status;
}

function printInvoice() {
  // 将在后续实现
  ElMessage.info(`准备打印发票 ${invoice.value.invoice_number}`);
}
</script>

<style scoped>
.invoice-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-light);
}

.invoice-title {
  margin: 0;
  font-size: 20px;
  color: var(--el-color-primary);
}

.invoice-status {
  margin-top: 8px;
  display: flex;
  gap: 10px;
}

.payment-tag {
  margin-left: 8px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.detail-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.detail-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  margin-bottom: 10px;
  display: flex;
}

.info-label {
  width: 100px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.info-value {
  flex-grow: 1;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.notes-content {
  white-space: pre-wrap;
  color: var(--el-text-color-regular);
  background-color: var(--el-color-info-light-9);
  padding: 10px;
  border-radius: 4px;
}

.detail-table {
  margin-bottom: 20px;
}

.invoice-summary {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.summary-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.summary-label {
  font-weight: bold;
  margin-right: 20px;
  color: var(--el-text-color-regular);
}

.summary-value {
  font-weight: bold;
  width: 120px;
  text-align: right;
  color: var(--el-text-color-primary);
}

.summary-row.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.summary-row.total .summary-value {
  color: var(--el-color-danger);
  font-size: 18px;
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .detail-content {
    padding: 10px;
  }
  
  .detail-section {
    padding: 15px;
  }
  
  .info-label {
    width: 90px;
  }
}
</style>
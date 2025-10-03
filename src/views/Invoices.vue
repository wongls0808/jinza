<template>
  <div class="invoices-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">发票管理</h1>
        <p class="page-description">创建、管理和跟踪企业发票，支持关联客户、商品和业务员</p>
      </div>
      <el-button type="primary" size="large" @click="showAddDialog = true" class="add-button">
        <el-icon><Plus /></el-icon>
        新建发票
      </el-button>
    </div>

    <!-- 过滤和搜索区域 -->
    <div class="filter-container">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="客户">
          <el-select v-model="filters.customerId" placeholder="选择客户" clearable>
            <el-option
              v-for="customer in customerOptions"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="业务员">
          <el-select v-model="filters.salespersonId" placeholder="选择业务员" clearable>
            <el-option
              v-for="person in salespersonOptions"
              :key="person.id"
              :label="person.name"
              :value="person.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已付款" value="paid" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filters.search"
            placeholder="搜索发票号/客户名称"
            prefix-icon="el-icon-search"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchInvoices">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card total">
            <div class="stats-title">总发票数</div>
            <div class="stats-value">{{ stats.total }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card pending">
            <div class="stats-title">未付款</div>
            <div class="stats-value">{{ stats.unpaid }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card paid">
            <div class="stats-title">已付款</div>
            <div class="stats-value">{{ stats.paid }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card amount">
            <div class="stats-title">总金额</div>
            <div class="stats-value">¥{{ formatAmount(stats.totalAmount) }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 发票列表 -->
    <div class="invoice-list-container">
      <el-table 
        v-loading="loading"
        :data="invoices"
        border
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="invoice_number" label="发票号" min-width="120" />
        <el-table-column prop="customer_name" label="客户" min-width="150" />
        <el-table-column prop="issue_date" label="开票日期" min-width="120" />
        <el-table-column prop="total_amount" label="金额" min-width="120">
          <template #default="scope">
            ¥{{ formatAmount(scope.row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="salesperson_name" label="业务员" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="付款状态" min-width="100">
          <template #default="scope">
            <el-tag :type="getPaymentStatusType(scope.row.payment_status)">
              {{ getPaymentStatusText(scope.row.payment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="scope">
            <el-button size="small" @click.stop="viewInvoice(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click.stop="editInvoice(scope.row)">编辑</el-button>
            <el-dropdown trigger="click" @click.stop>
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="printInvoice(scope.row)">打印</el-dropdown-item>
                  <el-dropdown-item @click="duplicateInvoice(scope.row)">复制</el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.status === 'draft'" 
                    @click="deleteInvoice(scope.row)"
                    divided
                    class="text-danger"
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 发票详情对话框 -->
    <el-dialog
      v-model="showViewDialog"
      title="发票详情"
      width="80%"
      custom-class="invoice-detail-dialog"
    >
      <invoice-detail
        v-if="showViewDialog"
        :invoice-id="currentInvoiceId"
        @close="showViewDialog = false"
        @edit="handleEditFromView"
        @print="handlePrintFromView"
      />
    </el-dialog>

    <!-- 新增/编辑发票对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEditing ? '编辑发票' : '新建发票'"
      width="90%"
      custom-class="invoice-form-dialog"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <invoice-form
        v-if="showAddDialog"
        :invoice-id="isEditing ? currentInvoiceId : null"
        @saved="handleInvoiceSaved"
        @cancel="showAddDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Plus, ArrowDown } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

// 引入发票组件
import InvoiceDetail from '../components/invoice/InvoiceDetail.vue';
import InvoiceForm from '../components/invoice/InvoiceForm.vue';

// 状态变量
const loading = ref(false);
const invoices = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const showViewDialog = ref(false);
const showAddDialog = ref(false);
const currentInvoiceId = ref(null);
const isEditing = ref(false);

// 统计数据
const stats = reactive({
  total: 0,
  unpaid: 0,
  paid: 0,
  totalAmount: 0
});

// 过滤条件
const filters = reactive({
  customerId: null,
  salespersonId: null,
  status: null,
  dateRange: null,
  search: '',
});

// 客户和业务员选项
const customerOptions = ref([]);
const salespersonOptions = ref([]);

// 生命周期钩子
onMounted(async () => {
  await Promise.all([
    fetchCustomers(),
    fetchSalespeople(),
  ]);
  fetchInvoices();
  fetchStats();
});

// 获取客户列表
async function fetchCustomers() {
  try {
    const response = await fetch('/api/customers');
    if (response.ok) {
      customerOptions.value = await response.json();
    }
  } catch (error) {
    console.error('获取客户数据失败:', error);
    ElMessage.error('获取客户数据失败');
  }
}

// 获取业务员列表
async function fetchSalespeople() {
  try {
    const response = await fetch('/api/salespeople');
    if (response.ok) {
      salespersonOptions.value = await response.json();
    }
  } catch (error) {
    console.error('获取业务员数据失败:', error);
    ElMessage.error('获取业务员数据失败');
  }
}

// 获取发票列表
async function fetchInvoices() {
  loading.value = true;
  try {
    let queryParams = new URLSearchParams({
      page: currentPage.value,
      limit: pageSize.value
    });

    if (filters.customerId) queryParams.append('customer_id', filters.customerId);
    if (filters.salespersonId) queryParams.append('salesperson_id', filters.salespersonId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    
    if (filters.dateRange && filters.dateRange.length === 2) {
      queryParams.append('start_date', filters.dateRange[0]);
      queryParams.append('end_date', filters.dateRange[1]);
    }

    // 使用正确的API路径，不包括尾部斜杠
    const apiUrl = `/api/invoices?${queryParams.toString()}`;
    console.log('发送请求到:', apiUrl);
    const response = await fetch(apiUrl);
    console.log('获取响应状态:', response.status, response.statusText);
    console.log('响应头:', [...response.headers.entries()].reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {}));
    
    // 克隆响应以便我们可以同时获取文本和JSON（如果可能的话）
    const responseClone = response.clone();
    
    // 总是尝试获取响应文本以便调试
    const responseText = await responseClone.text();
    console.log('响应内容前100个字符:', responseText.slice(0, 100));
    
    if (response.ok) {
      try {
        // 尝试解析为JSON
        const data = JSON.parse(responseText);
        console.log('获取发票数据成功:', data);
        invoices.value = data.invoices;
        total.value = data.total;
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError);
        console.error('完整响应内容:', responseText);
        throw new Error(`JSON解析失败: ${jsonError.message}`);
      }
    } else {
      console.error('API错误响应:', response.status, responseText);
      throw new Error(`获取数据失败: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('获取发票列表失败:', error);
    ElMessage.error(`获取发票数据失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
}

// 获取统计数据
async function fetchStats() {
  try {
    console.log('正在获取统计数据...');
    const response = await fetch('/api/invoices/stats');
    console.log('统计数据响应状态:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('统计数据:', data);
      stats.total = data.total || 0;
      stats.unpaid = data.unpaid || 0;
      stats.paid = data.paid || 0;
      stats.totalAmount = data.totalAmount || 0;
    } else {
      const errorText = await response.text();
      console.error('统计API错误响应:', response.status, errorText);
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
}

// 重置过滤条件
function resetFilters() {
  filters.customerId = null;
  filters.salespersonId = null;
  filters.status = null;
  filters.dateRange = null;
  filters.search = '';
  fetchInvoices();
}

// 分页处理
function handleSizeChange(size) {
  pageSize.value = size;
  fetchInvoices();
}

function handleCurrentChange(page) {
  currentPage.value = page;
  fetchInvoices();
}

// 格式化金额
function formatAmount(amount) {
  return parseFloat(amount || 0).toFixed(2);
}

// 获取状态类型和文本
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

// 获取付款状态类型和文本
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

// 行点击处理
function handleRowClick(row) {
  viewInvoice(row);
}

// 查看发票
function viewInvoice(invoice) {
  currentInvoiceId.value = invoice.id;
  showViewDialog.value = true;
}

// 编辑发票
function editInvoice(invoice) {
  currentInvoiceId.value = invoice.id;
  isEditing.value = true;
  showAddDialog.value = true;
}

// 打印发票
function printInvoice(invoice) {
  // 将在后续实现
  ElMessage.info(`正在准备打印发票: ${invoice.invoice_number}`);
}

// 复制发票
function duplicateInvoice(invoice) {
  // 将在后续实现
  ElMessage.info(`复制发票: ${invoice.invoice_number}`);
}

// 删除发票
async function deleteInvoice(invoice) {
  try {
    await ElMessageBox.confirm(
      `确定要删除发票 ${invoice.invoice_number} 吗？这个操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      ElMessage.success('发票已成功删除');
      fetchInvoices();
      fetchStats();
    } else {
      throw new Error('删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除发票失败:', error);
      ElMessage.error('删除发票失败');
    }
  }
}

// 从查看对话框跳转到编辑
function handleEditFromView(invoiceId) {
  showViewDialog.value = false;
  currentInvoiceId.value = invoiceId;
  isEditing.value = true;
  showAddDialog.value = true;
}

// 从查看对话框打印
function handlePrintFromView(invoiceId) {
  // 将在后续实现
  ElMessage.info(`正在准备打印发票ID: ${invoiceId}`);
}

// 保存发票后的处理
function handleInvoiceSaved() {
  showAddDialog.value = false;
  isEditing.value = false;
  ElMessage.success('发票已保存');
  fetchInvoices();
  fetchStats();
}
</script>

<style scoped>
.invoices-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: var(--el-color-primary);
}

.page-description {
  margin: 5px 0 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.filter-container {
  background-color: var(--el-bg-color);
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stats-container {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
}

.stats-title {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 10px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
}

.stats-card.total {
  background-color: #f0f5ff;
}

.stats-card.total .stats-value {
  color: #409eff;
}

.stats-card.pending {
  background-color: #fff8e6;
}

.stats-card.pending .stats-value {
  color: #e6a23c;
}

.stats-card.paid {
  background-color: #f0f9eb;
}

.stats-card.paid .stats-value {
  color: #67c23a;
}

.stats-card.amount {
  background-color: #f6f6f6;
}

.stats-card.amount .stats-value {
  color: #606266;
}

.invoice-list-container {
  background-color: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-danger {
  color: var(--el-color-danger);
}

:deep(.el-table .cell) {
  white-space: nowrap;
}

:deep(.invoice-form-dialog .el-dialog__body),
:deep(.invoice-detail-dialog .el-dialog__body) {
  padding: 0;
}

@media screen and (max-width: 768px) {
  .filter-form {
    flex-direction: column;
  }
  
  .stats-container .el-col {
    margin-bottom: 10px;
  }
}
</style>
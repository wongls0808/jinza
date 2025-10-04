<template>
  <div class="invoice-form-container">
    <el-form 
      ref="formRef" 
      :model="form" 
      :rules="rules"
      label-position="top" 
      class="invoice-form"
    >
      <!-- 顶部操作栏 -->
      <div class="form-header">
  <div class="form-title">{{ isEditing ? $t('invoiceForm.titleEdit') : $t('invoiceForm.titleNew') }}</div>
        <div class="form-actions">
          <el-button @click="cancel">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="saveAsDraft" :loading="saving">{{ $t('common.saveDraft') }}</el-button>
          <el-button type="success" @click="saveAndPublish" :loading="publishing">{{ $t('common.saveAndPublish') }}</el-button>
        </div>
      </div>

      <!-- 表单内容 -->
      <div class="form-content">
        <el-row :gutter="20">
          <!-- 左侧 - 基本信息 -->
          <el-col :xs="24" :sm="24" :md="10" :lg="8">
            <div class="form-section">
              <h3 class="section-title">{{ $t('invoiceForm.basicInfo') }}</h3>
              
              <!-- 账套选择（隐藏，自动选择默认账套） -->
              <el-form-item :label="$t('invoiceForm.accountSet')" prop="account_set_id" required style="display:none;">
                <el-select 
                  v-model="form.account_set_id" 
                  placeholder="选择账套"
                  @change="handleAccountSetChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in accountSetOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              
              <!-- 发票编号 -->
              <el-form-item :label="$t('invoiceForm.invoiceNumber')" prop="invoice_number" required>
                <div class="invoice-number-container">
                  <el-input v-model="form.invoice_number" placeholder="自动生成" :disabled="true">
                    <template #append>
                      <el-button @click="generateInvoiceNumber">
                        <el-icon><Refresh /></el-icon>
                      </el-button>
                    </template>
                  </el-input>
                </div>
              </el-form-item>
              
              <!-- 客户选择 -->
              <el-form-item :label="$t('invoiceForm.customer')" prop="customer_id" required>
                <el-select 
                  v-model="form.customer_id" 
                  placeholder="选择客户"
                  filterable
                  @change="handleCustomerChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in customerOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  >
                    <div class="customer-option">
                      <span>{{ item.name }}</span>
                      <small v-if="item.contact">联系人: {{ item.contact }}</small>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              
              <!-- 业务员选择 -->
              <el-form-item :label="$t('invoiceForm.salesperson')" prop="salesperson_id">
                <el-select 
                  v-model="form.salesperson_id" 
                  placeholder="选择业务员"
                  filterable
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in salespersonOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>

              <!-- 开票日期 -->
              <el-form-item :label="$t('invoiceForm.issueDate')" prop="issue_date" required>
                <el-date-picker
                  v-model="form.issue_date"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>

              <!-- 到期日期 -->
              <el-form-item :label="$t('invoiceForm.dueDate')" prop="due_date">
                <el-date-picker
                  v-model="form.due_date"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>

              <!-- 备注信息 -->
              <el-form-item :label="$t('invoiceForm.notes')" prop="notes">
                <el-input
                  v-model="form.notes"
                  type="textarea"
                  :rows="3"
                  placeholder="添加备注信息"
                />
              </el-form-item>
            </div>

            <!-- 客户信息预览 -->
            <div class="form-section" v-if="selectedCustomer">
              <h3 class="section-title">客户信息</h3>
              <div class="customer-info">
                <p><strong>名称：</strong> {{ selectedCustomer.name }}</p>
                <p v-if="selectedCustomer.contact"><strong>联系人：</strong> {{ selectedCustomer.contact }}</p>
                <p v-if="selectedCustomer.phone"><strong>电话：</strong> {{ selectedCustomer.phone }}</p>
                <p v-if="selectedCustomer.email"><strong>邮箱：</strong> {{ selectedCustomer.email }}</p>
                <p v-if="selectedCustomer.address"><strong>地址：</strong> {{ selectedCustomer.address }}</p>
              </div>
            </div>
          </el-col>

          <!-- 右侧 - 发票明细 -->
          <el-col :xs="24" :sm="24" :md="14" :lg="16">
            <div class="form-section">
              <h3 class="section-title">{{ $t('invoiceForm.details') }}</h3>

              <!-- 统一税率设置 -->
              <div style="display:flex; gap:16px; align-items:center; margin: 10px 0;">
                <span style="color: var(--el-text-color-regular);">{{ $t('invoiceForm.unifiedTax') }}</span>
                <el-input-number 
                  v-model="unifiedTaxRate" 
                  :min="0" 
                  :max="100" 
                  :precision="2" 
                  controls-position="right"
                  @change="recalculateAllItems"
                />
              </div>
              
              <!-- 明细表格 -->
              <el-table 
                :data="form.items" 
                border
                style="width: 100%"
                class="invoice-items-table"
              >
                <el-table-column :label="$t('invoiceForm.item.itemOrDesc')" min-width="320">
                  <template #default="scope">
                    <el-select 
                      :model-value="getItemSelection(scope.row)"
                      placeholder="选择商品或直接输入描述"
                      filterable
                      allow-create
                      default-first-option
                      clearable
                      @update:model-value="handleItemSelectionChange($event, scope.$index)"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="item in productOptions"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                      >
                        <div class="product-option">
                          <span>{{ item.name }}</span>
                          <small v-if="item.code">[{{ item.code }}]</small>
                        </div>
                      </el-option>
                    </el-select>
                  </template>
                </el-table-column>
                
                <el-table-column :label="$t('invoiceForm.item.unit')" width="100">
                  <template #default="scope">
                    <el-input v-model="scope.row.unit" placeholder="单位" />
                  </template>
                </el-table-column>
                
                <el-table-column :label="$t('invoiceForm.item.qty')" width="120">
                  <template #default="scope">
                    <el-input-number 
                      v-model="scope.row.quantity" 
                      :min="0.001" 
                      :precision="3"
                      controls-position="right"
                      @change="calculateItemAmount(scope.$index)"
                      style="width: 100%"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column :label="$t('invoiceForm.item.price')" width="120">
                  <template #default="scope">
                    <el-input-number 
                      v-model="scope.row.unit_price" 
                      :min="0"
                      :precision="2"
                      controls-position="right"
                      @change="calculateItemAmount(scope.$index)"
                      style="width: 100%"
                    />
                  </template>
                </el-table-column>
                
                <!-- 移除行级税率列，改为统一税率设置 -->
                
                <el-table-column :label="$t('invoiceForm.item.amount')" width="120">
                  <template #default="scope">
                    <div class="amount-cell">{{ formatAmount(scope.row.amount) }}</div>
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="80" align="center">
                  <template #default="scope">
                    <el-button 
                      type="danger" 
                      circle
                      plain
                      :icon="Delete"
                      @click="removeItem(scope.$index)"
                    />
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 添加明细项按钮 -->
              <div class="add-item-container">
                <el-button 
                  type="primary" 
                  plain
                  @click="addItem"
                >
                  <el-icon><Plus /></el-icon> {{ $t('invoiceForm.item.add') }}
                </el-button>
              </div>
              
              <!-- 合计金额 -->
              <div class="invoice-summary">
                <div class="summary-item">
                  <span class="summary-label">{{ $t('invoiceForm.summary.subtotal') }}：</span>
                  <span class="summary-value">{{ formatAmount(invoiceTotal) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">{{ $t('invoiceForm.summary.taxTotal') }}：</span>
                  <span class="summary-value">{{ formatAmount(invoiceTaxTotal) }}</span>
                </div>
                <div class="summary-item total">
                  <span class="summary-label">{{ $t('invoiceForm.summary.grandTotal') }}：</span>
                  <span class="summary-value">{{ formatAmount(invoiceGrandTotal) }}</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Delete, Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Props
const props = defineProps({
  invoiceId: {
    type: [Number, String],
    default: null
  }
});

// Emits
const emit = defineEmits(['saved', 'cancel']);

// Refs
const formRef = ref(null);
const saving = ref(false);
const publishing = ref(false);

// Computed properties
const isEditing = computed(() => !!props.invoiceId);

const invoiceTotal = computed(() => {
  return form.items.reduce((sum, item) => {
    return sum + (parseFloat(item.amount) || 0);
  }, 0);
});

const invoiceTaxTotal = computed(() => {
  return form.items.reduce((sum, item) => {
    return sum + (parseFloat(item.tax_amount) || 0);
  }, 0);
});

const invoiceGrandTotal = computed(() => {
  return invoiceTotal.value + invoiceTaxTotal.value;
});

// Form state
const form = reactive({
  account_set_id: null,
  invoice_number: '',
  customer_id: null,
  salesperson_id: null,
  issue_date: new Date().toISOString().slice(0, 10), // Today's date in YYYY-MM-DD format
  due_date: null,
  status: 'draft',
  payment_status: 'unpaid',
  notes: '',
  items: []
});

// Options for dropdowns
const accountSetOptions = ref([]);
const customerOptions = ref([]);
const salespersonOptions = ref([]);
const productOptions = ref([]);
// 统一税率
const unifiedTaxRate = ref(0);

// Selected customer details
const selectedCustomer = ref(null);
const selectedAccountSet = ref(null);

// Validation rules
const rules = {
  // 去除账套必填校验（UI层面不再强制绑定）
  invoice_number: [
    { required: true, message: '请生成发票编号', trigger: 'blur' }
  ],
  customer_id: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  issue_date: [
    { required: true, message: '请选择开票日期', trigger: 'change' }
  ],
};

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([
    fetchAccountSets(),
    fetchCustomers(),
    fetchSalespeople(),
    fetchProducts()
  ]);
  
  if (isEditing.value) {
    await fetchInvoiceDetails();
  } else {
    addEmptyItem();
    // 自动选择默认账套（若存在），以满足后端必填，但在UI隐藏
    if (accountSetOptions.value.length > 0) {
      // 优先选 is_active 或第一个
      const def = accountSetOptions.value.find(a => a.is_active === 1) || accountSetOptions.value[0];
      form.account_set_id = def?.id || null;
      if (form.account_set_id) await generateInvoiceNumber();
    }
  }
});

// Watch for changes
watch(() => form.account_set_id, async (newValue) => {
  if (newValue && !isEditing.value) {
    await generateInvoiceNumber();
  }
});

// Methods for fetching data
async function fetchAccountSets() {
  try {
    const response = await fetch('/api/account-sets');
    if (response.ok) {
      accountSetOptions.value = await response.json();
    }
  } catch (error) {
    console.error('获取账套数据失败:', error);
    ElMessage.error('获取账套数据失败');
  }
}

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

async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    if (response.ok) {
      productOptions.value = await response.json();
    }
  } catch (error) {
    console.error('获取商品数据失败:', error);
    ElMessage.error('获取商品数据失败');
  }
}

async function fetchInvoiceDetails() {
  try {
    const response = await fetch(`/api/invoices/${props.invoiceId}`);
    if (response.ok) {
      const invoice = await response.json();
      
      Object.keys(form).forEach(key => {
        if (key !== 'items' && invoice[key] !== undefined) {
          form[key] = invoice[key];
        }
      });
      
      // Process items
      if (invoice.items && Array.isArray(invoice.items)) {
        form.items = invoice.items.map(item => ({
          ...item,
          product_id: item.product_id || null,
          tax_rate: parseFloat(item.tax_rate || 0),
          quantity: parseFloat(item.quantity || 0),
          unit_price: parseFloat(item.unit_price || 0),
          amount: parseFloat(item.amount || 0),
          tax_amount: parseFloat(item.tax_amount || 0)
        }));
      } else {
        addEmptyItem();
      }
      
      // Update selected customer info
      if (form.customer_id) {
        handleCustomerChange(form.customer_id);
      }
    } else {
      throw new Error('获取发票详情失败');
    }
  } catch (error) {
    console.error('加载发票详情失败:', error);
    ElMessage.error('加载发票详情失败');
  }
}

// UI interaction methods
function addItem() {
  addEmptyItem();
}

function addEmptyItem() {
  form.items.push({
    product_id: null,
    description: '',
    unit: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    tax_rate: 0,
    tax_amount: 0
  });
}

function removeItem(index) {
  form.items.splice(index, 1);
  
  // Always ensure at least one item
  if (form.items.length === 0) {
    addEmptyItem();
  }
}

async function generateInvoiceNumber() {
  if (!form.account_set_id) return;
  
  try {
    const response = await fetch('/api/generate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_set_id: form.account_set_id,
        type: 'invoice'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      form.invoice_number = data.code;
    } else {
      throw new Error('生成发票号码失败');
    }
  } catch (error) {
    console.error('生成发票号码失败:', error);
    ElMessage.warning('无法自动生成发票号码，请手动填写');
  }
}

function calculateItemAmount(index) {
  const item = form.items[index];
  if (!item) return;
  
  const quantity = parseFloat(item.quantity) || 0;
  const unitPrice = parseFloat(item.unit_price) || 0;
  const taxRate = parseFloat(unifiedTaxRate.value) || 0;
  
  item.amount = quantity * unitPrice;
  item.tax_amount = item.amount * (taxRate / 100);
}

// 统一税率变化后重算所有行
function recalculateAllItems() {
  form.items.forEach((_, idx) => calculateItemAmount(idx));
}

function handleAccountSetChange(value) {
  selectedAccountSet.value = accountSetOptions.value.find(item => item.id === value) || null;
  if (!isEditing.value) {
    generateInvoiceNumber();
  }
}

function handleCustomerChange(value) {
  selectedCustomer.value = customerOptions.value.find(item => item.id === value) || null;
}

function handleProductChange(productId, index) {
  if (!productId) return;
  
  const product = productOptions.value.find(p => p.id === productId);
  if (product && index !== undefined && form.items[index]) {
    const item = form.items[index];
    item.description = product.name;
    item.unit = product.unit || '';
    item.unit_price = parseFloat(product.price) || 0;
    calculateItemAmount(index);
  }
}

// 用于商品/描述合并选择的值
function getItemSelection(row) {
  // 若选择过商品，返回商品ID；否则返回描述文本
  return row.product_id || row.description || '';
}

// 处理商品/描述合并列的变更
function handleItemSelectionChange(val, index) {
  const row = form.items[index];
  if (!row) return;
  const matched = productOptions.value.find(p => p.id === val);
  if (matched) {
    row.product_id = matched.id;
    row.description = matched.name;
    row.unit = matched.unit || '';
    row.unit_price = parseFloat(matched.price) || 0;
  } else {
    // 自由文本，清除product_id，仅作为描述
    row.product_id = null;
    row.description = String(val || '').trim();
  }
  calculateItemAmount(index);
}

function formatAmount(amount) {
  return parseFloat(amount || 0).toFixed(2);
}

// Form submission methods
async function saveAsDraft() {
  await save('draft');
}

async function saveAndPublish() {
  await save('published');
}

async function save(status) {
  try {
    await formRef.value.validate();
    
    if (form.items.length === 0 || 
        form.items.every(item => !item.description || !item.quantity || !item.unit_price)) {
      ElMessage.error('请至少添加一个有效的发票明细项');
      return;
    }
    
    // Update status
    form.status = status;
    
    // Set loading based on status
    if (status === 'draft') {
      saving.value = true;
    } else {
      publishing.value = true;
    }
    
    // 构造与后端契合的字段
    const data = {
      customer_id: form.customer_id,
      account_set_id: form.account_set_id,
      salesperson_id: form.salesperson_id,
      invoice_date: form.issue_date,
      due_date: form.due_date,
      status: form.status,
      payment_status: form.payment_status,
      payment_method: form.payment_method || null,
      payment_date: form.payment_date || null,
      subtotal: invoiceTotal.value,
      tax_amount: invoiceTaxTotal.value,
      discount_amount: 0,
      total_amount: invoiceGrandTotal.value,
      notes: form.notes,
      items: form.items.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        unit: item.unit || '',
        tax_rate: parseFloat(unifiedTaxRate.value) || 0,
        tax_amount: parseFloat(item.tax_amount) || 0,
        discount_rate: 0,
        discount_amount: 0,
        subtotal: parseFloat(item.amount) || 0,
        total: (parseFloat(item.amount) || 0) + (parseFloat(item.tax_amount) || 0),
        notes: item.notes || null
      }))
    };
    
    // Send to server
    const url = isEditing.value 
      ? `/api/invoices/${props.invoiceId}` 
      : '/api/invoices';
      
    const method = isEditing.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      ElMessage.success(status === 'draft' ? '发票已保存为草稿' : '发票已发布');
      emit('saved', result);
    } else {
      throw new Error('保存发票失败');
    }
  } catch (error) {
    console.error('保存发票失败:', error);
    ElMessage.error('保存发票失败: ' + (error.message || '未知错误'));
  } finally {
    saving.value = false;
    publishing.value = false;
  }
}

function cancel() {
  if (hasChanges()) {
    ElMessageBox.confirm('您有未保存的更改，确定要放弃吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      emit('cancel');
    }).catch(() => {});
  } else {
    emit('cancel');
  }
}

function hasChanges() {
  // For simplicity, always assume there are changes
  // In a real application, you'd compare with original values
  return true;
}
</script>

<style scoped>
.invoice-form-container {
  background-color: var(--el-bg-color);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--el-color-primary-light-8);
  border-bottom: 1px solid var(--el-border-color-light);
}

.form-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.form-actions {
  display: flex;
  gap: 10px;
}

.form-content {
  padding: 20px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.form-section {
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

.add-item-container {
  margin-top: 15px;
  margin-bottom: 15px;
  text-align: center;
}

.invoice-summary {
  margin-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 15px;
}

.summary-item {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  padding-right: 20px;
}

.summary-label {
  font-weight: bold;
  margin-right: 20px;
  color: var(--el-text-color-regular);
}

.summary-value {
  font-weight: bold;
  min-width: 120px;
  text-align: right;
  color: var(--el-text-color-primary);
}

.summary-item.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.summary-item.total .summary-value {
  color: var(--el-color-danger);
  font-size: 18px;
}

.customer-info {
  padding: 10px;
  background-color: var(--el-color-info-light-9);
  border-radius: 4px;
}

.customer-info p {
  margin: 5px 0;
}

.invoice-items-table {
  margin-bottom: 15px;
}

.amount-cell {
  text-align: right;
  font-weight: bold;
}

.customer-option, .product-option {
  display: flex;
  flex-direction: column;
}

.customer-option small, .product-option small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 768px) {
  .form-content {
    padding: 10px;
  }
  
  .form-section {
    padding: 15px;
  }
  
  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .form-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .summary-item {
    padding-right: 0;
  }
}
</style>
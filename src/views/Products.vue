<template>
  <div class="products-container">
    <div class="header">
      <h2>商品库</h2>
      <div class="description">通用商品数据，所有账套共享</div>
    </div>

    <el-card shadow="hover" class="main-card">
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索商品编码或描述"
          clearable
          @input="handleSearch"
          style="max-width: 300px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="spacer"></div>
        <el-button type="primary" @click="openDialog()">
          <el-icon><Plus /></el-icon> 添加商品
        </el-button>
      </div>

      <el-table
        :data="products"
        stripe
        style="width: 100%"
        v-loading="loading"
        row-key="id"
      >
        <el-table-column prop="id" label="序号" width="70" />
        <el-table-column prop="code" label="商品编码" width="150" />
        <el-table-column prop="description" label="商品描述" min-width="200" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="purchase_price" label="采购价" width="120">
          <template #default="scope">
            {{ formatPrice(scope.row.purchase_price) }}
          </template>
        </el-table-column>
        <el-table-column prop="selling_price" label="销售价" width="120">
          <template #default="scope">
            {{ formatPrice(scope.row.selling_price) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openDialog(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="confirmDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑商品对话框 -->
    <el-dialog
      :title="dialogData.id ? '编辑商品' : '添加商品'"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="dialogData" label-width="100px" :rules="rules" ref="productForm">
        <el-form-item v-if="dialogData.id" label="商品编码">
          <el-input v-model="dialogData.code" disabled />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="dialogData.description" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="dialogData.unit" placeholder="请输入商品单位" />
        </el-form-item>
        <el-form-item label="采购价" prop="purchase_price">
          <el-input-number 
            v-model="dialogData.purchase_price" 
            :precision="2" 
            :step="0.01" 
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="销售价" prop="selling_price">
          <el-input-number 
            v-model="dialogData.selling_price" 
            :precision="2" 
            :step="0.01" 
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProduct" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      title="确认删除"
      v-model="deleteConfirmVisible"
      width="400px"
    >
      <p>确定要删除商品 "{{ productToDelete?.description }}" 吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteConfirmVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteProduct" :loading="deleting">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { fetchWithCredentials } from '../utils/api';

export default {
  name: 'ProductsView',
  components: {
    Search,
    Plus
  },
  setup() {
    const products = ref([]);
    const loading = ref(false);
    const saving = ref(false);
    const deleting = ref(false);
    const searchText = ref('');
    const dialogVisible = ref(false);
    const deleteConfirmVisible = ref(false);
    const productToDelete = ref(null);
    const productForm = ref(null);

    const dialogData = reactive({
      id: null,
      code: '',
      description: '',
      unit: '',
      purchase_price: 0,
      selling_price: 0
    });

    const rules = {
      description: [
        { required: true, message: '请输入商品描述', trigger: 'blur' },
      ],
      purchase_price: [
        { type: 'number', message: '请输入有效的采购价', trigger: 'blur' }
      ],
      selling_price: [
        { type: 'number', message: '请输入有效的销售价', trigger: 'blur' }
      ]
    };

    // 格式化价格显示
    const formatPrice = (price) => {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
      }).format(price);
    };

    // 格式化日期
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    // 直接获取商品列表，不需要账套选择

    // 获取商品列表
    const fetchProducts = async () => {
      loading.value = true;
      try {
        let url = `/api/products`;
        if (searchText.value) {
          url += `?search=${encodeURIComponent(searchText.value)}`;
        }
        
        const response = await fetchWithCredentials(url);
        if (response.ok) {
          const data = await response.json();
          products.value = data;
        } else {
          throw new Error('获取商品列表失败');
        }
      } catch (error) {
        console.error('获取商品列表失败:', error);
        ElMessage.error('获取商品列表失败');
      } finally {
        loading.value = false;
      }
    };

    // 处理搜索
    const handleSearch = () => {
      fetchProducts();
    };

    // 打开添加/编辑对话框
    const openDialog = (product = null) => {
      if (product) {
        // 编辑模式
        Object.assign(dialogData, {
          id: product.id,
          code: product.code,
          description: product.description,
          unit: product.unit || '',
          purchase_price: product.purchase_price,
          selling_price: product.selling_price
        });
      } else {
        // 新增模式
        Object.assign(dialogData, {
          id: null,
          code: '',
          description: '',
          unit: '',
          purchase_price: 0,
          selling_price: 0
        });
      }
      dialogVisible.value = true;
    };

    // 保存商品
    const saveProduct = async () => {
      if (!productForm.value) return;
      
      await productForm.value.validate(async (valid) => {
        if (!valid) return;
        
        saving.value = true;
        try {
          let response;
          if (dialogData.id) {
            // 更新商品
            response = await fetchWithCredentials(`/api/products/${dialogData.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: dialogData.description,
                unit: dialogData.unit,
                purchase_price: dialogData.purchase_price,
                selling_price: dialogData.selling_price
              })
            });
          } else {
            // 创建商品
            response = await fetchWithCredentials('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: dialogData.description,
                unit: dialogData.unit,
                purchase_price: dialogData.purchase_price,
                selling_price: dialogData.selling_price
              })
            });
          }

          if (response.ok) {
            ElNotification({
              title: '成功',
              message: dialogData.id ? '商品已更新' : '商品已创建',
              type: 'success'
            });
            dialogVisible.value = false;
            fetchProducts();
          } else {
            const error = await response.json();
            throw new Error(error.error || '操作失败');
          }
        } catch (error) {
          console.error('保存商品失败:', error);
          ElMessage.error(error.message || '保存商品失败');
        } finally {
          saving.value = false;
        }
      });
    };

    // 确认删除商品
    const confirmDelete = (product) => {
      productToDelete.value = product;
      deleteConfirmVisible.value = true;
    };

    // 删除商品
    const deleteProduct = async () => {
      if (!productToDelete.value) return;
      
      deleting.value = true;
      try {
        const response = await fetchWithCredentials(`/api/products/${productToDelete.value.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          ElNotification({
            title: '成功',
            message: '商品已删除',
            type: 'success'
          });
          deleteConfirmVisible.value = false;
          fetchProducts();
        } else {
          const error = await response.json();
          throw new Error(error.error || '删除失败');
        }
      } catch (error) {
        console.error('删除商品失败:', error);
        ElMessage.error(error.message || '删除商品失败');
      } finally {
        deleting.value = false;
      }
    };

    onMounted(() => {
      fetchProducts();
    });

    return {
      products,
      loading,
      saving,
      deleting,
      searchText,
      dialogVisible,
      deleteConfirmVisible,
      dialogData,
      productToDelete,
      productForm,
      rules,
      formatPrice,
      formatDate,
      fetchProducts,
      handleSearch,
      openDialog,
      saveProduct,
      confirmDelete,
      deleteProduct
    };
  }
};
</script>

<style scoped>
.products-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.description {
  color: #606266;
  font-size: 14px;
  margin-left: 10px;
  align-items: center;
  margin-bottom: 20px;
}

.main-card {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.spacer {
  flex-grow: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
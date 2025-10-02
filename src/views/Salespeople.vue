<template>
  <div class="salespeople-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索业务员（名称/简称/联系电话/邮箱）"
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>添加业务员
        </el-button>
      </div>
    </div>

    <!-- 业务员卡片列表 -->
    <div class="card-list" v-loading="loading">
      <div v-if="salespeople.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无业务员数据，点击上方'添加业务员'按钮创建" />
      </div>
      
      <div v-else class="cards">
        <el-card 
          v-for="(person, index) in salespeople" 
          :key="person.id" 
          class="salesperson-card"
          :class="{ 'inactive': person.status === 'inactive' }"
        >
          <div class="card-header">
            <div class="sequence-number">{{ index + 1 }}</div>
            <div class="name-section">
              <div class="nickname">{{ person.nickname }}</div>
              <div class="name">{{ person.name }}</div>
            </div>
            <el-tag 
              :type="person.status === 'active' ? 'success' : 'info'"
              size="small"
            >
              {{ person.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </div>
          
          <div class="card-content">
            <div class="info-row" v-if="person.phone">
              <span class="label">联系电话：</span>
              <span class="value">{{ person.phone }}</span>
            </div>
            <div class="info-row" v-if="person.email">
              <span class="label">电子邮箱：</span>
              <span class="value">{{ person.email }}</span>
            </div>
          </div>
          
          <div class="card-actions">
            <el-button type="primary" size="small" @click="handleEdit(person)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button 
              :type="person.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="handleStatusChange(person)"
            >
              {{ person.status === 'active' ? '设为停用' : '设为启用' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(person)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 创建/编辑业务员对话框 -->
    <el-dialog
      :title="isEditing ? '编辑业务员' : '添加业务员'"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="简称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入业务员简称"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入业务员姓名"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入电子邮箱"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue';
import { api } from '../utils/api';

// 数据定义
const salespeople = ref([]);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const searchQuery = ref('');
const formRef = ref(null);

// 表单数据与校验规则
const form = reactive({
  id: null,
  nickname: '',
  name: '',
  phone: '',
  email: '',
  status: 'active'
});

const rules = {
  nickname: [
    { required: true, message: '请输入业务员简称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入业务员姓名', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  phone: [],  // 去除手机号格式验证，允许自由输入
  email: [
    { type: 'email', message: '请输入有效的电子邮箱地址', trigger: 'blur' }
  ]
};

// 生命周期钩子
onMounted(() => {
  fetchSalespeople();
});

// 方法
const fetchSalespeople = async () => {
  loading.value = true;
  try {
    const params = {};
    if (searchQuery.value) params.search = searchQuery.value;
    
    const data = await api.get('/api/salespeople', { params });
    salespeople.value = data;
  } catch (error) {
    console.error('获取业务员列表失败:', error);
    ElMessage.error('获取业务员列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchSalespeople();
};

const showCreateDialog = () => {
  resetForm();
  isEditing.value = false;
  dialogVisible.value = true;
};

const handleEdit = (person) => {
  resetForm();
  isEditing.value = true;
  
  // 填充表单数据
  Object.keys(form).forEach(key => {
    if (person[key] !== undefined) {
      form[key] = person[key];
    }
  });
  
  dialogVisible.value = true;
};

const resetForm = () => {
  // 重置表单数据
  Object.keys(form).forEach(key => {
    if (key === 'status') {
      form[key] = 'active';
    } else {
      form[key] = '';
    }
  });
  form.id = null;
  
  // 清除验证结果
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitting.value = true;
    try {
      const formData = { ...form };
      
      if (isEditing.value) {
        // 更新现有业务员
        const id = formData.id;
        delete formData.id; // 从请求体中移除ID
        await api.put(`/api/salespeople/${id}`, formData);
        ElMessage.success('业务员信息更新成功');
      } else {
        // 创建新业务员
        await api.post('/api/salespeople', formData);
        ElMessage.success('业务员创建成功');
      }
      
      dialogVisible.value = false;
      fetchSalespeople(); // 刷新列表
    } catch (error) {
      console.error('保存业务员信息失败:', error);
      ElMessage.error('保存业务员信息失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleStatusChange = async (person) => {
  const newStatus = person.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? '设为启用' : '设为停用';
  
  try {
    await api.patch(`/api/salespeople/${person.id}/status`, { status: newStatus });
    ElMessage.success(`已${action}`);
    // 更新本地数据
    const index = salespeople.value.findIndex(p => p.id === person.id);
    if (index !== -1) {
      salespeople.value[index].status = newStatus;
    }
  } catch (error) {
    console.error(`${action}失败:`, error);
    ElMessage.error(`${action}失败`);
  }
};

const handleDelete = async (person) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除业务员 "${person.nickname}(${person.name})" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await api.delete(`/api/salespeople/${person.id}`);
    ElMessage.success('业务员删除成功');
    fetchSalespeople(); // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除业务员失败:', error);
      ElMessage.error('删除业务员失败');
    }
  }
};
</script>

<style scoped>
.salespeople-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.toolbar-left {
  flex: 1;
  margin-right: 20px;
}

.search-input {
  width: 100%;
  max-width: 500px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.salesperson-card {
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.salesperson-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.salesperson-card.inactive {
  opacity: 0.7;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
}

.sequence-number {
  width: 24px;
  height: 24px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-right: 10px;
  flex-shrink: 0;
}

.name-section {
  flex-grow: 1;
}

.nickname {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.name {
  font-size: 14px;
  color: #606266;
}

.card-content {
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  margin: 8px 0;
}

.label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.value {
  color: #606266;
  flex-grow: 1;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 50px 0;
}
</style>
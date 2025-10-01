<template>
  <div class="customers">
    <div class="header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="showAddDialog = true">新增客户</el-button>
    </div>
    
    <el-table :data="customers" style="width: 100%">
      <el-table-column prop="name" label="客户名称" />
      <el-table-column prop="contact" label="联系人" />
      <el-table-column prop="phone" label="电话" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '活跃' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增客户对话框 -->
    <el-dialog v-model="showAddDialog" title="新增客户">
      <el-form :model="newCustomer">
        <el-form-item label="客户名称">
          <el-input v-model="newCustomer.name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="newCustomer.contact" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="newCustomer.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="newCustomer.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addCustomer">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const customers = ref([]);
const showAddDialog = ref(false);
const newCustomer = ref({
  name: '',
  contact: '',
  phone: '',
  email: ''
});

onMounted(async () => {
  await loadCustomers();
});

const loadCustomers = async () => {
  try {
    const response = await fetch('/api/customers');
    if (response.ok) {
      customers.value = await response.json();
    }
  } catch (error) {
    console.error('加载客户失败:', error);
  }
};

const addCustomer = async () => {
  try {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer.value)
    });
    
    if (response.ok) {
      showAddDialog.value = false;
      newCustomer.value = { name: '', contact: '', phone: '', email: '' };
      await loadCustomers();
    }
  } catch (error) {
    console.error('添加客户失败:', error);
  }
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
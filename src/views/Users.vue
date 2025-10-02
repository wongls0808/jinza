<template>
  <div class="users">
    <div class="header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showAddDialog = true">新增用户</el-button>
    </div>
    
    <el-table :data="users" style="width: 100%">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="role" label="角色">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
            {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="department" label="部门" />
    </el-table>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="showAddDialog" title="新增用户">
      <el-form :model="newUser">
        <el-form-item label="用户名">
          <el-input v-model="newUser.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="newUser.password" type="password" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="newUser.name" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newUser.role">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="newUser.department" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addUser">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/utils/api';

const users = ref([]);
const showAddDialog = ref(false);
const newUser = ref({
  username: '',
  password: '',
  name: '',
  role: 'user',
  department: ''
});
const loading = ref(false);
const creating = ref(false);

onMounted(async () => {
  await loadUsers();
});

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await userApi.list();
  } catch (err) {
    console.error('加载用户失败:', err);
    ElMessage.error('加载用户失败');
  } finally {
    loading.value = false;
  }
};

const addUser = async () => {
  if (!newUser.value.username || !newUser.value.password || !newUser.value.name) {
    ElMessage.warning('请填写必填字段');
    return;
  }
  creating.value = true;
  try {
    await userApi.create(newUser.value);
    ElMessage.success('创建成功');
    showAddDialog.value = false;
    newUser.value = { username: '', password: '', name: '', role: 'user', department: '' };
    await loadUsers();
  } catch (err) {
    console.error('添加用户失败:', err);
    const apiMsg = err?.data?.error || '添加用户失败';
    ElMessage.error(apiMsg);
  } finally {
    creating.value = false;
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
<template>
  <div class="users-container">
    <h1 class="page-title">用户管理</h1>
    
    <div class="search-form">
      <el-form :inline="true" :model="searchForm" ref="searchFormRef">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="searchForm.realName" placeholder="请输入真实姓名" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="realName" label="真实姓名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">{{ getRoleName(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" width="160" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="(val: number) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
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
    </el-card>
    
    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
      append-to-body
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="dialogType === 'edit'" />
        </el-form-item>
        
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword" v-if="dialogType === 'add'">
          <el-input v-model="userForm.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="userForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input v-model="userForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';

// 搜索表单
const searchFormRef = ref<FormInstance>();
const searchForm = reactive({
  username: '',
  realName: '',
  role: '',
  status: ''
});

// 表格数据
const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 对话框
const dialogVisible = ref(false);
const dialogType = ref<'add' | 'edit'>('add');
const userFormRef = ref<FormInstance>();
const userForm = reactive({
  id: '',
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: '',
  password: '',
  confirmPassword: '',
  status: 1,
  remark: ''
});

// 表单校验规则
const userRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

// 根据角色获取Tag类型
const getRoleTagType = (role: string) => {
  const map: Record<string, string> = {
    admin: 'danger',
    editor: 'warning',
    user: 'info'
  };
  return map[role] || '';
};

// 根据角色获取角色名称
const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    admin: '管理员',
    editor: '编辑',
    user: '普通用户'
  };
  return map[role] || role;
};

// 查询
const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

// 重置查询条件
const resetSearch = () => {
  searchFormRef.value?.resetFields();
  currentPage.value = 1;
  fetchData();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchData();
};

// 当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchData();
};

// 状态变化
const handleStatusChange = (row: any, val: number) => {
  ElMessage.success(`用户 ${row.username} 状态已${val === 1 ? '启用' : '禁用'}`);
};

// 新增用户
const handleAdd = () => {
  dialogType.value = 'add';
  resetUserForm();
  dialogVisible.value = true;
};

// 编辑用户
const handleEdit = (row: any) => {
  dialogType.value = 'edit';
  resetUserForm();
  
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    realName: row.realName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    remark: row.remark
  });
  
  dialogVisible.value = true;
};

// 重置用户表单
const resetUserForm = () => {
  userFormRef.value?.resetFields();
  Object.assign(userForm, {
    id: '',
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
    status: 1,
    remark: ''
  });
};

// 提交表单
const submitForm = async () => {
  if (!userFormRef.value) return;
  
  await userFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        // 新增用户
        addUser();
      } else {
        // 编辑用户
        updateUser();
      }
    }
  });
};

// 新增用户
const addUser = () => {
  // 模拟API请求
  loading.value = true;
  setTimeout(() => {
    // 生成新ID
    const newId = Date.now().toString();
    
    // 添加到表格
    tableData.value.unshift({
      id: newId,
      username: userForm.username,
      realName: userForm.realName,
      email: userForm.email,
      phone: userForm.phone,
      role: userForm.role,
      status: userForm.status,
      remark: userForm.remark,
      createTime: new Date().toLocaleString(),
      lastLoginTime: '-'
    });
    
    total.value++;
    loading.value = false;
    dialogVisible.value = false;
    ElMessage.success('新增用户成功');
  }, 500);
};

// 更新用户
const updateUser = () => {
  // 模拟API请求
  loading.value = true;
  setTimeout(() => {
    // 查找并更新用户
    const index = tableData.value.findIndex(item => item.id === userForm.id);
    if (index !== -1) {
      tableData.value[index] = {
        ...tableData.value[index],
        realName: userForm.realName,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        status: userForm.status,
        remark: userForm.remark
      };
    }
    
    loading.value = false;
    dialogVisible.value = false;
    ElMessage.success('更新用户成功');
  }, 500);
};

// 重置密码
const handleResetPassword = (row: any) => {
  ElMessageBox.prompt('请输入新密码', '重置密码', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'password',
    inputPattern: /^.{6,}$/,
    inputErrorMessage: '密码长度不能少于6位'
  }).then(({ value }) => {
    // 模拟API请求
    ElMessage.success(`用户 ${row.username} 的密码已重置`);
  }).catch(() => {
    // 取消操作
  });
};

// 删除用户
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API请求
    loading.value = true;
    setTimeout(() => {
      const index = tableData.value.findIndex(item => item.id === row.id);
      if (index !== -1) {
        tableData.value.splice(index, 1);
        total.value--;
      }
      loading.value = false;
      ElMessage.success('删除用户成功');
    }, 500);
  }).catch(() => {
    // 取消操作
  });
};

// 获取表格数据
const fetchData = () => {
  loading.value = true;
  
  // 模拟API请求
  setTimeout(() => {
    // 生成模拟数据
    const mockData = [
      {
        id: '1',
        username: 'admin',
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        role: 'admin',
        status: 1,
        remark: '系统超级管理员',
        createTime: '2025-09-01 10:00:00',
        lastLoginTime: '2025-09-26 08:30:00'
      },
      {
        id: '2',
        username: 'editor',
        realName: '内容编辑',
        email: 'editor@example.com',
        phone: '13800138001',
        role: 'editor',
        status: 1,
        remark: '内容编辑人员',
        createTime: '2025-09-01 11:00:00',
        lastLoginTime: '2025-09-25 14:20:00'
      },
      {
        id: '3',
        username: 'user1',
        realName: '张三',
        email: 'user1@example.com',
        phone: '13800138002',
        role: 'user',
        status: 1,
        remark: '普通用户',
        createTime: '2025-09-02 09:00:00',
        lastLoginTime: '2025-09-24 10:15:00'
      },
      {
        id: '4',
        username: 'user2',
        realName: '李四',
        email: 'user2@example.com',
        phone: '13800138003',
        role: 'user',
        status: 0,
        remark: '已禁用用户',
        createTime: '2025-09-03 14:00:00',
        lastLoginTime: '2025-09-15 16:40:00'
      },
      {
        id: '5',
        username: 'user3',
        realName: '王五',
        email: 'user3@example.com',
        phone: '13800138004',
        role: 'user',
        status: 1,
        remark: '',
        createTime: '2025-09-05 16:30:00',
        lastLoginTime: '2025-09-20 09:05:00'
      }
    ];
    
    // 筛选数据
    let filteredData = [...mockData];
    
    if (searchForm.username) {
      filteredData = filteredData.filter(item => 
        item.username.toLowerCase().includes(searchForm.username.toLowerCase())
      );
    }
    
    if (searchForm.realName) {
      filteredData = filteredData.filter(item => 
        item.realName.includes(searchForm.realName)
      );
    }
    
    if (searchForm.role) {
      filteredData = filteredData.filter(item => 
        item.role === searchForm.role
      );
    }
    
    if (searchForm.status !== '') {
      filteredData = filteredData.filter(item => 
        item.status.toString() === searchForm.status
      );
    }
    
    total.value = filteredData.length;
    
    // 分页
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    tableData.value = filteredData.slice(start, end);
    
    loading.value = false;
  }, 500);
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  padding: 18px 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
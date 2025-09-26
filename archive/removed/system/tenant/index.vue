<template>
  <div class="container">
    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <div>账套管理</div>
          <div>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增账套
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="mb-4">
        <el-form-item label="账套名称">
          <el-input v-model="searchForm.name" placeholder="请输入账套名称" clearable />
        </el-form-item>
        <el-form-item label="账套编码">
          <el-input v-model="searchForm.code" placeholder="请输入账套编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 账套列表 -->
      <el-table :data="tenantList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="账套名称" width="150" />
        <el-table-column prop="code" label="账套编码" width="150" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" label="过期时间" width="180" />
        <el-table-column prop="maxUserCount" label="最大用户数" width="120" />
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="success" link @click="handleManageUsers(scope.row)">
              管理用户
            </el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container mt-4">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 账套表单对话框 -->
    <el-dialog v-model="tenantDialog.visible" :title="tenantDialog.title" width="600px" @closed="resetForm('tenantForm')">
      <el-form ref="tenantForm" :model="tenantForm" :rules="tenantRules" label-width="100px">
        <el-form-item label="账套名称" prop="name">
          <el-input v-model="tenantForm.name" placeholder="请输入账套名称" />
        </el-form-item>
        <el-form-item label="账套编码" prop="code">
          <el-input v-model="tenantForm.code" placeholder="请输入账套编码" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="tenantForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="过期时间" prop="expireTime">
          <el-date-picker v-model="tenantForm.expireTime" type="datetime" placeholder="请选择过期时间" />
        </el-form-item>
        <el-form-item label="最大用户数" prop="maxUserCount">
          <el-input-number v-model="tenantForm.maxUserCount" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="tenantForm.contactName" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="tenantForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="contactEmail">
          <el-input v-model="tenantForm.contactEmail" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="tenantForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="tenantForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="tenantDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 管理用户对话框 -->
    <el-dialog v-model="userDialog.visible" title="账套用户管理" width="800px">
      <div v-if="userDialog.visible">
        <el-tabs type="border-card">
          <el-tab-pane label="当前用户">
            <el-table :data="userDialog.currentUsers" border style="width: 100%" v-loading="userDialog.loading">
              <el-table-column prop="username" label="用户名" width="120" />
              <el-table-column prop="nickname" label="昵称" width="120" />
              <el-table-column label="角色" width="200">
                <template #default="scope">
                  <el-select v-model="scope.row.roleIds" multiple placeholder="请选择角色" :disabled="!scope.row.editable">
                    <el-option
                      v-for="item in roles"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="是否管理员" width="100">
                <template #default="scope">
                  <el-checkbox v-model="scope.row.isAdmin" :disabled="!scope.row.editable" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button type="primary" link v-if="!scope.row.editable" @click="scope.row.editable = true">
                    编辑
                  </el-button>
                  <template v-else>
                    <el-button type="success" link @click="saveUserRole(scope.row)">
                      保存
                    </el-button>
                    <el-button type="info" link @click="scope.row.editable = false">
                      取消
                    </el-button>
                  </template>
                  <el-button type="danger" link @click="removeUserFromTenant(scope.row)">
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="添加用户">
            <el-form :inline="true" :model="userDialog.searchForm" class="mb-4">
              <el-form-item label="用户名">
                <el-input v-model="userDialog.searchForm.username" placeholder="请输入用户名" clearable />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="searchAvailableUsers">查询</el-button>
              </el-form-item>
            </el-form>
            
            <el-table 
              :data="userDialog.availableUsers" 
              border 
              style="width: 100%" 
              v-loading="userDialog.loading"
              @selection-change="handleUserSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="username" label="用户名" width="120" />
              <el-table-column prop="nickname" label="昵称" width="120" />
              <el-table-column prop="email" label="邮箱" width="180" />
              <el-table-column prop="phone" label="手机号" width="130" />
            </el-table>
            
            <div class="mt-4">
              <el-button type="primary" @click="addUsersToTenant">添加选中用户</el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Tenant, User, UserTenant, Role } from '@/types/system';

// 数据加载状态
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  status: ''
});

// 账套列表
const tenantList = ref<Tenant[]>([]);

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 账套表单
const tenantForm = reactive<Tenant>({
  id: '',
  name: '',
  code: '',
  status: 1,
  expireTime: '',
  maxUserCount: 100,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  remark: ''
});

// 账套表单校验规则
const tenantRules = {
  name: [
    { required: true, message: '请输入账套名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入账套编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '账套编码只能包含字母、数字、下划线和横线', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  contactPhone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  contactEmail: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 账套表单对话框
const tenantDialog = reactive({
  visible: false,
  title: '',
  type: 'add' as 'add' | 'edit'
});

// 角色列表
const roles: Role[] = [
  { id: 1, name: '超级管理员', code: 'admin', status: 1 },
  { id: 2, name: '普通用户', code: 'user', status: 1 },
  { id: 3, name: '财务', code: 'finance', status: 1 },
  { id: 4, name: '销售', code: 'sales', status: 1 }
];

// 用户管理对话框
const userDialog = reactive({
  visible: false,
  loading: false,
  tenantId: '',
  currentUsers: [] as (User & { editable?: boolean, roleIds?: number[], isAdmin?: boolean })[], // 当前账套下的用户
  availableUsers: [] as User[], // 可以添加到账套的用户
  selectedUsers: [] as User[], // 选中要添加的用户
  searchForm: {
    username: ''
  }
});

// 加载账套列表
const loadTenantList = async () => {
  loading.value = true;
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟数据
    const mockTenants: Tenant[] = [
      {
        id: 1,
        name: '示例公司1',
        code: 'company1',
        status: 1,
        expireTime: '2024-12-31 23:59:59',
        maxUserCount: 100,
        contactName: '张三',
        contactPhone: '13800138000',
        contactEmail: 'zhangsan@example.com',
        address: '北京市朝阳区',
        createTime: '2023-01-01',
        adminUserId: 1,
        remark: '示例账套1'
      },
      {
        id: 2,
        name: '示例公司2',
        code: 'company2',
        status: 1,
        expireTime: '2024-12-31 23:59:59',
        maxUserCount: 50,
        contactName: '李四',
        contactPhone: '13800138001',
        contactEmail: 'lisi@example.com',
        address: '上海市浦东新区',
        createTime: '2023-01-02',
        adminUserId: 1,
        remark: '示例账套2'
      }
    ];
    
    // 应用过滤
    const filteredTenants = mockTenants.filter(tenant => {
      let match = true;
      if (searchForm.name && !tenant.name.includes(searchForm.name)) {
        match = false;
      }
      if (searchForm.code && !tenant.code.includes(searchForm.code)) {
        match = false;
      }
      if (searchForm.status !== '' && tenant.status !== Number(searchForm.status)) {
        match = false;
      }
      return match;
    });
    
    tenantList.value = filteredTenants;
    pagination.total = filteredTenants.length;
  } catch (error) {
    console.error('加载账套列表失败', error);
    ElMessage.error('加载账套列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadTenantList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.name = '';
  searchForm.code = '';
  searchForm.status = '';
  handleSearch();
};

// 新增账套
const handleAdd = () => {
  tenantDialog.title = '新增账套';
  tenantDialog.type = 'add';
  tenantDialog.visible = true;
  // 重置表单
  Object.assign(tenantForm, {
    id: '',
    name: '',
    code: '',
    status: 1,
    expireTime: '',
    maxUserCount: 100,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    remark: ''
  });
};

// 编辑账套
const handleEdit = (row: Tenant) => {
  tenantDialog.title = '编辑账套';
  tenantDialog.type = 'edit';
  tenantDialog.visible = true;
  
  // 填充表单
  Object.assign(tenantForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    expireTime: row.expireTime || '',
    maxUserCount: row.maxUserCount || 100,
    contactName: row.contactName || '',
    contactPhone: row.contactPhone || '',
    contactEmail: row.contactEmail || '',
    address: row.address || '',
    remark: row.remark || ''
  });
};

// 提交表单
const submitForm = async () => {
  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 500));
  
  ElMessage.success(tenantDialog.type === 'add' ? '添加成功' : '修改成功');
  tenantDialog.visible = false;
  loadTenantList();
};

// 删除账套
const handleDelete = (row: Tenant) => {
  ElMessageBox.confirm('确定要删除该账套吗？删除后将无法恢复！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 模拟删除
    await new Promise(resolve => setTimeout(resolve, 500));
    
    ElMessage.success('删除成功');
    loadTenantList();
  }).catch(() => {
    // 取消删除
  });
};

// 重置表单
const resetForm = (formName: string) => {
  // 重置表单
};

// 管理账套用户
const handleManageUsers = async (row: Tenant) => {
  userDialog.tenantId = row.id as string;
  userDialog.visible = true;
  userDialog.loading = true;
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟当前账套的用户数据
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        status: 1 as 0 | 1,
        roles: [1],
        roleIds: [1],
        isAdmin: true,
        editable: false
      },
      {
        id: 2,
        username: 'test',
        nickname: '测试用户',
        email: 'test@example.com',
        phone: '13800138001',
        status: 1 as 0 | 1,
        roles: [2],
        roleIds: [2],
        isAdmin: false,
        editable: false
      }
    ] as (User & { editable: boolean, roleIds: number[], isAdmin: boolean })[];
    
    userDialog.currentUsers = mockUsers;
    
    // 加载可添加的用户
    await searchAvailableUsers();
  } catch (error) {
    console.error('加载账套用户失败', error);
    ElMessage.error('加载账套用户失败');
  } finally {
    userDialog.loading = false;
  }
};

// 搜索可添加的用户
const searchAvailableUsers = async () => {
  userDialog.loading = true;
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟可添加的用户数据
    const mockUsers = [
      {
        id: 3,
        username: 'zhangsan',
        nickname: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138002',
        status: 1 as 0 | 1,
        roles: []
      },
      {
        id: 4,
        username: 'lisi',
        nickname: '李四',
        email: 'lisi@example.com',
        phone: '13800138003',
        status: 1 as 0 | 1,
        roles: []
      }
    ] as User[];
    
    // 应用过滤
    const filteredUsers = mockUsers.filter(user => {
      return !userDialog.searchForm.username || user.username.includes(userDialog.searchForm.username);
    });
    
    userDialog.availableUsers = filteredUsers;
  } catch (error) {
    console.error('搜索可添加用户失败', error);
    ElMessage.error('搜索可添加用户失败');
  } finally {
    userDialog.loading = false;
  }
};

// 用户选择变更
const handleUserSelectionChange = (selection: User[]) => {
  userDialog.selectedUsers = selection;
};

// 添加用户到账套
const addUsersToTenant = async () => {
  if (userDialog.selectedUsers.length === 0) {
    ElMessage.warning('请选择要添加的用户');
    return;
  }
  
  userDialog.loading = true;
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 添加成功后，重新加载当前用户列表
    const newUsers = userDialog.selectedUsers.map(user => ({
      ...user,
      roleIds: [2], // 默认分配普通用户角色
      isAdmin: false,
      editable: false
    }));
    
    userDialog.currentUsers = [...userDialog.currentUsers, ...newUsers];
    userDialog.selectedUsers = [];
    
    ElMessage.success('添加用户成功');
    
    // 重新加载可添加的用户
    await searchAvailableUsers();
  } catch (error) {
    console.error('添加用户失败', error);
    ElMessage.error('添加用户失败');
  } finally {
    userDialog.loading = false;
  }
};

// 保存用户角色
const saveUserRole = async (user: User & { editable?: boolean, roleIds?: number[], isAdmin?: boolean }) => {
  userDialog.loading = true;
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新成功
    user.editable = false;
    ElMessage.success('保存成功');
  } catch (error) {
    console.error('保存用户角色失败', error);
    ElMessage.error('保存用户角色失败');
  } finally {
    userDialog.loading = false;
  }
};

// 从账套中移除用户
const removeUserFromTenant = (user: User) => {
  ElMessageBox.confirm('确定要将该用户从账套中移除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    userDialog.loading = true;
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 移除用户
      userDialog.currentUsers = userDialog.currentUsers.filter(u => u.id !== user.id);
      ElMessage.success('移除成功');
      
      // 重新加载可添加的用户
      await searchAvailableUsers();
    } catch (error) {
      console.error('移除用户失败', error);
      ElMessage.error('移除用户失败');
    } finally {
      userDialog.loading = false;
    }
  }).catch(() => {
    // 取消移除
  });
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  loadTenantList();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  pagination.current = val;
  loadTenantList();
};

// 生命周期钩子
onMounted(() => {
  loadTenantList();
});
</script>

<style scoped>
.container {
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.w-full {
  width: 100%;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
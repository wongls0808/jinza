<template>
  <div class="container">
    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <div>用户管理</div>
          <div>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增用户
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="mb-4">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="账套">
          <el-select v-model="searchForm.tenantId" placeholder="请选择账套" clearable>
            <el-option
              v-for="item in tenants"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
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
      
      <!-- 用户列表 -->
      <el-table :data="userList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column label="头像" width="80">
          <template #default="scope">
            <el-avatar :size="32" :src="scope.row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="150">
          <template #default="scope">
            <el-tag v-for="role in scope.row.roles" :key="typeof role === 'object' ? role.id : role" 
                  class="mr-1">
              {{ getRoleName(role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可用账套" min-width="200">
          <template #default="scope">
            <el-tag v-for="tenant in scope.row.tenants" :key="typeof tenant === 'object' ? tenant.id : tenant" 
                  class="mr-1 mb-1" type="info">
              {{ getTenantName(tenant) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="primary" link @click="handleAssignRoles(scope.row)">
              分配角色
            </el-button>
            <el-button type="primary" link @click="handleAssignTenants(scope.row)">
              分配账套
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
    
    <!-- 用户表单对话框 -->
    <el-dialog v-model="userDialog.visible" :title="userDialog.title" width="600px" @closed="resetForm('userForm')">
      <el-form ref="userForm" :model="userForm" :rules="userRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="userDialog.type === 'add'">
          <el-input v-model="userForm.password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select v-model="userForm.roles" multiple placeholder="请选择角色">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="userForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="userDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 分配角色对话框 -->
    <el-dialog v-model="roleDialog.visible" title="分配角色" width="500px">
      <el-transfer 
        v-model="roleDialog.selectedRoles" 
        :data="roleDialog.allRoles"
        :titles="['可选角色', '已选角色']"
        :button-texts="['移除', '添加']"
        :props="{
          key: 'id',
          label: 'name'
        }"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="roleDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignRoles">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 分配账套对话框 -->
    <el-dialog v-model="tenantDialog.visible" title="分配账套" width="500px">
      <el-transfer
        v-model="tenantDialog.selectedTenants"
        :data="tenantDialog.allTenants"
        :titles="['可选账套', '已选账套']"
        :button-texts="['移除', '添加']"
        :props="{
          key: 'id',
          label: 'name'
        }"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="tenantDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignTenants">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { User, Role, Tenant } from '@/types/system';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// 使用 store 中的角色/租户数据（mock 存在于 store）
const roles = ref<Role[]>([]);
const tenants = ref<Tenant[]>([]);

// 数据加载状态
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  username: '',
  tenantId: '',
  status: ''
});

// 用户列表
const userList = ref<User[]>([]);

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 用户表单
const userForm = reactive<User>({
  id: '',
  username: '',
  nickname: '',
  password: '',
  email: '',
  phone: '',
  status: 1,
  roles: [],
  remark: ''
});

// 用户表单校验规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 用户表单对话框
const userDialog = reactive({
  visible: false,
  title: '',
  type: 'add' as 'add' | 'edit'
});

// 角色分配对话框
const roleDialog = reactive({
  visible: false,
  userId: '',
  allRoles: [] as { id: number | string; name: string; key: number | string }[],
  selectedRoles: [] as (string | number)[]
});

// 账套分配对话框
const tenantDialog = reactive({
  visible: false,
  userId: '',
  allTenants: [] as { id: number | string; name: string; key: number | string }[],
  selectedTenants: [] as (string | number)[]
});

// 获取角色名称
const getRoleName = (role: Role | number | string): string => {
  if (typeof role === 'object' && role !== null) {
    return role.name;
  }
  const foundRole = roles.value.find(r => r.id === role);
  return foundRole ? foundRole.name : `角色${role}`;
};

// 获取账套名称
const getTenantName = (tenant: Tenant | number | string): string => {
  if (typeof tenant === 'object' && tenant !== null) {
    return tenant.name;
  }
  const foundTenant = tenants.value.find((t: Tenant) => t.id === tenant);
  return foundTenant ? foundTenant.name : `账套${tenant}`;
};

// 加载用户列表
const loadUserList = async () => {
  loading.value = true;
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
  // 模拟数据
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        status: 1,
        roles: [1],
        tenants: [1, 2],
        createTime: '2023-01-01',
        remark: '超级管理员'
      },
      {
        id: 2,
        username: 'test',
        nickname: '测试用户',
        email: 'test@example.com',
        phone: '13800138001',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        status: 1,
        roles: [2],
        tenants: [1],
        createTime: '2023-01-02',
        remark: '测试账号'
      }
    ];
    
    // 应用过滤
    const filteredUsers = mockUsers.filter(user => {
      let match = true;
      if (searchForm.username && !user.username.includes(searchForm.username)) {
        match = false;
      }
      if (searchForm.tenantId && Array.isArray(user.tenants)) {
        const hasTenant = user.tenants.some(t => 
          typeof t === 'object' ? t.id === Number(searchForm.tenantId) : t === Number(searchForm.tenantId)
        );
        if (!hasTenant) {
          match = false;
        }
      }
      if (searchForm.status !== '' && user.status !== Number(searchForm.status)) {
        match = false;
      }
      return match;
    });
    
    userList.value = filteredUsers;
    pagination.total = filteredUsers.length;
  } catch (error) {
    console.error('加载用户列表失败', error);
    ElMessage.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadUserList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.username = '';
  searchForm.tenantId = '';
  searchForm.status = '';
  handleSearch();
};

// 新增用户
const handleAdd = () => {
  userDialog.title = '新增用户';
  userDialog.type = 'add';
  userDialog.visible = true;
  // 重置表单
  Object.assign(userForm, {
    id: '',
    username: '',
    nickname: '',
    password: '',
    email: '',
    phone: '',
    status: 1,
    roles: [],
    remark: ''
  });
};

// 编辑用户
const handleEdit = (row: User) => {
  userDialog.title = '编辑用户';
  userDialog.type = 'edit';
  userDialog.visible = true;
  
  // 填充表单
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    nickname: row.nickname || '',
    email: row.email || '',
    phone: row.phone || '',
    status: row.status,
    roles: row.roles,
    remark: row.remark || ''
  });
};

// 提交表单
const submitForm = async () => {
  try {
    // 表单验证（若需要可以使用 ref 的 validate）
    if (userDialog.type === 'add') {
      // 创建用户
      const created = await userStore.createUser({
        username: userForm.username,
        nickname: userForm.nickname,
        password: userForm.password,
        email: userForm.email,
        phone: userForm.phone,
        status: userForm.status,
        roles: userForm.roles as any,
        remark: userForm.remark
      });
      // 分配角色（如果有）
      if (Array.isArray(userForm.roles) && userForm.roles.length > 0) {
        await userStore.assignRolesToUser(Number(created.id), userForm.roles as number[]);
      }
      ElMessage.success('添加成功');
    } else {
      // 更新用户
      await userStore.updateUser(Number(userForm.id), {
        nickname: userForm.nickname,
        email: userForm.email,
        phone: userForm.phone,
        status: userForm.status,
        roles: userForm.roles as any,
        remark: userForm.remark
      });
      if (Array.isArray(userForm.roles)) {
        await userStore.assignRolesToUser(Number(userForm.id), userForm.roles as number[]);
      }
      ElMessage.success('修改成功');
    }
    userDialog.visible = false;
    loadUserList();
  } catch (err) {
    console.error('保存用户失败', err);
    ElMessage.error('保存用户失败: ' + (err instanceof Error ? err.message : '未知错误'));
  }
};

// 删除用户
const handleDelete = (row: User) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 模拟删除
    await new Promise(resolve => setTimeout(resolve, 500));
    
    ElMessage.success('删除成功');
    loadUserList();
  }).catch(() => {
    // 取消删除
  });
};

// 重置表单
const resetForm = (formName: string) => {
  // 重置表单
};

// 分配角色
const handleAssignRoles = (row: User) => {
  roleDialog.userId = row.id as string;
  roleDialog.selectedRoles = Array.isArray(row.roles) 
    ? row.roles.map(r => typeof r === 'object' ? r.id : r)
    : [];
  roleDialog.visible = true;
};

// 提交角色分配
const submitAssignRoles = async () => {
  try {
    // 调用 store 的分配方法（覆盖式分配）
    await userStore.assignRolesToUser(Number(roleDialog.userId), roleDialog.selectedRoles as number[]);
    ElMessage.success('角色分配成功');
    roleDialog.visible = false;
    loadUserList();
  } catch (err) {
    console.error('分配角色失败', err);
    ElMessage.error('分配角色失败: ' + (err instanceof Error ? err.message : '未知错误'));
  }
};

// 分配账套
const handleAssignTenants = (row: User) => {
  tenantDialog.userId = row.id as string;
  tenantDialog.selectedTenants = Array.isArray(row.tenants) 
    ? row.tenants.map(t => typeof t === 'object' ? t.id : t)
    : [];
  tenantDialog.visible = true;
};

// 提交账套分配
const submitAssignTenants = async () => {
  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 500));
  
  ElMessage.success('账套分配成功');
  tenantDialog.visible = false;
  loadUserList();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  loadUserList();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  pagination.current = val;
  loadUserList();
};

// 生命周期钩子
onMounted(() => {
  loadUserList();

  // 初始化角色与账套数据来自 store
  (async () => {
    try {
      const fetchedRoles = await userStore.fetchRoles();
      roles.value = fetchedRoles as Role[];
      // map to dialog format
      roleDialog.allRoles = roles.value.map(r => ({ id: r.id, name: r.name, key: r.id }));

      // tenants 在 store 中可能是针对当前登录用户的账套列表
      tenants.value = userStore.tenants || [];
      tenantDialog.allTenants = tenants.value.map(t => ({ id: t.id, name: t.name, key: t.id }));
    } catch (err) {
      // ignore, keep local mocks if fetch fails
      console.warn('加载角色或账套失败', err);
    }
  })();
});
</script>

<style scoped>
.container {
  padding: 20px;
}

.mr-1 {
  margin-right: 4px;
}

.mb-1 {
  margin-bottom: 4px;
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
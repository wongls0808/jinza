<template>
  <div class="container">
    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <div>角色管理</div>
          <div>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增角色
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="mb-4">
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.name" placeholder="请输入角色名称" clearable />
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
      
      <!-- 角色列表 -->
      <el-table :data="roleList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色编码" width="150" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="remark" label="备注" min-width="200" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="primary" link @click="handleAssignPermissions(scope.row)">
              分配权限
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
    
    <!-- 角色表单对话框 -->
    <el-dialog v-model="roleDialog.visible" :title="roleDialog.title" width="500px" @closed="resetForm('roleForm')">
      <el-form ref="roleForm" :model="roleForm" :rules="roleRules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="roleForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="roleForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="roleDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 权限分配对话框 -->
    <el-dialog v-model="permissionDialog.visible" title="分配权限" width="600px">
      <el-tree
        ref="permissionTree"
        :data="permissionDialog.permissionTree"
        :props="{
          label: 'name',
          children: 'children'
        }"
        show-checkbox
        node-key="id"
        :default-checked-keys="permissionDialog.selectedPermissions"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignPermissions">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Role, Permission } from '@/types/system';

// 数据加载状态
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
});

// 角色列表
const roleList = ref<Role[]>([]);

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 角色表单
const roleForm = reactive<Role>({
  id: '',
  name: '',
  code: '',
  status: 1,
  remark: ''
});

// 角色表单校验规则
const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '角色编码只能包含字母、数字、下划线和横线', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
};

// 角色表单对话框
const roleDialog = reactive({
  visible: false,
  title: '',
  type: 'add' as 'add' | 'edit'
});

// 权限树
const permissionTree = ref<HTMLElement | null>(null);

// 模拟权限树数据
const mockPermissionTree = [
  {
    id: 1,
    name: '系统管理',
    type: 'menu',
    children: [
      {
        id: 2,
        name: '用户管理',
        type: 'menu',
        children: [
          { id: 3, name: '用户查询', type: 'button', code: 'system:user:list' },
          { id: 4, name: '用户新增', type: 'button', code: 'system:user:add' },
          { id: 5, name: '用户修改', type: 'button', code: 'system:user:edit' },
          { id: 6, name: '用户删除', type: 'button', code: 'system:user:delete' }
        ]
      },
      {
        id: 7,
        name: '角色管理',
        type: 'menu',
        children: [
          { id: 8, name: '角色查询', type: 'button', code: 'system:role:list' },
          { id: 9, name: '角色新增', type: 'button', code: 'system:role:add' },
          { id: 10, name: '角色修改', type: 'button', code: 'system:role:edit' },
          { id: 11, name: '角色删除', type: 'button', code: 'system:role:delete' }
        ]
      },
      {
        id: 12,
        name: '菜单管理',
        type: 'menu',
        children: [
          { id: 13, name: '菜单查询', type: 'button', code: 'system:menu:list' },
          { id: 14, name: '菜单新增', type: 'button', code: 'system:menu:add' },
          { id: 15, name: '菜单修改', type: 'button', code: 'system:menu:edit' },
          { id: 16, name: '菜单删除', type: 'button', code: 'system:menu:delete' }
        ]
      },
      {
        id: 17,
        name: '账套管理',
        type: 'menu',
        children: [
          { id: 18, name: '账套查询', type: 'button', code: 'system:tenant:list' },
          { id: 19, name: '账套新增', type: 'button', code: 'system:tenant:add' },
          { id: 20, name: '账套修改', type: 'button', code: 'system:tenant:edit' },
          { id: 21, name: '账套删除', type: 'button', code: 'system:tenant:delete' }
        ]
      }
    ]
  }
];

// 权限分配对话框
const permissionDialog = reactive({
  visible: false,
  roleId: '',
  permissionTree: mockPermissionTree,
  selectedPermissions: [] as (string | number)[]
});

// 加载角色列表
const loadRoleList = async () => {
  loading.value = true;
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟数据
    const mockRoles: Role[] = [
      {
        id: 1,
        name: '超级管理员',
        code: 'admin',
        status: 1,
        permissions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        createTime: '2023-01-01',
        remark: '超级管理员，拥有所有权限'
      },
      {
        id: 2,
        name: '普通用户',
        code: 'user',
        status: 1,
        permissions: [3, 8, 13, 18],
        createTime: '2023-01-02',
        remark: '普通用户，只有查询权限'
      },
      {
        id: 3,
        name: '财务',
        code: 'finance',
        status: 1,
        permissions: [3, 8, 13, 18],
        createTime: '2023-01-03',
        remark: '财务人员'
      },
      {
        id: 4,
        name: '销售',
        code: 'sales',
        status: 1,
        permissions: [3, 8, 13, 18],
        createTime: '2023-01-04',
        remark: '销售人员'
      }
    ];
    
    // 应用过滤
    const filteredRoles = mockRoles.filter(role => {
      let match = true;
      if (searchForm.name && !role.name.includes(searchForm.name)) {
        match = false;
      }
      if (searchForm.status !== '' && role.status !== Number(searchForm.status)) {
        match = false;
      }
      return match;
    });
    
    roleList.value = filteredRoles;
    pagination.total = filteredRoles.length;
  } catch (error) {
    console.error('加载角色列表失败', error);
    ElMessage.error('加载角色列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadRoleList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.name = '';
  searchForm.status = '';
  handleSearch();
};

// 新增角色
const handleAdd = () => {
  roleDialog.title = '新增角色';
  roleDialog.type = 'add';
  roleDialog.visible = true;
  // 重置表单
  Object.assign(roleForm, {
    id: '',
    name: '',
    code: '',
    status: 1,
    remark: ''
  });
};

// 编辑角色
const handleEdit = (row: Role) => {
  roleDialog.title = '编辑角色';
  roleDialog.type = 'edit';
  roleDialog.visible = true;
  
  // 填充表单
  Object.assign(roleForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    remark: row.remark || ''
  });
};

// 提交表单
const submitForm = async () => {
  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 500));
  
  ElMessage.success(roleDialog.type === 'add' ? '添加成功' : '修改成功');
  roleDialog.visible = false;
  loadRoleList();
};

// 删除角色
const handleDelete = (row: Role) => {
  ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 模拟删除
    await new Promise(resolve => setTimeout(resolve, 500));
    
    ElMessage.success('删除成功');
    loadRoleList();
  }).catch(() => {
    // 取消删除
  });
};

// 重置表单
const resetForm = (formName: string) => {
  // 重置表单
};

// 分配权限
const handleAssignPermissions = (row: Role) => {
  permissionDialog.roleId = row.id as string;
  permissionDialog.selectedPermissions = Array.isArray(row.permissions) 
    ? row.permissions.map(p => typeof p === 'object' ? p.id : p)
    : [];
  permissionDialog.visible = true;
};

// 提交权限分配
const submitAssignPermissions = async () => {
  // 模拟提交
  const selectedKeys = permissionTree.value ? [] : []; // 这里应该获取树选中的节点ID
  
  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 500));
  
  ElMessage.success('权限分配成功');
  permissionDialog.visible = false;
  loadRoleList();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  loadRoleList();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  pagination.current = val;
  loadRoleList();
};

// 生命周期钩子
onMounted(() => {
  loadRoleList();
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
<template>
  <div class="container">
    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <div>菜单管理</div>
          <div>
            <el-button type="primary" @click="handleAdd(null)">
              <el-icon><Plus /></el-icon>新增一级菜单
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 菜单树表 -->
      <el-table
        :data="menuList"
        row-key="id"
        border
        :tree-props="{ children: 'children' }"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="菜单名称" min-width="180">
          <template #default="scope">
            <span v-if="scope.row.icon">
              <el-icon>
                <component :is="scope.row.icon"></component>
              </el-icon>
              {{ scope.row.name }}
            </span>
            <span v-else>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="180" />
        <el-table-column prop="component" label="组件路径" min-width="180" />
        <el-table-column prop="perms" label="权限标识" min-width="180" />
        <el-table-column label="类型" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 'directory'">目录</el-tag>
            <el-tag v-else-if="scope.row.type === 'menu'" type="success">菜单</el-tag>
            <el-tag v-else-if="scope.row.type === 'button'" type="info">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="显示状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.visible ? 'success' : 'info'">
              {{ scope.row.visible ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleAdd(scope.row)">
              新增子菜单
            </el-button>
            <el-button type="primary" link @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 菜单表单对话框 -->
    <el-dialog v-model="menuDialog.visible" :title="menuDialog.title" width="700px" @closed="resetForm('menuForm')">
      <el-form ref="menuForm" :model="menuForm" :rules="menuRules" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="menuForm.parentId"
            :data="menuTreeSelectData"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            node-key="id"
            :default-expand-all="true"
            placeholder="请选择上级菜单"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="type">
          <el-radio-group v-model="menuForm.type">
            <el-radio label="directory">目录</el-radio>
            <el-radio label="menu">菜单</el-radio>
            <el-radio label="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path" v-if="menuForm.type !== 'button'">
          <el-input v-model="menuForm.path" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component" v-if="menuForm.type === 'menu'">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item label="重定向" prop="redirect" v-if="menuForm.type === 'directory'">
          <el-input v-model="menuForm.redirect" placeholder="请输入重定向路径" />
        </el-form-item>
        <el-form-item label="菜单图标" v-if="menuForm.type !== 'button'">
          <el-input v-model="menuForm.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="权限标识" prop="perms">
          <el-input v-model="menuForm.perms" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="menuForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="显示状态">
          <el-radio-group v-model="menuForm.visible">
            <el-radio :label="true">显示</el-radio>
            <el-radio :label="false">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单状态">
          <el-radio-group v-model="menuForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否外链" v-if="menuForm.type !== 'button'">
          <el-radio-group v-model="menuForm.isFrame">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="menuDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Menu } from '@/types/system';

// 数据加载状态
const loading = ref(false);

// 菜单列表
const menuList = ref<Menu[]>([]);

// 菜单对话框
const menuDialog = reactive({
  visible: false,
  title: '',
  type: 'add' as 'add' | 'edit'
});

// 菜单表单
const menuForm = reactive<Partial<Menu>>({
  id: '',
  name: '',
  path: '',
  component: '',
  redirect: '',
  icon: '',
  parentId: null,
  sort: 0,
  type: 'menu',
  perms: '',
  visible: true,
  status: 1,
  isFrame: false
});

// 菜单表单校验规则
const menuRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入路由路径', trigger: 'blur' }
  ],
  component: [
    { required: true, message: '请输入组件路径', trigger: 'blur' }
  ]
};

// 菜单树选择数据
const menuTreeSelectData = computed(() => {
  // 构建一个顶级节点
  return [
    {
      id: 0,
      name: '顶级菜单',
      children: menuList.value
    }
  ];
});

// 加载菜单列表
const loadMenuList = async () => {
  loading.value = true;
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        name: '系统管理',
        path: '/system',
        component: 'Layout',
        redirect: '/system/user',
        icon: 'Setting',
        parentId: null,
        sort: 1,
        type: 'directory',
        perms: '',
        visible: true,
        status: 1,
        isFrame: false,
        children: [
          {
            id: 2,
            name: '用户管理',
            path: 'user',
            component: 'system/user/index',
            icon: 'User',
            parentId: 1,
            sort: 1,
            type: 'menu',
            perms: 'system:user:list',
            visible: true,
            status: 1,
            isFrame: false,
            children: [
              {
                id: 6,
                name: '用户查询',
                path: '',
                parentId: 2,
                sort: 1,
                type: 'button',
                perms: 'system:user:query',
                visible: true,
                status: 1,
                isFrame: false
              },
              {
                id: 7,
                name: '用户新增',
                path: '',
                parentId: 2,
                sort: 2,
                type: 'button',
                perms: 'system:user:add',
                visible: true,
                status: 1,
                isFrame: false
              }
            ]
          },
          {
            id: 3,
            name: '角色管理',
            path: 'role',
            component: 'system/role/index',
            icon: 'UserFilled',
            parentId: 1,
            sort: 2,
            type: 'menu',
            perms: 'system:role:list',
            visible: true,
            status: 1,
            isFrame: false
          },
          {
            id: 4,
            name: '菜单管理',
            path: 'menu',
            component: 'system/menu/index',
            icon: 'Menu',
            parentId: 1,
            sort: 3,
            type: 'menu',
            perms: 'system:menu:list',
            visible: true,
            status: 1,
            isFrame: false
          },
          {
            id: 5,
            name: '账套管理',
            path: 'tenant',
            component: 'system/tenant/index',
            icon: 'Office',
            parentId: 1,
            sort: 4,
            type: 'menu',
            perms: 'system:tenant:list',
            visible: true,
            status: 1,
            isFrame: false
          }
        ]
      },
      {
        id: 8,
        name: '首页',
        path: '/dashboard',
        component: 'Layout',
        redirect: '/dashboard/index',
        icon: 'HomeFilled',
        parentId: null,
        sort: 0,
        type: 'directory',
        perms: '',
        visible: true,
        status: 1,
        isFrame: false,
        children: [
          {
            id: 9,
            name: '首页',
            path: 'index',
            component: 'dashboard/index',
            icon: 'HomeFilled',
            parentId: 8,
            sort: 1,
            type: 'menu',
            perms: 'dashboard:index',
            visible: true,
            status: 1,
            isFrame: false
          }
        ]
      }
    ];
    
    menuList.value = mockMenus;
  } catch (error) {
    console.error('加载菜单列表失败', error);
    ElMessage.error('加载菜单列表失败');
  } finally {
    loading.value = false;
  }
};

// 新增菜单
const handleAdd = (row: Menu | null) => {
  resetForm('menuForm');
  menuDialog.title = '新增菜单';
  menuDialog.type = 'add';
  menuDialog.visible = true;
  
  // 如果是添加子菜单
  if (row) {
    menuForm.parentId = row.id;
    
    // 如果父级是目录，则子级默认为菜单
    if (row.type === 'directory') {
      menuForm.type = 'menu';
    }
    // 如果父级是菜单，则子级默认为按钮
    else if (row.type === 'menu') {
      menuForm.type = 'button';
    }
  } else {
    // 添加顶级菜单，默认为目录
    menuForm.parentId = null;
    menuForm.type = 'directory';
  }
};

// 编辑菜单
const handleEdit = (row: Menu) => {
  menuDialog.title = '编辑菜单';
  menuDialog.type = 'edit';
  menuDialog.visible = true;
  
  // 填充表单
  Object.assign(menuForm, {
    id: row.id,
    name: row.name,
    path: row.path || '',
    component: row.component || '',
    redirect: row.redirect || '',
    icon: row.icon || '',
    parentId: row.parentId,
    sort: row.sort,
    type: row.type,
    perms: row.perms || '',
    visible: row.visible,
    status: row.status,
    isFrame: row.isFrame
  });
};

// 删除菜单
const handleDelete = (row: Menu) => {
  // 判断是否有子菜单
  if (row.children && row.children.length > 0) {
    ElMessage.warning('该菜单下存在子菜单，请先删除子菜单');
    return;
  }
  
  ElMessageBox.confirm('确定要删除该菜单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 模拟删除
    await new Promise(resolve => setTimeout(resolve, 500));
    
    ElMessage.success('删除成功');
    loadMenuList();
  }).catch(() => {
    // 取消删除
  });
};

// 提交表单
const submitForm = async () => {
  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 500));
  
  ElMessage.success(menuDialog.type === 'add' ? '添加成功' : '修改成功');
  menuDialog.visible = false;
  loadMenuList();
};

// 重置表单
const resetForm = (formName: string) => {
  Object.assign(menuForm, {
    id: '',
    name: '',
    path: '',
    component: '',
    redirect: '',
    icon: '',
    parentId: null,
    sort: 0,
    type: 'menu',
    perms: '',
    visible: true,
    status: 1,
    isFrame: false
  });
};

// 生命周期钩子
onMounted(() => {
  loadMenuList();
});
</script>

<style scoped>
.container {
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
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
</style>
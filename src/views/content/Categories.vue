<template>
  <div class="categories-container">
    <h1 class="page-title">分类管理</h1>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="category-form-card">
          <template #header>
            <div class="card-header">
              <span>{{ formTitle }}</span>
            </div>
          </template>
          
          <el-form :model="categoryForm" :rules="rules" ref="formRef" label-width="80px">
            <el-form-item label="分类名称" prop="name">
              <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
            </el-form-item>
            
            <el-form-item label="父级分类" prop="parentId">
              <el-select v-model="categoryForm.parentId" placeholder="请选择父级分类" clearable style="width: 100%;">
                <el-option label="无" :value="0" />
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                  :disabled="categoryForm.id === item.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="categoryForm.sort" :min="0" :max="1000" />
            </el-form-item>
            
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="categoryForm.status"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
            
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="categoryForm.description"
                type="textarea"
                placeholder="请输入描述"
                :rows="4"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="submitForm">{{ categoryForm.id ? '更新' : '新增' }}</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card class="category-table-card">
          <template #header>
            <div class="card-header">
              <span>分类列表</span>
              <el-input
                v-model="filterText"
                placeholder="输入关键字进行过滤"
                style="width: 200px;"
                clearable
              />
            </div>
          </template>
          
          <el-table
            :data="tableData"
            style="width: 100%"
            row-key="id"
            border
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="分类名称" min-width="150" />
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button link type="primary" @click="handleAddSub(scope.row)">添加子类</el-button>
                <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';

interface Category {
  id: number;
  name: string;
  parentId: number;
  sort: number;
  status: number;
  description: string;
  children?: Category[];
}

// 表单引用
const formRef = ref<FormInstance>();

// 表单标题
const formTitle = computed(() => categoryForm.id ? '编辑分类' : '新增分类');

// 分类表单
const categoryForm = reactive<Category>({
  id: 0,
  name: '',
  parentId: 0,
  sort: 0,
  status: 1,
  description: ''
});

// 表单校验规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
});

// 表格数据
const tableData = ref<Category[]>([]);

// 过滤文本
const filterText = ref('');

// 分类选项
const categoryOptions = computed(() => {
  // 展平树形结构为一级列表
  const flattenCategories = (categories: Category[]): Category[] => {
    return categories.reduce((acc: Category[], curr: Category) => {
      acc.push(curr);
      if (curr.children && curr.children.length > 0) {
        acc.push(...flattenCategories(curr.children));
      }
      return acc;
    }, []);
  };
  
  return flattenCategories(tableData.value);
});

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    if (categoryForm.id) {
      // 更新分类
      updateCategory();
    } else {
      // 新增分类
      addCategory();
    }
  } catch (error) {
    console.error('表单验证失败', error);
  }
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(categoryForm, {
    id: 0,
    name: '',
    parentId: 0,
    sort: 0,
    status: 1,
    description: ''
  });
};

// 新增分类
const addCategory = () => {
  // 模拟API请求
  setTimeout(() => {
    // 生成一个新ID
    const newId = Math.max(...categoryOptions.value.map(item => item.id), 0) + 1;
    
    const newCategory: Category = {
      ...categoryForm,
      id: newId
    };
    
    // 如果是顶级分类
    if (newCategory.parentId === 0) {
      tableData.value.push(newCategory);
    } else {
      // 如果是子分类，找到父级并添加到children
      addToParent(tableData.value, newCategory);
    }
    
    ElMessage.success('新增分类成功');
    resetForm();
  }, 300);
};

// 添加到父级分类的children中
const addToParent = (categories: Category[], newCategory: Category) => {
  for (const category of categories) {
    if (category.id === newCategory.parentId) {
      if (!category.children) {
        category.children = [];
      }
      category.children.push(newCategory);
      return true;
    }
    
    if (category.children && category.children.length) {
      if (addToParent(category.children, newCategory)) {
        return true;
      }
    }
  }
  
  return false;
};

// 更新分类
const updateCategory = () => {
  // 模拟API请求
  setTimeout(() => {
    // 递归更新分类
    const updateInTree = (categories: Category[]): boolean => {
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        if (category && category.id === categoryForm.id) {
          // 更新当前节点
          categories[i] = { ...categoryForm };
          return true;
        }
        
        if (category && category.children && category.children.length > 0) {
          if (updateInTree(category.children)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    updateInTree(tableData.value);
    ElMessage.success('更新分类成功');
    resetForm();
  }, 300);
};

// 编辑分类
const handleEdit = (row: Category) => {
  Object.assign(categoryForm, row);
};

// 添加子类
const handleAddSub = (row: Category) => {
  resetForm();
  categoryForm.parentId = row.id;
  ElMessage.info(`正在为 ${row.name} 添加子分类`);
};

// 删除分类
const handleDelete = (row: Category) => {
  ElMessageBox.confirm(`确认删除分类"${row.name}"吗？${row.children && row.children.length ? '注意：将同时删除其所有子分类！' : ''}`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 递归删除分类
    const deleteFromTree = (categories: Category[], id: number): boolean => {
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        if (category && category.id === id) {
          categories.splice(i, 1);
          return true;
        }
        
        if (category && category.children && category.children.length > 0) {
          if (deleteFromTree(category.children, id)) {
            // 如果子分类为空，删除children属性
            if (category.children.length === 0) {
              delete category.children;
            }
            return true;
          }
        }
      }
      
      return false;
    };
    
    deleteFromTree(tableData.value, row.id);
    ElMessage.success('删除成功');
    
    // 如果正在编辑被删除的分类，重置表单
    if (categoryForm.id === row.id) {
      resetForm();
    }
  }).catch(() => {
    // 取消操作
  });
};

// 初始化数据
const initData = () => {
  // 模拟API请求
  setTimeout(() => {
    // 生成模拟数据
    tableData.value = [
      {
        id: 1,
        name: '新闻',
        parentId: 0,
        sort: 1,
        status: 1,
        description: '新闻资讯分类',
        children: [
          {
            id: 4,
            name: '行业新闻',
            parentId: 1,
            sort: 1,
            status: 1,
            description: '行业相关新闻'
          },
          {
            id: 5,
            name: '公司新闻',
            parentId: 1,
            sort: 2,
            status: 1,
            description: '公司相关新闻'
          }
        ]
      },
      {
        id: 2,
        name: '产品',
        parentId: 0,
        sort: 2,
        status: 1,
        description: '产品相关分类',
        children: [
          {
            id: 6,
            name: '软件产品',
            parentId: 2,
            sort: 1,
            status: 1,
            description: '软件产品分类'
          },
          {
            id: 7,
            name: '硬件产品',
            parentId: 2,
            sort: 2,
            status: 1,
            description: '硬件产品分类'
          }
        ]
      },
      {
        id: 3,
        name: '服务',
        parentId: 0,
        sort: 3,
        status: 0,
        description: '服务相关分类'
      }
    ];
  }, 300);
};

onMounted(() => {
  initData();
});
</script>

<style scoped>
.categories-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-form-card, .category-table-card {
  margin-bottom: 20px;
}
</style>
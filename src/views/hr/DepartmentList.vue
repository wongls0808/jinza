<template>
  <div class="department-list-container">
    <div class="page-header">
      <h2>部门管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddDepartment">
          <el-icon><Plus /></el-icon>新增部门
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="department-tree-card">
          <template #header>
            <div class="card-header">
              <span>部门结构</span>
              <el-button link type="primary" @click="refreshDepartmentTree">刷新</el-button>
            </div>
          </template>
          <div class="department-tree-container">
            <el-input
              v-model="filterText"
              placeholder="输入关键字过滤"
              clearable
              class="filter-input"
            />
            
            <el-tree
              ref="departmentTree"
              :data="departmentTreeData"
              :props="defaultProps"
              :expand-on-click-node="false"
              :filter-node-method="filterNode"
              node-key="id"
              highlight-current
              default-expand-all
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span class="department-actions">
                    <el-button link type="primary" @click.stop="handleEditDepartment(data)">
                      编辑
                    </el-button>
                    <el-button link type="danger" @click.stop="handleDeleteDepartment(data)">
                      删除
                    </el-button>
                  </span>
                </div>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card shadow="hover" class="department-detail-card">
          <template #header>
            <div class="card-header">
              <span>{{ currentDepartment ? '部门详情：' + currentDepartment.name : '部门详情' }}</span>
            </div>
          </template>
          
          <div v-if="currentDepartment" class="department-detail">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="部门名称">{{ currentDepartment.name }}</el-descriptions-item>
              <el-descriptions-item label="部门编码">{{ currentDepartment.code }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ currentDepartment.manager }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ currentDepartment.phone }}</el-descriptions-item>
              <el-descriptions-item label="上级部门">{{ currentDepartment.parentName || '无' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ currentDepartment.createTime }}</el-descriptions-item>
              <el-descriptions-item label="部门状态">
                <el-tag :type="currentDepartment.status === 1 ? 'success' : 'info'">
                  {{ currentDepartment.status === 1 ? '正常' : '停用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="排序号">{{ currentDepartment.orderNum }}</el-descriptions-item>
            </el-descriptions>
            
            <div class="department-description">
              <h4>部门职责：</h4>
              <p>{{ currentDepartment.description || '暂无描述' }}</p>
            </div>
            
            <div class="department-members">
              <h4>部门成员：</h4>
              <el-table :data="departmentMembers" style="width: 100%" border size="small">
                <el-table-column prop="empNo" label="工号" width="100" />
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="position" label="职位" width="120" />
                <el-table-column prop="phone" label="联系电话" width="130" />
                <el-table-column prop="email" label="邮箱" width="180" />
                <el-table-column prop="entryDate" label="入职日期" width="100" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'info'">
                      {{ row.status === 1 ? '在职' : '离职' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <div v-else class="no-department-selected">
            <el-empty description="请选择部门查看详情" />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 部门表单对话框 -->
    <el-dialog
      v-model="departmentDialogVisible"
      :title="departmentForm.id ? '编辑部门' : '新增部门'"
      width="500px"
      append-to-body
    >
      <el-form
        ref="departmentFormRef"
        :model="departmentForm"
        :rules="departmentRules"
        label-width="100px"
      >
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="departmentForm.parentId"
            :data="departmentOptions"
            :props="{ label: 'name', children: 'children', value: 'id' }"
            placeholder="请选择上级部门"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="departmentForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="departmentForm.code" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="负责人" prop="manager">
          <el-input v-model="departmentForm.manager" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="departmentForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="排序号" prop="orderNum">
          <el-input-number v-model="departmentForm.orderNum" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="部门状态" prop="status">
          <el-radio-group v-model="departmentForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="部门职责" prop="description">
          <el-input v-model="departmentForm.description" type="textarea" rows="3" placeholder="请输入部门职责描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="departmentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDepartmentForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// 树形数据
const filterText = ref('');
const departmentTree = ref();
const defaultProps = {
  children: 'children',
  label: 'name',
};

// 过滤节点
watch(filterText, (val) => {
  departmentTree.value?.filter(val);
});

const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.name.indexOf(value) !== -1;
};

// 部门数据
const departmentTreeData = ref([]);
const currentDepartment = ref(null);
const departmentMembers = ref([]);
const departmentOptions = ref([]);

// 部门表单
const departmentDialogVisible = ref(false);
const departmentFormRef = ref();
const departmentForm = reactive({
  id: undefined,
  parentId: undefined,
  name: '',
  code: '',
  manager: '',
  phone: '',
  orderNum: 0,
  status: 1,
  description: ''
});

// 表单验证规则
const departmentRules = {
  name: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '部门编码不能为空', trigger: 'blur' }],
  orderNum: [{ required: true, message: '排序号不能为空', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  getDepartmentTree();
});

// 获取部门树
const getDepartmentTree = () => {
  // 模拟API请求
  setTimeout(() => {
    departmentTreeData.value = [
      {
        id: 1,
        name: '总公司',
        code: 'HQ',
        manager: '张总',
        phone: '13988888888',
        parentId: 0,
        parentName: '',
        orderNum: 1,
        status: 1,
        createTime: '2023-01-01',
        description: '公司总部，负责公司整体战略规划和管理',
        children: [
          {
            id: 2,
            name: '研发中心',
            code: 'RD',
            manager: '李主管',
            phone: '13900001111',
            parentId: 1,
            parentName: '总公司',
            orderNum: 1,
            status: 1,
            createTime: '2023-01-02',
            description: '负责公司产品研发和技术创新',
            children: [
              {
                id: 6,
                name: '前端组',
                code: 'RD-FE',
                manager: '王工',
                phone: '13900004444',
                parentId: 2,
                parentName: '研发中心',
                orderNum: 1,
                status: 1,
                createTime: '2023-01-05',
                description: '负责前端界面开发和用户体验优化'
              },
              {
                id: 7,
                name: '后端组',
                code: 'RD-BE',
                manager: '赵工',
                phone: '13900005555',
                parentId: 2,
                parentName: '研发中心',
                orderNum: 2,
                status: 1,
                createTime: '2023-01-05',
                description: '负责后端服务开发和数据处理'
              }
            ]
          },
          {
            id: 3,
            name: '市场部',
            code: 'MKT',
            manager: '陈主管',
            phone: '13900002222',
            parentId: 1,
            parentName: '总公司',
            orderNum: 2,
            status: 1,
            createTime: '2023-01-03',
            description: '负责公司市场推广和品牌建设'
          },
          {
            id: 4,
            name: '销售部',
            code: 'SALES',
            manager: '钱主管',
            phone: '13900003333',
            parentId: 1,
            parentName: '总公司',
            orderNum: 3,
            status: 1,
            createTime: '2023-01-04',
            description: '负责公司产品销售和客户关系维护'
          },
          {
            id: 5,
            name: '财务部',
            code: 'FIN',
            manager: '孙主管',
            phone: '13900006666',
            parentId: 1,
            parentName: '总公司',
            orderNum: 4,
            status: 1,
            createTime: '2023-01-05',
            description: '负责公司财务管理和资金运作'
          }
        ]
      }
    ];
    departmentOptions.value = [...departmentTreeData.value];
  }, 300);
};

// 点击部门节点
const handleNodeClick = (data: any) => {
  currentDepartment.value = data;
  getDepartmentMembers(data.id);
};

// 获取部门成员
const getDepartmentMembers = (departmentId: number) => {
  // 模拟API请求
  setTimeout(() => {
    if (departmentId === 6) { // 前端组
      departmentMembers.value = [
        {
          empNo: 'EMP008',
          name: '王工',
          position: '前端组长',
          phone: '13900004444',
          email: 'wang@example.com',
          entryDate: '2023-02-15',
          status: 1
        },
        {
          empNo: 'EMP009',
          name: '小李',
          position: '高级前端工程师',
          phone: '13911112222',
          email: 'xiaoli@example.com',
          entryDate: '2023-03-01',
          status: 1
        },
        {
          empNo: 'EMP010',
          name: '小张',
          position: '前端工程师',
          phone: '13922223333',
          email: 'xiaozhang@example.com',
          entryDate: '2023-04-05',
          status: 1
        }
      ];
    } else if (departmentId === 7) { // 后端组
      departmentMembers.value = [
        {
          empNo: 'EMP011',
          name: '赵工',
          position: '后端组长',
          phone: '13900005555',
          email: 'zhao@example.com',
          entryDate: '2023-02-10',
          status: 1
        },
        {
          empNo: 'EMP012',
          name: '小刘',
          position: '高级后端工程师',
          phone: '13933334444',
          email: 'xiaoliu@example.com',
          entryDate: '2023-03-15',
          status: 1
        },
        {
          empNo: 'EMP013',
          name: '小王',
          position: '后端工程师',
          phone: '13944445555',
          email: 'xiaowang@example.com',
          entryDate: '2023-04-20',
          status: 1
        },
        {
          empNo: 'EMP014',
          name: '小赵',
          position: '初级后端工程师',
          phone: '13955556666',
          email: 'xiaozhao@example.com',
          entryDate: '2023-06-01',
          status: 1
        }
      ];
    } else {
      // 其他部门没有成员或者没有详细数据
      departmentMembers.value = [];
    }
  }, 300);
};

// 刷新部门树
const refreshDepartmentTree = () => {
  getDepartmentTree();
  currentDepartment.value = null;
  departmentMembers.value = [];
};

// 新增部门
const handleAddDepartment = () => {
  resetDepartmentForm();
  departmentDialogVisible.value = true;
};

// 编辑部门
const handleEditDepartment = (data: any) => {
  resetDepartmentForm();
  Object.assign(departmentForm, data);
  departmentDialogVisible.value = true;
};

// 删除部门
const handleDeleteDepartment = (data: any) => {
  if (data.children && data.children.length > 0) {
    ElMessage.warning('该部门下存在子部门，无法删除');
    return;
  }
  
  ElMessageBox.confirm(`确认删除部门 ${data.name} 吗?`, '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('删除成功');
        refreshDepartmentTree();
      }, 300);
    })
    .catch(() => {
      // 取消删除操作
    });
};

// 重置表单
const resetDepartmentForm = () => {
  departmentForm.id = undefined;
  departmentForm.parentId = undefined;
  departmentForm.name = '';
  departmentForm.code = '';
  departmentForm.manager = '';
  departmentForm.phone = '';
  departmentForm.orderNum = 0;
  departmentForm.status = 1;
  departmentForm.description = '';
  
  nextTick(() => {
    departmentFormRef.value?.resetFields();
  });
};

// 提交部门表单
const submitDepartmentForm = () => {
  departmentFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success(departmentForm.id ? '修改成功' : '新增成功');
        departmentDialogVisible.value = false;
        refreshDepartmentTree();
      }, 300);
    }
  });
};
</script>

<style scoped>
.department-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.department-tree-card,
.department-detail-card {
  height: calc(100vh - 160px);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-input {
  margin-bottom: 15px;
}

.department-tree-container {
  height: calc(100% - 20px);
  overflow-y: auto;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.department-actions {
  display: none;
}

.custom-tree-node:hover .department-actions {
  display: inline-block;
}

.department-detail {
  height: calc(100% - 20px);
  overflow-y: auto;
}

.department-description {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.department-members {
  margin-top: 20px;
}

.no-department-selected {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
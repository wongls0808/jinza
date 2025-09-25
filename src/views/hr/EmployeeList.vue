<template>
  <div class="employee-list-container">
    <div class="page-header">
      <h2>员工管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddEmployee">
          <el-icon><Plus /></el-icon>新增员工
        </el-button>
        <el-button type="primary" plain @click="handleImport">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>导出
        </el-button>
      </div>
    </div>

    <el-card shadow="hover" class="filter-container">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="姓名">
          <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="queryParams.empNo" placeholder="请输入工号" clearable />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="queryParams.departmentId" placeholder="请选择部门" clearable>
            <el-option
              v-for="item in departmentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="在职" :value="1" />
            <el-option label="离职" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-container">
      <el-table
        v-loading="loading"
        :data="employeeList"
        style="width: 100%"
        border
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="empNo" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="employee-info">
              <el-avatar :size="30" :src="row.avatar || defaultAvatar">{{ row.name.charAt(0) }}</el-avatar>
              <span class="employee-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="60">
          <template #default="{ row }">
            {{ row.gender === 1 ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="departmentName" label="所属部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="entryDate" label="入职日期" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleViewDetails(row)">查看</el-button>
            <el-button link type="danger" @click="handleDelete(row)" v-if="row.status === 1">离职</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload, Download } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const employeeList = ref([]);
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 部门选项
const departmentOptions = ref([
  { label: '管理部', value: 1 },
  { label: '人事部', value: 2 },
  { label: '财务部', value: 3 },
  { label: '技术部', value: 4 },
  { label: '销售部', value: 5 },
  { label: '客服部', value: 6 }
]);

// 查询参数
const queryParams = reactive({
  name: '',
  empNo: '',
  departmentId: undefined,
  status: undefined,
  pageNum: 1,
  pageSize: 10
});

// 表格数据
onMounted(() => {
  getEmployeeList();
});

// 获取员工列表
const getEmployeeList = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    employeeList.value = [
      {
        id: 1,
        empNo: 'EMP001',
        name: '张三',
        gender: 1,
        phone: '13800138001',
        email: 'zhangsan@example.com',
        departmentId: 4,
        departmentName: '技术部',
        position: '高级工程师',
        entryDate: '2023-05-15',
        status: 1,
        avatar: ''
      },
      {
        id: 2,
        empNo: 'EMP002',
        name: '李四',
        gender: 1,
        phone: '13800138002',
        email: 'lisi@example.com',
        departmentId: 5,
        departmentName: '销售部',
        position: '销售经理',
        entryDate: '2023-06-20',
        status: 1,
        avatar: ''
      },
      {
        id: 3,
        empNo: 'EMP003',
        name: '王五',
        gender: 1,
        phone: '13800138003',
        email: 'wangwu@example.com',
        departmentId: 3,
        departmentName: '财务部',
        position: '财务主管',
        entryDate: '2023-04-10',
        status: 1,
        avatar: ''
      },
      {
        id: 4,
        empNo: 'EMP004',
        name: '赵六',
        gender: 1,
        phone: '13800138004',
        email: 'zhaoliu@example.com',
        departmentId: 2,
        departmentName: '人事部',
        position: 'HR专员',
        entryDate: '2023-07-05',
        status: 1,
        avatar: ''
      },
      {
        id: 5,
        empNo: 'EMP005',
        name: '钱七',
        gender: 2,
        phone: '13800138005',
        email: 'qianqi@example.com',
        departmentId: 6,
        departmentName: '客服部',
        position: '客服主管',
        entryDate: '2023-03-18',
        status: 0,
        avatar: ''
      }
    ];
    total.value = 5;
    loading.value = false;
  }, 500);
};

// 查询
const handleQuery = () => {
  queryParams.pageNum = 1;
  getEmployeeList();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.empNo = '';
  queryParams.departmentId = undefined;
  queryParams.status = undefined;
  handleQuery();
};

// 分页事件处理
const handleSizeChange = (size: number) => {
  queryParams.pageSize = size;
  getEmployeeList();
};

const handleCurrentChange = (page: number) => {
  queryParams.pageNum = page;
  getEmployeeList();
};

// 新增员工
const handleAddEmployee = () => {
  router.push('/dashboard/hr/employee/add');
};

// 编辑员工
const handleEdit = (row: any) => {
  router.push(`/dashboard/hr/employee/edit/${row.id}`);
};

// 查看员工详情
const handleViewDetails = (row: any) => {
  router.push(`/dashboard/hr/employee/detail/${row.id}`);
};

// 员工离职
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确认将员工"${row.name}"设置为离职状态?`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('操作成功');
        getEmployeeList();
      }, 300);
    })
    .catch(() => {
      // 取消操作
    });
};

// 导入员工
const handleImport = () => {
  // 实现导入逻辑
  ElMessage.info('导入功能开发中...');
};

// 导出员工
const handleExport = () => {
  // 实现导出逻辑
  ElMessage.info('导出功能开发中...');
};
</script>

<style scoped>
.employee-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.table-container {
  margin-bottom: 20px;
}

.employee-info {
  display: flex;
  align-items: center;
}

.employee-name {
  margin-left: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
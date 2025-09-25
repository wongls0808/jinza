<template>
  <div class="content-list">
    <h1 class="page-title">内容列表</h1>
    
    <div class="search-form">
      <el-form :inline="true" :model="searchForm" ref="searchFormRef">
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题关键词" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="table-operations">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>新增内容
      </el-button>
      <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>批量删除
      </el-button>
    </div>
    
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="author" label="作者" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';

// 搜索表单
const searchFormRef = ref<FormInstance>();
const searchForm = reactive({
  title: '',
  category: '',
  status: ''
});

// 表格数据
const loading = ref(false);
const tableData = ref<any[]>([]);
const selectedRows = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 分类选项
const categoryOptions = [
  { label: '新闻', value: '新闻' },
  { label: '公告', value: '公告' },
  { label: '活动', value: '活动' },
  { label: '教程', value: '教程' }
];

// 获取状态对应的Tag类型
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    published: 'success',
    draft: 'info',
    pending: 'warning'
  };
  return map[status] || 'info';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    pending: '待审核'
  };
  return map[status] || status;
};

// 处理表格选择项变化
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
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

// 新增内容
const handleAdd = () => {
  ElMessage.info('新增内容功能待实现');
};

// 编辑内容
const handleEdit = (row: any) => {
  ElMessage.info(`编辑内容：${row.title}`);
};

// 预览内容
const handlePreview = (row: any) => {
  ElMessage.info(`预览内容：${row.title}`);
};

// 删除内容
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除内容"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 执行删除操作
    ElMessage.success('删除成功');
    fetchData();
  }).catch(() => {
    // 取消操作
  });
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项');
    return;
  }
  
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 项内容吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 执行批量删除操作
    ElMessage.success('批量删除成功');
    fetchData();
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
    const mockData = Array.from({ length: 50 }).map((_, index) => {
      const id = index + 1;
      const statusOptions = ['published', 'draft', 'pending'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const categoryList = ['新闻', '公告', '活动', '教程'];
      const category = categoryList[Math.floor(Math.random() * categoryList.length)];
      
      return {
        id,
        title: `内容标题 ${id}`,
        category,
        author: `作者 ${id % 5 + 1}`,
        createTime: `2025-09-${Math.floor(Math.random() * 30) + 1}`,
        status
      };
    });
    
    // 筛选数据
    let filteredData = [...mockData];
    if (searchForm.title) {
      filteredData = filteredData.filter(item => 
        item.title.toLowerCase().includes(searchForm.title.toLowerCase())
      );
    }
    if (searchForm.category) {
      filteredData = filteredData.filter(item => 
        item.category === searchForm.category
      );
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => 
        item.status === searchForm.status
      );
    }
    
    // 设置总数
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
.content-list {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
  padding: 18px 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
}

.table-operations {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
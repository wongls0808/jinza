<template>
  <div class="projects">
    <div class="header">
      <h2>项目管理</h2>
      <el-button type="primary">新增项目</el-button>
    </div>
    <el-table :data="projects" style="width: 100%">
      <el-table-column prop="name" label="项目名称" />
      <el-table-column prop="customer_name" label="客户" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const projects = ref([]);

onMounted(async () => {
  await loadProjects();
});

const loadProjects = async () => {
  try {
    const response = await fetch('/api/projects');
    if (response.ok) {
      projects.value = await response.json();
    }
  } catch (error) {
    console.error('加载项目失败:', error);
  }
};

const getStatusType = (status) => {
  const types = {
    planning: 'info',
    active: 'success',
    completed: '',
    cancelled: 'danger'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    planning: '规划中',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return texts[status] || status;
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
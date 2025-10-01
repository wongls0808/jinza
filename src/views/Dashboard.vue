<template>
  <div class="dashboard">
    <h2>工作台</h2>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>客户数量</span>
          </template>
          <div class="number">{{ stats.customers }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>项目数量</span>
          </template>
          <div class="number">{{ stats.projects }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>进行中项目</span>
          </template>
          <div class="number">{{ stats.activeProjects }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>用户数量</span>
          </template>
          <div class="number">{{ stats.users }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const stats = ref({
  customers: 0,
  projects: 0,
  activeProjects: 0,
  users: 0
});

onMounted(async () => {
  // 模拟加载数据
  setTimeout(() => {
    stats.value = {
      customers: 15,
      projects: 8,
      activeProjects: 3,
      users: 6
    };
  }, 500);
});
</script>

<style scoped>
.number {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: #409EFF;
}
</style>
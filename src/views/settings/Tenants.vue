<template>
  <div class="settings-tenants">
    <h3>账套配置</h3>
    <el-card>
      <el-button type="primary" @click="addTenant">新增账套</el-button>
      <el-table :data="tenants" style="width:100%; margin-top:12px;">
        <el-table-column prop="name" label="账套名称" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="text" @click="editTenant(row)">编辑</el-button>
            <el-button type="text" @click="removeTenant(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="添加/编辑账套" :visible.sync="editDialogVisible">
      <el-form :model="editModel">
        <el-form-item label="账套名称">
          <el-input v-model="editModel.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTenant">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Tenant { id: string; name: string }

const tenants = ref<Tenant[]>([
  { id: 't1', name: '账套 A' },
  { id: 't2', name: '账套 B' }
]);

const editDialogVisible = ref(false);
const editModel = ref<Tenant>({ id: '', name: '' });

const addTenant = () => {
  editModel.value = { id: `t${Date.now()}`, name: '' };
  editDialogVisible.value = true;
};

const editTenant = (row: Tenant) => {
  editModel.value = { ...row };
  editDialogVisible.value = true;
};

const saveTenant = () => {
  if (!editModel.value.name) return;
  const idx = tenants.value.findIndex(t => t.id === editModel.value.id);
  if (idx >= 0) {
    tenants.value[idx] = { ...editModel.value };
  } else {
    tenants.value.push({ ...editModel.value });
  }
  editDialogVisible.value = false;
};

const removeTenant = (row: Tenant) => {
  tenants.value = tenants.value.filter(t => t.id !== row.id);
};
</script>

<style scoped>
.settings-tenants { padding: 12px; }
</style>

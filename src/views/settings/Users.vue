<template>
  <div class="settings-users">
    <h3>用户管理</h3>
    <el-card>
      <div style="margin-bottom: 12px; display:flex; gap:12px; align-items:center;">
        <el-select v-model="selectedTenant" placeholder="选择账套" style="width:240px;">
          <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-button type="primary" @click="refresh">刷新</el-button>
      </div>

      <el-table :data="users" style="width:100%">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="text" @click="openPermissions(row)">权限分配</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="为用户分配权限" :visible.sync="permDialogVisible" width="520px">
      <div v-if="selectedUser">
        <p>给 <strong>{{ selectedUser.username }}</strong> 分配在账套 <strong>{{ tenantName(selectedTenant) }}</strong> 的权限：</p>
        <el-checkbox-group v-model="assignedPerms">
          <el-checkbox v-for="p in availablePerms" :key="p.value" :label="p.value">{{ p.label }}</el-checkbox>
        </el-checkbox-group>
      </div>

      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface User {
  id: string;
  username: string;
  nickname?: string;
}

// 模拟账套与用户数据
const tenants = ref([
  { id: 't1', name: '账套 A' },
  { id: 't2', name: '账套 B' }
]);

const users = ref<User[]>([
  { id: 'u1', username: 'alice', nickname: 'Alice' },
  { id: 'u2', username: 'bob', nickname: 'Bob' },
  { id: 'u3', username: 'carol', nickname: 'Carol' }
]);

const selectedTenant = ref<string | null>(tenants.value?.[0]?.id ?? null);

// 可选权限项（示例）
const availablePerms = ref([
  { value: 'read', label: '只读' },
  { value: 'write', label: '写入' },
  { value: 'admin', label: '管理员' }
]);

// 权限分配数据结构（本地模拟： tenantId -> { userId -> perms[] } ）
const tenantPermissions = ref<Record<string, Record<string, string[]>>>({
  t1: { u1: ['read'], u2: ['read','write'] },
  t2: { u3: ['admin'] }
});

const permDialogVisible = ref(false);
const selectedUser = ref<User | null>(null);
const assignedPerms = ref<string[]>([]);

const openPermissions = (user: User) => {
  if (!selectedTenant.value) return;
  selectedUser.value = user;
  const perms = tenantPermissions.value[selectedTenant.value]?.[user.id] || [];
  assignedPerms.value = [...perms];
  permDialogVisible.value = true;
};

const savePermissions = () => {
  if (!selectedTenant.value || !selectedUser.value) return;
  if (!tenantPermissions.value[selectedTenant.value]) tenantPermissions.value[selectedTenant.value] = {};
  const userMap = tenantPermissions.value[selectedTenant.value] as Record<string, string[]>;
  userMap[selectedUser.value.id] = [...assignedPerms.value];
  permDialogVisible.value = false;
};

const refresh = () => {
  // 模拟刷新
};

const tenantName = (id: string | null) => tenants.value.find(t => t.id === id)?.name || '';
</script>

<style scoped>
.settings-users { padding: 12px; }
</style>

<template>
  <div class="users">
    <div class="header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showAddDialog = true">新增用户</el-button>
    </div>

    <div v-if="loading" class="loading-tip">加载中...</div>
    <div v-else>
      <div v-if="!users.length" class="empty-state">
        <div class="empty-text">暂无用户数据</div>
        <el-button type="primary" link @click="showAddDialog = true">+ 新增用户</el-button>
      </div>
      <div v-else class="card-grid">
  <div class="user-card data-card" v-for="u in users" :key="u.id">
          <div class="card-top">
            <div class="avatar" :class="u.role">
              {{ (u.name || u.username || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="meta">
              <div class="name-row">
                <span class="name" :title="u.name || u.username">{{ u.name || u.username }}</span>
                <el-tag size="small" :type="u.role === 'admin' ? 'danger' : 'success'">
                  {{ u.role === 'admin' ? '管理员' : '用户' }}
                </el-tag>
              </div>
              <div class="sub-line" :title="u.username">@{{ u.username }}</div>
              <div class="dept" v-if="u.department" :title="u.department">部门：{{ u.department }}</div>
              <div class="dept dept-empty" v-else>无部门</div>
            </div>
            <div class="actions">
              <el-dropdown trigger="click" @command="cmd => handleCardCommand(cmd, u)">
                <span class="dropdown-trigger">
                  <el-icon><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" disabled>编辑(待实现)</el-dropdown-item>
                    <el-dropdown-item command="reset" disabled>重置密码(待实现)</el-dropdown-item>
                    <el-dropdown-item divided command="delete" disabled>删除(待实现)</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="card-footer">
            <span class="footer-text">角色：{{ u.role === 'admin' ? '管理员' : '普通用户' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="showAddDialog" title="新增用户">
      <el-form :model="newUser">
        <el-form-item label="用户名">
          <el-input v-model="newUser.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="newUser.password" type="password" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="newUser.name" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newUser.role">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="newUser.department" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addUser" :loading="creating">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MoreFilled } from '@element-plus/icons-vue';
import '@/styles/cards.css';
import { userApi } from '@/utils/api';

const users = ref([]);
const showAddDialog = ref(false);
const newUser = ref({
  username: '',
  password: '',
  name: '',
  role: 'user',
  department: ''
});
const loading = ref(false);
const creating = ref(false);

onMounted(async () => {
  await loadUsers();
});

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await userApi.list();
  } catch (err) {
    console.error('加载用户失败:', err);
    ElMessage.error('加载用户失败');
  } finally {
    loading.value = false;
  }
};

const addUser = async () => {
  if (!newUser.value.username || !newUser.value.password || !newUser.value.name) {
    ElMessage.warning('请填写必填字段');
    return;
  }
  creating.value = true;
  try {
    await userApi.create(newUser.value);
    ElMessage.success('创建成功');
    showAddDialog.value = false;
    newUser.value = { username: '', password: '', name: '', role: 'user', department: '' };
    await loadUsers();
  } catch (err) {
    console.error('添加用户失败:', err);
    const apiMsg = err?.data?.error || '添加用户失败';
    ElMessage.error(apiMsg);
  } finally {
    creating.value = false;
  }
};

// 卡片下拉命令（当前占位）
const handleCardCommand = (cmd, row) => {
  if (['edit','reset','delete'].includes(cmd)) {
    ElMessage.info('该功能尚未实现');
  }
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.loading-tip {
  color: #909399;
  font-size: 14px;
  padding: 12px 0;
}

.empty-state {
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  padding: 40px 20px;
  text-align: center;
  border-radius: 8px;
  color: #909399;
}
.empty-text { margin-bottom: 8px; }




.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  font-size: 18px;
  background: linear-gradient(135deg,#409eff,#337ecc);
  flex-shrink: 0;
}
.avatar.admin { background: linear-gradient(135deg,#f56c6c,#dd6161); }

.meta { flex: 1; min-width: 0; }
.name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.name { font-weight: 600; font-size: 15px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sub-line { font-size: 12px; color: #909399; margin-bottom: 4px; max-width: 160px; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
.dept { font-size: 12px; color: #606266; }
.dept-empty { color: #c0c4cc; font-style: italic; }


.footer-text { user-select: none; }

@media (max-width: 600px) {
  .name { max-width: 100px; }
  .sub-line { max-width: 120px; }
}
</style>
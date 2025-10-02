<template>
  <div class="users">
    <div class="header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="openAddDialog">新增用户</el-button>
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
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="toggle">{{ u.is_active ? '禁用' : '启用' }}</el-dropdown-item>
                    <el-dropdown-item command="reset">重置密码</el-dropdown-item>
                    <el-dropdown-item divided command="delete" disabled>删除(暂未开放)</el-dropdown-item>
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
    <el-dialog v-model="showAddDialog" :title="editMode ? '编辑用户' : '新增用户'" width="520px" @close="resetDialog">
      <el-form :model="form" label-width="90px" :disabled="saving">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="用户名" required>
              <el-input v-model="form.username" :disabled="editMode" placeholder="登录账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" placeholder="真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!editMode">
            <el-form-item label="初始密码" required>
              <el-input v-model="form.password" type="password" placeholder="至少8位" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" required>
              <el-select v-model="form.role" style="width:100%">
                <el-option label="普通用户" value="user" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="部门">
              <el-input v-model="form.department" placeholder="所属部门" />
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="editMode">
            <el-form-item label="状态">
              <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert type="info" show-icon class="pw-tip" v-if="!editMode" :closable="false" title="弱密码（短、顺子、重复、常见词）登录后将被强制修改。" />
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="saving">{{ editMode ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { MoreFilled } from '@element-plus/icons-vue';
import '@/styles/cards.css';
import { userApi } from '@/utils/api';

const users = ref([]);
const showAddDialog = ref(false);
const editMode = ref(false);
const form = ref({ id:null, username:'', password:'', name:'', role:'user', department:'', is_active:1 });
const loading = ref(false);
const saving = ref(false);

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

function openAddDialog(){
  editMode.value = false;
  form.value = { id:null, username:'', password:'', name:'', role:'user', department:'', is_active:1 };
  showAddDialog.value = true;
}
function openEdit(row){
  editMode.value = true;
  form.value = { id:row.id, username:row.username, password:'', name:row.name, role:row.role, department:row.department||'', is_active: !!row.is_active };
  showAddDialog.value = true;
}
async function submitForm(){
  if (!form.value.username || !form.value.name || (!editMode.value && !form.value.password)) {
    ElMessage.warning('请完整填写必填项');
    return;
  }
  saving.value = true;
  try {
    if (editMode.value) {
      await userApi.update(form.value.id, { name: form.value.name, role: form.value.role, department: form.value.department, is_active: form.value.is_active ? 1 : 0 });
      ElMessage.success('已保存');
    } else {
      await userApi.create({ username: form.value.username, password: form.value.password, name: form.value.name, role: form.value.role, department: form.value.department });
      ElMessage.success('创建成功');
    }
    showAddDialog.value = false;
    await loadUsers();
  } catch(e){
    ElMessage.error(e?.data?.error || '操作失败');
  } finally { saving.value = false; }
}
function resetDialog(){ if (!saving.value) editMode.value=false; }

async function toggleActive(row){
  try {
    await userApi.update(row.id, { name: row.name, role: row.role, department: row.department, is_active: row.is_active?0:1 });
    ElMessage.success(row.is_active? '已禁用':'已启用');
    await loadUsers();
  } catch(e){ ElMessage.error('操作失败'); }
}
async function resetPassword(row){
  try {
    const { value } = await ElMessageBox.prompt('可输入自定义新密码（留空则自动生成安全随机密码）', '重置密码', { inputPlaceholder:'留空自动生成', confirmButtonText:'确定', cancelButtonText:'取消', inputPattern: /.*/, inputErrorMessage:'' });
    const body = value ? { newPassword: value.trim() } : undefined;
    const resp = await userApi.resetPassword(row.id, body?.newPassword);
    ElMessage.success('已重置，临时密码：' + resp.tempPassword);
  } catch(err){ if (err !== 'cancel') ElMessage.error(err?.data?.error || '重置失败'); }
}
const handleCardCommand = (cmd, row) => {
  if (cmd==='edit') return openEdit(row);
  if (cmd==='toggle') return toggleActive(row);
  if (cmd==='reset') return resetPassword(row);
  if (cmd==='delete') return ElMessage.info('删除功能暂未开放');
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
.pw-tip { margin-top: 4px; }




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
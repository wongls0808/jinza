<template>
  <div class="customers">
    <div class="header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="showAddDialog = true">新增客户</el-button>
    </div>

    <div v-if="loading" class="loading-tip">加载中...</div>
    <div v-else>
      <div v-if="!customers.length" class="empty-state">
        <div class="empty-text">暂无客户数据</div>
        <el-button type="primary" link @click="showAddDialog = true">+ 新增客户</el-button>
      </div>
      <div v-else class="card-grid">
  <div class="customer-card data-card" v-for="c in customers" :key="c.id">
          <div class="card-top">
            <div class="logo-circle">{{ (c.name || '?').charAt(0).toUpperCase() }}</div>
            <div class="meta">
              <div class="name-row">
                <span class="name" :title="c.name">{{ c.name }}</span>
                <el-tag size="small" :type="c.status === 'active' ? 'success' : 'info'">
                  {{ c.status === 'active' ? '活跃' : '停用' }}
                </el-tag>
              </div>
              <div class="line" v-if="c.contact" :title="c.contact">联系人：{{ c.contact }}</div>
              <div class="line" v-if="c.phone" :title="c.phone">电话：{{ c.phone }}</div>
              <div class="line email" v-if="c.email" :title="c.email">邮箱：{{ c.email }}</div>
            </div>
            <div class="actions">
              <el-dropdown trigger="click" @command="cmd => handleCardCommand(cmd, c)">
                <span class="dropdown-trigger">
                  <el-icon><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" disabled>编辑(待实现)</el-dropdown-item>
                    <el-dropdown-item command="toggle" disabled>{{ c.status === 'active' ? '停用' : '启用' }}(待实现)</el-dropdown-item>
                    <el-dropdown-item divided command="delete" disabled>删除(待实现)</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="card-footer">
            <span class="footer-text">状态：{{ c.status === 'active' ? '活跃' : '停用' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增客户对话框 -->
    <el-dialog v-model="showAddDialog" title="新增客户">
      <el-form :model="newCustomer">
        <el-form-item label="客户名称">
          <el-input v-model="newCustomer.name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="newCustomer.contact" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="newCustomer.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="newCustomer.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addCustomer" :loading="creating">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { MoreFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import '@/styles/cards.css';

const customers = ref([]);
const showAddDialog = ref(false);
const loading = ref(false);
const creating = ref(false);
const newCustomer = ref({
  name: '',
  contact: '',
  phone: '',
  email: ''
});

onMounted(async () => {
  await loadCustomers();
});

const loadCustomers = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/customers');
    if (response.ok) {
      customers.value = await response.json();
    }
  } catch (error) {
    console.error('加载客户失败:', error);
  } finally {
    loading.value = false;
  }
};

const addCustomer = async () => {
  if (!newCustomer.value.name) {
    ElMessage.warning('请输入客户名称');
    return;
  }
  creating.value = true;
  try {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer.value)
    });
    if (response.ok) {
      showAddDialog.value = false;
      newCustomer.value = { name: '', contact: '', phone: '', email: '' };
      await loadCustomers();
      ElMessage.success('创建成功');
    }
  } catch (error) {
    console.error('添加客户失败:', error);
    ElMessage.error('添加客户失败');
  } finally {
    creating.value = false;
  }
};

const handleCardCommand = (cmd, row) => {
  if (['edit','toggle','delete'].includes(cmd)) {
    ElMessage.info('该功能尚未实现');
  }
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.loading-tip { color: #909399; font-size: 14px; padding: 12px 0; }
.empty-state { background: #fafafa; border: 1px dashed #dcdfe6; padding: 40px 20px; text-align: center; border-radius: 8px; color: #909399; }
.empty-text { margin-bottom: 8px; }

/* 特有样式 */
.logo-circle { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#67c23a,#529b2e); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 18px; flex-shrink: 0; }
.meta { flex: 1; min-width: 0; }
.name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.name { font-weight: 600; font-size: 15px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line { font-size: 12px; color: #606266; margin-bottom: 2px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.email { color: #409eff; }
.footer-text { user-select: none; }

@media (max-width: 600px) {
  .name { max-width: 110px; }
  .line { max-width: 140px; }
}
</style>
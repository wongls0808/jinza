<template>
  <div class="customers">
    <div class="header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="openCreate">新增客户</el-button>
    </div>

    <div v-if="loading" class="loading-tip">加载中...</div>
    <div v-else>
      <div v-if="!customers.length" class="empty-state">
        <div class="empty-text">暂无客户数据</div>
        <el-button type="primary" link @click="openCreate">+ 新增客户</el-button>
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
              <div class="line" v-if="c.registration_no" :title="c.registration_no">注册号：{{ c.registration_no }}</div>
              <div class="line" v-if="c.tax_no" :title="c.tax_no">税号：{{ c.tax_no }}</div>
              <div class="line" v-if="c.phone" :title="c.phone">联系电话：{{ c.phone }}</div>
              <div class="line email" v-if="c.email" :title="c.email">邮箱：{{ c.email }}</div>
              <div class="line" v-if="c.address" :title="c.address">地址：{{ c.address }}</div>
              <div class="tags-row" v-if="c.tags && c.tags.length">
                <el-tag
                  v-for="(t,i) in c.tags.slice(0,3)"
                  :key="t+i"
                  size="small"
                  class="tag-item dynamic-tag"
                  :style="tagStyle(t)"
                >{{ t }}</el-tag>
                <el-tag v-if="c.tags.length>3" size="small" effect="plain">+{{ c.tags.length-3 }}</el-tag>
              </div>
            </div>
            <div class="actions">
              <el-dropdown trigger="click" @command="cmd => handleCardCommand(cmd, c)">
                <span class="dropdown-trigger">
                  <el-icon><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="toggle">{{ c.status === 'active' ? '停用' : '启用' }}</el-dropdown-item>
                    <el-dropdown-item divided command="delete">删除</el-dropdown-item>
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

    <!-- 新增 / 编辑 客户对话框 -->
    <el-dialog :title="isEdit ? '编辑客户' : '新增客户'" v-model="showAddDialog" width="640px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px" status-icon>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="form.name" placeholder="必填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册号" prop="registration_no">
              <el-input v-model="form.registration_no" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税号" prop="tax_no">
              <el-input v-model="form.tax_no" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" v-if="isEdit">
              <el-select v-model="form.status">
                <el-option label="活跃" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标签">
              <div class="tag-editor">
                <div class="tags">
                  <el-tag
                    v-for="(tag, index) in form.tags"
                    :key="tag+index"
                    closable
                    size="small"
                    class="dynamic-tag"
                    :style="tagStyle(tag)"
                    @close="removeTag(index)"
                  >{{ tag }}</el-tag>
                  <el-input
                    v-if="inputVisible"
                    ref="tagInputRef"
                    v-model="tagInput"
                    size="small"
                    class="tag-input"
                    @keyup.enter.prevent="confirmTag"
                    @blur="confirmTag"
                    :maxlength="20"
                    placeholder="回车添加"
                  />
                  <el-button
                    v-else
                    size="small"
                    type="primary"
                    text
                    @click="showTagInput"
                    :disabled="form.tags.length >= maxTags"
                  >+ 标签</el-button>
                </div>
                <div class="tag-hint">最多 {{ maxTags }} 个；单个≤20字符</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitForm">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue';
import { MoreFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import '@/styles/cards.css';

const customers = ref([]);
const showAddDialog = ref(false);
const loading = ref(false);
const creating = ref(false);
const isEdit = ref(false);
const editingId = ref(null);
const formRef = ref();
const form = reactive({
  name: '',
  registration_no: '',
  tax_no: '',
  phone: '',
  email: '',
  address: '',
  status: 'active',
  tags: []
});
const maxTags = 10;
const tagInputRef = ref();
const inputVisible = ref(false);
const tagInput = ref('');
const rules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
};

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

const resetForm = () => {
  form.name = '';
  form.registration_no = '';
  form.tax_no = '';
  form.phone = '';
  form.email = '';
  form.address = '';
  form.status = 'active';
  form.tags = [];
};

const openCreate = () => {
  resetForm();
  isEdit.value = false;
  editingId.value = null;
  showAddDialog.value = true;
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    creating.value = true;
    try {
      if (isEdit.value) {
        const resp = await fetch(`/api/customers/${editingId.value}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (!resp.ok) throw new Error('更新失败');
        ElMessage.success('已保存');
      } else {
        const resp = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form })
        });
        if (!resp.ok) throw new Error('创建失败');
        ElMessage.success('创建成功');
        // 创建成功后重置表单，确保下次打开时是空白的
        resetForm();
      }
      showAddDialog.value = false;
      await loadCustomers();
    } catch (e) {
      ElMessage.error(e.message || '操作失败');
    } finally {
      creating.value = false;
    }
  });
};

const handleEdit = (row) => {
  isEdit.value = true;
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name || '',
    registration_no: row.registration_no || '',
    tax_no: row.tax_no || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    status: row.status || 'active'
  });
  // 解析标签
  try {
    if (Array.isArray(row.tags)) form.tags = [...row.tags];
    else if (row.note) {
      const parsed = JSON.parse(row.note);
      if (Array.isArray(parsed)) form.tags = parsed;
    }
  } catch {}
  showAddDialog.value = true;
};

const handleToggle = async (row) => {
  const target = row.status === 'active' ? 'inactive' : 'active';
  try {
    const resp = await fetch(`/api/customers/${row.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: target })
    });
    if (!resp.ok) throw new Error('状态更新失败');
    ElMessage.success(target === 'active' ? '已启用' : '已停用');
    await loadCustomers();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  }
};

const handleDelete = async (row) => {
  if (!confirm(`确定删除客户【${row.name}】? 此操作不可恢复。`)) return;
  try {
    const resp = await fetch(`/api/customers/${row.id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('删除失败');
    ElMessage.success('删除成功');
    await loadCustomers();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  }
};

const handleCardCommand = (cmd, row) => {
  if (cmd === 'edit') return handleEdit(row);
  if (cmd === 'toggle') return handleToggle(row);
  if (cmd === 'delete') return handleDelete(row);
};

// 标签逻辑
const showTagInput = () => {
  inputVisible.value = true;
  nextTick(() => tagInputRef.value?.focus());
};
const confirmTag = () => {
  const val = tagInput.value.trim();
  if (val && !form.tags.includes(val) && form.tags.length < maxTags) {
    form.tags.push(val);
  }
  tagInput.value = '';
  inputVisible.value = false;
};
const removeTag = (i) => {
  form.tags.splice(i,1);
};

// 标签配色：FNV-1a 哈希生成色相，固定饱和度与亮度，根据亮度选择文字颜色
function hashHue(str){
  let h = 2166136261;
  for (let i=0;i<str.length;i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 360;
}
function tagStyle(tag){
  const hue = hashHue(tag);
  const saturation = 55; // %
  const light = 50; // %
  const textColor = light > 55 ? '#303133' : '#ffffff';
  return {
    background: `hsl(${hue} ${saturation}% ${light}%)`,
    color: textColor,
    border: 'none'
  };
}
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.loading-tip { color: #909399; font-size: 14px; padding: 12px 0; }
.empty-state { background: #fafafa; border: 1px dashed #dcdfe6; padding: 40px 20px; text-align: center; border-radius: 8px; color: #909399; cursor: default; }
.empty-text { margin-bottom: 8px; }

/* 特有样式 */
.logo-circle { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#67c23a,#529b2e); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 18px; flex-shrink: 0; }
.meta { flex: 1; min-width: 0; }
.name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.name { font-weight: 600; font-size: 15px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line { font-size: 12px; color: #606266; margin-bottom: 2px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.email { color: #409eff; }
.footer-text { user-select: none; }

.tags-row { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
.tag-item { margin-bottom: 2px; }
.tag-editor { display: flex; flex-direction: column; gap: 4px; }
.tag-editor .tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-input { width: 110px; }
.tag-hint { font-size: 12px; color: #909399; }

@media (max-width: 600px) {
  .name { max-width: 110px; }
  .line { max-width: 140px; }
}
</style>
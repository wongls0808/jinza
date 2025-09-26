<template>
  <div class="settings-tenants">
    <h3>账套配置</h3>

    <div class="ops-area" style="margin-bottom:12px; display:flex; gap:8px;">
      <el-button type="primary" @click="addTenant">新增账套</el-button>
      <el-button @click="goHome">返回导航页</el-button>
    </div>

    <el-card>
      <div class="list-area">
        <el-table :data="tenants" style="width:100%;">
          <el-table-column prop="name" label="账套名称" />
          <el-table-column prop="code" label="账套代码" />
          <el-table-column prop="registerNo" label="注册号" />
          <el-table-column prop="taxNo" label="税号" />
          <el-table-column prop="phone" label="联系电话" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="address" label="地址" />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button type="text" @click="editTenant(row)">编辑</el-button>
              <el-button type="text" @click="removeTenant(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog title="添加/编辑账套" :visible.sync="editDialogVisible" width="720px">
      <el-form :model="editModel" label-width="110px" :rules="rules" ref="tenantFormRef">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="账套名称" prop="name">
              <el-input v-model="editModel.name" />
            </el-form-item>
            <el-form-item label="账套代码" prop="code">
              <el-input v-model="editModel.code" />
            </el-form-item>
            <el-form-item label="注册号" prop="registerNo">
              <el-input v-model="editModel.registerNo" />
            </el-form-item>
            <el-form-item label="税号" prop="taxNo">
              <el-input v-model="editModel.taxNo" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="editModel.phone" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="editModel.email" />
            </el-form-item>
            <el-form-item label="地址" prop="address">
              <el-input v-model="editModel.address" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Logo (PNG)" prop="logo">
              <input type="file" accept="image/png" @change="onFileChange($event, 'logo')" />
              <div v-if="editModel.logoData" style="margin-top:8px;">
                <img :src="editModel.logoData" alt="logo" style="max-width:120px; max-height:120px; border:1px solid #eee;" />
              </div>
            </el-form-item>

            <el-form-item label="公章 (PNG)" prop="seal">
              <input type="file" accept="image/png" @change="onFileChange($event, 'seal')" />
              <div v-if="editModel.sealData" style="margin-top:8px;">
                <img :src="editModel.sealData" alt="seal" style="max-width:120px; max-height:120px; border:1px solid #eee;" />
              </div>
            </el-form-item>

            <el-form-item label="签字 (PNG)" prop="signature">
              <input type="file" accept="image/png" @change="onFileChange($event, 'signature')" />
              <div v-if="editModel.signatureData" style="margin-top:8px;">
                <img :src="editModel.signatureData" alt="signature" style="max-width:120px; max-height:120px; border:1px solid #eee;" />
              </div>
            </el-form-item>

            <el-divider />
            <el-form-item label="打印模板管理">
              <div>
                <el-button type="primary" size="mini" @click="openAddTemplate">新增模板</el-button>
                <el-table :data="editModel.templates" style="width:100%; margin-top:8px;" size="small">
                  <el-table-column prop="name" label="模板名称" />
                  <el-table-column prop="codeFormat" label="发票编码格式" />
                  <el-table-column label="操作">
                    <template #default="{ row }">
                      <el-button type="text" @click="editTemplate(row)">编辑</el-button>
                      <el-button type="text" @click="removeTemplate(row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTenant">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板新增/编辑对话框 -->
    <el-dialog title="模板设置" :visible.sync="templateDialogVisible">
      <el-form :model="currentTemplate">
        <el-form-item label="模板名称">
          <el-input v-model="currentTemplate.name" />
        </el-form-item>
        <el-form-item label="发票编码格式">
          <el-input v-model="currentTemplate.codeFormat" placeholder="例如：INV-{YYYY}{MM}-{SEQ:4}" />
        </el-form-item>
        <el-form-item label="模板文件 (PNG)">
          <input type="file" accept="image/png" @change="onTemplateFileChange" />
          <div v-if="currentTemplate.fileData" style="margin-top:8px;">
            <img :src="currentTemplate.fileData" alt="tpl" style="max-width:160px; max-height:160px; border:1px solid #eee;" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { get, post, put, del } from '@/utils/request';
import { ElMessage } from 'element-plus';

interface TemplateItem {
  id: string;
  name: string;
  codeFormat?: string;
  fileData?: string | null; // dataURL
}

interface Tenant {
  id: string;
  name: string;
  code?: string;
  registerNo?: string;
  taxNo?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoData?: string | null;
  sealData?: string | null;
  signatureData?: string | null;
  templates?: TemplateItem[];
}

const router = useRouter();

const tenants = ref<Tenant[]>([]);

// Load tenants from backend on mount
const loadTenants = async () => {
  try {
    const res = await get<Tenant[]>('/tenants');
    tenants.value = Array.isArray(res) ? res : [];
  } catch (e) {
    console.error('加载账套失败', e);
    tenants.value = [];
  }
};

onMounted(() => {
  loadTenants();
});

const editDialogVisible = ref(false);
const editModel = ref<Tenant>({ id: '', name: '' });
const tenantFormRef = ref();

const templateDialogVisible = ref(false);
const currentTemplate = ref<TemplateItem>({ id: '', name: '', codeFormat: '', fileData: null });

const rules = {
  name: [{ required: true, message: '请输入账套名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账套代码', trigger: 'blur' }]
};

const addTenant = () => {
  editModel.value = { id: `t${Date.now()}`, name: '', templates: [] } as Tenant;
  editDialogVisible.value = true;
};

const editTenant = (row: Tenant) => {
  // deep copy to avoid direct mutation
  editModel.value = JSON.parse(JSON.stringify(row));
  editDialogVisible.value = true;
};

const submitTenant = async () => {
  // simple validation
  // @ts-ignore
  tenantFormRef.value?.validate?.(async (valid: boolean) => {
    if (!valid) return;
    try {
      const payload = { ...editModel.value };
      // If id exists on server, call PUT, otherwise POST
      const exists = tenants.value.find(t => t.id === editModel.value.id);
      if (exists) {
        await put(`/tenants/${editModel.value.id}`, payload);
        // refresh local list
        await loadTenants();
      } else {
        await post('/tenants', payload);
        await loadTenants();
      }
      editDialogVisible.value = false;
      ElMessage.success('保存成功');
    } catch (err: any) {
      console.error('保存账套失败', err);
      // If backend endpoint not implemented (404) or network error, fallback to local save
      const status = err?.response?.status;
      if (status === 404 || err?.message?.includes('404') || err?.message?.includes('Not Found')) {
        // fallback: local persist (keep UX) and inform the user
        const idx = tenants.value.findIndex(t => t.id === editModel.value.id);
        if (idx >= 0) {
          tenants.value[idx] = { ...editModel.value } as Tenant;
        } else {
          tenants.value.push({ ...editModel.value } as Tenant);
        }
        editDialogVisible.value = false;
        ElMessage.warning('后端接口未实现，已在本地保存显示（请在后端实现 /tenants 接口以持久化数据）');
      } else {
        ElMessage.error('保存失败，请稍后重试');
      }
    }
  });
};

const removeTenant = async (row: Tenant) => {
  try {
    await del(`/tenants/${row.id}`);
    await loadTenants();
    ElMessage.success('删除成功');
  } catch (err: any) {
    console.error('删除账套失败', err);
    const status = err?.response?.status;
    if (status === 404 || err?.message?.includes('404') || err?.message?.includes('Not Found')) {
      // fallback local delete
      tenants.value = tenants.value.filter(t => t.id !== row.id);
      ElMessage.warning('后端接口未实现，已在本地删除（请在后端实现 /tenants 接口以持久化删除）');
    } else {
      ElMessage.error('删除失败，请稍后重试');
    }
  }
};

const onFileChange = (e: Event, field: 'logo' | 'seal' | 'signature') => {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.type !== 'image/png') {
    alert('仅支持 PNG 格式的图片');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result as string;
    if (field === 'logo') editModel.value.logoData = data;
    if (field === 'seal') editModel.value.sealData = data;
    if (field === 'signature') editModel.value.signatureData = data;
  };
  reader.readAsDataURL(file);
};

const goHome = () => {
  router.push('/');
};

// 模板管理
const openAddTemplate = () => {
  currentTemplate.value = { id: `tpl${Date.now()}`, name: '', codeFormat: '', fileData: null };
  templateDialogVisible.value = true;
};

const editTemplate = (tpl: TemplateItem) => {
  currentTemplate.value = JSON.parse(JSON.stringify(tpl));
  templateDialogVisible.value = true;
};

const removeTemplate = (tpl: TemplateItem) => {
  if (!editModel.value.templates) return;
  editModel.value.templates = editModel.value.templates.filter(t => t.id !== tpl.id);
};

const onTemplateFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.type !== 'image/png') {
    alert('模板文件仅支持 PNG 格式（当前实现）');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    currentTemplate.value.fileData = reader.result as string;
  };
  reader.readAsDataURL(file);
};

const saveTemplate = () => {
  if (!editModel.value.templates) editModel.value.templates = [];
  const idx = editModel.value.templates.findIndex(t => t.id === currentTemplate.value.id);
  if (idx >= 0) {
    editModel.value.templates[idx] = { ...currentTemplate.value } as TemplateItem;
  } else {
    editModel.value.templates.push({ ...currentTemplate.value } as TemplateItem);
  }
  templateDialogVisible.value = false;
};
</script>

<style scoped>
.settings-tenants { padding: 12px; }
.ops-area { display:flex; align-items:center }
.list-area { margin-top: 6px }
</style>

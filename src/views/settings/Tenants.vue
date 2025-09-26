<template>
  <div class="settings-tenants">
    <div class="tenant-header">
      <h2>账套配置</h2>
      <div class="ops-area">
        <el-button type="primary" @click="addTenant">新增账套</el-button>
        <el-button @click="goHome">返回导航页</el-button>
      </div>
    </div>

    <div class="tenant-cards">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in tenants" :key="item.id" class="tenant-card-col">
          <el-card shadow="hover" class="tenant-card">
            <div class="tenant-card-header">
              <h3>{{ item.name }}</h3>
              <p class="tenant-code">代码: {{ item.code }}</p>
            </div>
            <div class="tenant-card-body">
              <div class="tenant-info" v-if="item.registerNo"><label>注册号:</label> {{ item.registerNo }}</div>
              <div class="tenant-info" v-if="item.taxNo"><label>税号:</label> {{ item.taxNo }}</div>
              <div class="tenant-info" v-if="item.phone"><label>电话:</label> {{ item.phone }}</div>
              <div class="tenant-info" v-if="item.email"><label>邮箱:</label> {{ item.email }}</div>
              <div class="tenant-info" v-if="item.address"><label>地址:</label> {{ item.address }}</div>
            </div>
            <div class="tenant-logo" v-if="item.logoData">
              <img :src="item.logoData" alt="logo" />
            </div>
            <div class="tenant-card-footer">
              <el-button type="primary" size="small" @click="editTenant(item)">编辑</el-button>
              <el-button type="danger" size="small" @click="removeTenant(item)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="editDialogVisible" title="添加/编辑账套" width="720px">
      <el-form :model="editModel" label-width="110px" :rules="rules" ref="tenantFormRef">
        <el-tabs>
          <el-tab-pane label="基本信息">
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
              </el-col>
              <el-col :span="12">
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
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="图形素材">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="Logo (PNG)" prop="logo">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    accept="image/png"
                    :limit="1"
                    :show-file-list="false"
                    class="tenant-image-upload"
                    :on-change="(file: UploadFile) => handleFileUpload(file, 'logo')"
                  >
                    <div class="upload-area">
                      <div v-if="!editModel.logoData" class="upload-placeholder">
                        <el-icon class="upload-icon"><Plus /></el-icon>
                        <div class="upload-text">点击上传</div>
                      </div>
                      <img v-else :src="editModel.logoData" alt="logo" class="upload-preview" />
                    </div>
                  </el-upload>
                </el-form-item>
              </el-col>
              
              <el-col :span="8">
                <el-form-item label="公章 (PNG)" prop="seal">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    accept="image/png"
                    :limit="1"
                    :show-file-list="false"
                    class="tenant-image-upload"
                    :on-change="(file: UploadFile) => handleFileUpload(file, 'seal')"
                  >
                    <div class="upload-area">
                      <div v-if="!editModel.sealData" class="upload-placeholder">
                        <el-icon class="upload-icon"><Plus /></el-icon>
                        <div class="upload-text">点击上传</div>
                      </div>
                      <img v-else :src="editModel.sealData" alt="公章" class="upload-preview" />
                    </div>
                  </el-upload>
                </el-form-item>
              </el-col>
              
              <el-col :span="8">
                <el-form-item label="签字 (PNG)" prop="signature">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    accept="image/png"
                    :limit="1"
                    :show-file-list="false"
                    class="tenant-image-upload"
                    :on-change="(file: UploadFile) => handleFileUpload(file, 'signature')"
                  >
                    <div class="upload-area">
                      <div v-if="!editModel.signatureData" class="upload-placeholder">
                        <el-icon class="upload-icon"><Plus /></el-icon>
                        <div class="upload-text">点击上传</div>
                      </div>
                      <img v-else :src="editModel.signatureData" alt="签字" class="upload-preview" />
                    </div>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="打印模板">
            <el-form-item label="打印模板管理">
              <div>
                <el-button type="primary" @click="openAddTemplate">新增模板</el-button>
                <el-table :data="editModel.templates" style="width:100%; margin-top:16px;" size="small">
                  <el-table-column prop="name" label="模板名称" />
                  <el-table-column prop="codeFormat" label="发票编码格式" />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="primary" link @click="editTemplate(row)">编辑</el-button>
                      <el-button type="danger" link @click="removeTemplate(row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTenant">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板新增/编辑对话框 -->
    <el-dialog v-model="templateDialogVisible" title="模板设置" width="600px">
      <el-form :model="currentTemplate" label-width="120px">
        <el-form-item label="模板名称">
          <el-input v-model="currentTemplate.name" />
        </el-form-item>
        <el-form-item label="发票编码格式">
          <el-input v-model="currentTemplate.codeFormat" placeholder="例如：INV-{YYYY}{MM}-{SEQ:4}" />
          <div style="margin-top:12px; display:flex; gap:12px; align-items:center;">
            <el-button @click="generatePreview">生成示例编码</el-button>
            <div style="font-size:13px; color:#666;">
              示例：<span style="font-weight:500">{{ currentTemplatePreview }}</span>
            </div>
          </div>
          <div style="margin-top:8px; font-size:12px; color:#909399;">
            支持的占位符：{YYYY}年份, {MM}月份, {DD}日期, {SEQ:n}序号(n位数)
          </div>
        </el-form-item>
        <el-form-item label="模板文件 (PNG)">
          <el-upload
            action="#"
            :auto-upload="false"
            accept="image/png"
            :limit="1"
            :on-change="onTemplateFileChange"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
          </el-upload>
          <div v-if="currentTemplate.fileData" style="margin-top:12px;">
            <img :src="currentTemplate.fileData" alt="模板预览" style="max-width:200px; max-height:200px; border:1px solid #eee;" />
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

<style scoped>
.settings-tenants {
  padding: 20px;
}

.tenant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tenant-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.ops-area {
  display: flex;
  gap: 12px;
}

.tenant-cards {
  margin-top: 20px;
}

.tenant-card-col {
  margin-bottom: 20px;
}

.tenant-card {
  height: 100%;
  transition: all 0.3s;
}

.tenant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.tenant-card-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.tenant-card-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.tenant-code {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.tenant-card-body {
  margin-bottom: 15px;
}

.tenant-info {
  margin-bottom: 6px;
  font-size: 14px;
  display: flex;
}

.tenant-info label {
  color: #909399;
  width: 60px;
}

.tenant-logo {
  margin: 10px 0;
  text-align: center;
}

.tenant-logo img {
  max-width: 100px;
  max-height: 80px;
  object-fit: contain;
}

.tenant-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

/* 表单样式 */
:deep(.el-upload--text) {
  width: 100%;
}

:deep(.el-tabs__item) {
  font-size: 15px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { get, post, put, del } from '@/utils/request';
import service from '@/utils/request';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

interface TemplateItem {
  id: string;
  name: string;
  codeFormat?: string;
  fileData?: string | null; // dataURL
}

// 定义上传文件类型接口
interface UploadFile {
  name: string;
  percentage?: number;
  raw: File;
  size: number;
  status: string;
  uid: number;
  url?: string;
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
    const res = await get<Tenant[]>('/api/tenants');
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
const currentTemplatePreview = ref<string>('');

/**
 * 生成编码预览，支持占位符：{YYYY},{MM},{DD},{SEQ:n}
 */
const formatInvoiceCode = (format: string, seq = 1) => {
  const now = new Date();
  const YYYY = now.getFullYear().toString();
  const MM = (now.getMonth() + 1).toString().padStart(2, '0');
  const DD = now.getDate().toString().padStart(2, '0');
  let out = format || '';

  out = out.replace(/\{YYYY\}/g, YYYY);
  out = out.replace(/\{MM\}/g, MM);
  out = out.replace(/\{DD\}/g, DD);

  // {SEQ:n}
  out = out.replace(/\{SEQ:(\d+)\}/g, (_m, digits) => {
    const n = parseInt(digits, 10) || 4;
    return seq.toString().padStart(n, '0');
  });

  return out;
};

const generatePreview = () => {
  try {
    currentTemplatePreview.value = formatInvoiceCode(currentTemplate.value.codeFormat || '', 1);
  } catch (e) {
    currentTemplatePreview.value = '';
  }
};

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
        await put(`/api/tenants/${editModel.value.id}`, payload);
        // refresh local list
        await loadTenants();
      } else {
        await post('/api/tenants', payload);
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
    await del(`/api/tenants/${row.id}`);
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

// 使用 El-Upload 组件处理文件上传
const handleFileUpload = async (file: UploadFile, field: 'logo' | 'seal' | 'signature') => {
  if (!file || !file.raw) return;
  
  const rawFile = file.raw;
  if (rawFile.type !== 'image/png') {
    ElMessage.error('仅支持 PNG 格式的图片');
    return;
  }

  // 尝试上传到后端（/api/tenants/uploads）
  try {
    const form = new FormData();
    form.append('file', rawFile);
    const res = await service.post('/api/tenants/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    // 服务端返回结构：{ code:200, message:'上传成功', data: { url, mimetype } }
    const url = res?.data?.url || null;
    if (url) {
      if (field === 'logo') editModel.value.logoData = url;
      if (field === 'seal') editModel.value.sealData = url;
      if (field === 'signature') editModel.value.signatureData = url;
      ElMessage.success('文件上传成功');
      return;
    }
    throw new Error('上传未返回 URL');
  } catch (err) {
    console.warn('上传失败，回退到 dataURL 存储', err);
    // 回退到 dataURL（本地显示）
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (field === 'logo') editModel.value.logoData = data;
      if (field === 'seal') editModel.value.sealData = data;
      if (field === 'signature') editModel.value.signatureData = data;
    };
    reader.readAsDataURL(rawFile);
    ElMessage.warning('上传失败，已在本地预览（稍后可重试上传）');
  }
};

// 保留原方法以兼容其他地方可能使用的情况
const onFileChange = async (e: Event, field: 'logo' | 'seal' | 'signature') => {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  
  // 创建符合UploadFile类型的对象
  const uploadFile: UploadFile = {
    name: file.name,
    raw: file,
    size: file.size,
    status: 'ready',
    uid: Date.now(),
  };
  await handleFileUpload(uploadFile, field);
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

const onTemplateFileChange = async (uploadFile: UploadFile) => {
  if (!uploadFile || !uploadFile.raw) return;
  
  const file = uploadFile.raw;
  if (file.type !== 'image/png') {
    ElMessage.error('模板文件仅支持 PNG 格式（当前实现）');
    return;
  }

  try {
    const form = new FormData();
    form.append('file', file);
    const res = await service.post('/api/tenants/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const url = res?.data?.url || null;
    if (url) {
      currentTemplate.value.fileData = url;
      ElMessage.success('模板上传成功');
      return;
    }
    throw new Error('上传未返回 URL');
  } catch (err) {
    console.warn('模板上传失败，回退到 dataURL', err);
    const reader = new FileReader();
    reader.onload = () => {
      currentTemplate.value.fileData = reader.result as string;
    };
    reader.readAsDataURL(file);
    ElMessage.warning('模板上传失败，已在本地预览（稍后可重试上传）');
  }
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
.settings-tenants { 
  padding: 20px; 
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
.ops-area { 
  display: flex; 
  align-items: center;
  gap: 10px;
}
.list-area { margin-top: 6px }

/* 图片上传样式 */
.tenant-image-upload {
  width: 100%;
}

.upload-area {
  width: 100%;
  height: 140px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-area:hover {
  border-color: #409EFF;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #8c939d;
}

.upload-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 自定义Element Plus上传组件样式 */
:deep(.el-upload) {
  width: 100%;
  height: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
}
</style>

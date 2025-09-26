<template>
  <div class="settings-tenants">
    <div class="tenant-header">
      <div class="tenant-header-left">
        <h2>账套配置</h2>
        <el-input
          v-model="searchQuery"
          placeholder="搜索账套名称或代码"
          prefix-icon="Search"
          clearable
          class="tenant-search"
          @input="handleSearch"
        />
      </div>
      <div class="ops-area">
        <el-tooltip content="刷新数据" placement="top">
          <el-button circle @click="loadTenants">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-button type="primary" @click="addTenant">
          <el-icon><Plus /></el-icon>新增账套
        </el-button>
        <el-button @click="goHome">返回导航页</el-button>
      </div>
    </div>

    <div class="tenant-cards">
      <div v-if="isLoading" style="display: flex; flex-wrap: wrap; gap: 20px;">
        <div v-for="i in 4" :key="i" style="width: 280px; height: 250px;">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" style="width: 100%; height: 80px;" />
              <div style="padding: 14px;">
                <el-skeleton-item variant="h3" style="width: 50%;" />
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px;">
                  <el-skeleton-item variant="text" style="margin-right: 16px;" />
                  <el-skeleton-item variant="text" style="width: 30%;" />
                </div>
                <div style="margin-top: 16px;">
                  <el-skeleton-item variant="text" />
                  <el-skeleton-item variant="text" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>
        
      <div v-else-if="filteredTenants.length === 0" class="empty-state">
        <el-empty :description="searchQuery ? '没有找到匹配的账套' : '暂无账套信息'">
          <el-button type="primary" @click="addTenant" v-if="!searchQuery">新增账套</el-button>
          <el-button @click="searchQuery = ''" v-else>清除搜索</el-button>
        </el-empty>
      </div>
      
      <el-row v-else :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in filteredTenants" :key="item.id" class="tenant-card-col">
          <el-card shadow="hover" class="tenant-card" :body-style="{ padding: '0px' }">
            <div class="tenant-card-top" :style="item.logoData ? 'height: 80px' : 'height: 40px'">
              <div class="tenant-logo" v-if="item.logoData">
                <img :src="item.logoData" alt="logo" />
              </div>
            </div>
            <div class="tenant-card-content">
              <div class="tenant-card-header">
                <h3>{{ item.name }}</h3>
                <el-tag size="small" effect="light">{{ item.code }}</el-tag>
              </div>
              <div class="tenant-card-body">
                <div class="tenant-info" v-if="item.registerNo"><i class="el-icon-document"></i>注册号: {{ item.registerNo }}</div>
                <div class="tenant-info" v-if="item.taxNo"><i class="el-icon-collection-tag"></i>税号: {{ item.taxNo }}</div>
                <div class="tenant-info" v-if="item.phone"><i class="el-icon-phone"></i>电话: {{ item.phone }}</div>
                <div class="tenant-info" v-if="item.email"><i class="el-icon-message"></i>邮箱: {{ item.email }}</div>
                <div class="tenant-info" v-if="item.address"><i class="el-icon-location"></i>地址: {{ item.address }}</div>
              </div>
              <div class="tenant-card-footer">
                <el-tooltip content="编辑账套信息" placement="top" :hide-after="1500">
                  <el-button type="primary" text @click="editTenant(item)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除账套" placement="top" :hide-after="1500">
                  <el-popconfirm
                    title="确定要删除此账套吗？删除后不可恢复。"
                    @confirm="removeTenant(item)"
                    confirm-button-text="确认"
                    cancel-button-text="取消"
                    icon="Warning"
                    icon-color="#F56C6C"
                  >
                    <template #reference>
                      <el-button type="danger" text>
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </div>
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
                      <template v-else>
                        <img :src="editModel.logoData" alt="logo" class="upload-preview" />
                        <div class="upload-hover-mask">
                          <el-icon class="upload-icon"><Plus /></el-icon>
                          <div class="upload-text">点击替换</div>
                        </div>
                      </template>
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
                      <template v-else>
                        <img :src="editModel.sealData" alt="公章" class="upload-preview" />
                        <div class="upload-hover-mask">
                          <el-icon class="upload-icon"><Plus /></el-icon>
                          <div class="upload-text">点击替换</div>
                        </div>
                      </template>
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
                      <template v-else>
                        <img :src="editModel.signatureData" alt="签字" class="upload-preview" />
                        <div class="upload-hover-mask">
                          <el-icon class="upload-icon"><Plus /></el-icon>
                          <div class="upload-text">点击替换</div>
                        </div>
                      </template>
                    </div>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="打印模板">
            <el-form-item label="打印模板管理">
              <div>
                <el-button type="primary" @click="openAddTemplate">新增打印模板</el-button>
                <el-table :data="editModel.templates" style="width:100%; margin-top:16px;" size="small">
                  <el-table-column prop="name" label="模板名称" />
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

          <el-tab-pane label="发票编码格式">
            <el-form-item label="编码格式管理">
              <div>
                <el-button type="primary" @click="openAddCodeFormat">新增编码格式</el-button>
                <el-table :data="editModel.codeFormats" style="width:100%; margin-top:16px;" size="small">
                  <el-table-column prop="name" label="格式名称" />
                  <el-table-column prop="format" label="编码格式" />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="primary" link @click="editCodeFormat(row)">编辑</el-button>
                      <el-button type="danger" link @click="removeCodeFormat(row)">删除</el-button>
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

    <!-- 打印模板新增/编辑对话框 -->
    <el-dialog v-model="templateDialogVisible" title="打印模板设置" width="600px">
      <el-form :model="currentTemplate" label-width="120px">
        <el-form-item label="模板名称">
          <el-input v-model="currentTemplate.name" />
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
              <el-button type="primary">{{currentTemplate.fileData ? '替换文件' : '选择文件'}}</el-button>
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

    <!-- 发票编码格式新增/编辑对话框 -->
    <el-dialog v-model="codeFormatDialogVisible" title="发票编码格式设置" width="600px">
      <el-form :model="currentCodeFormat" label-width="120px">
        <el-form-item label="格式名称">
          <el-input v-model="currentCodeFormat.name" />
        </el-form-item>
        <el-form-item label="编码格式">
          <el-input v-model="currentCodeFormat.format" placeholder="例如：INV-{YYYY}{MM}-{SEQ:4}" />
          <div style="margin-top:12px; display:flex; gap:12px; align-items:center;">
            <el-button @click="generateCodeFormatPreview">生成示例编码</el-button>
            <div style="font-size:13px; color:#666;">
              示例：<span style="font-weight:500">{{ currentCodeFormatPreview }}</span>
            </div>
          </div>
          <div style="margin-top:8px; font-size:12px; color:#909399;">
            支持的占位符：{YYYY}年份, {MM}月份, {DD}日期, {SEQ:n}序号(n位数)
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="codeFormatDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCodeFormat">保存</el-button>
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
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.tenant-header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.tenant-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.tenant-search {
  width: 260px;
}

.ops-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-cards {
  margin-top: 20px;
}

.empty-state {
  margin: 48px 0;
  text-align: center;
}

.tenant-card-col {
  margin-bottom: 20px;
}

.tenant-card {
  height: 100%;
  transition: all 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tenant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.tenant-card-top {
  width: 100%;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tenant-card-content {
  padding: 16px;
}

.tenant-card-header {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.tenant-card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  flex: 1;
}

.tenant-card-body {
  margin-bottom: 16px;
}

.tenant-info {
  margin-bottom: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  color: #606266;
}

.tenant-info i {
  margin-right: 6px;
  font-size: 14px;
  color: #909399;
}

.tenant-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 8px;
}

.tenant-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.tenant-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  margin-top: auto;
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { get, post, put, del } from '@/utils/request';
import service from '@/utils/request';
import { ElMessage } from 'element-plus';
import { Plus, Edit, Delete, Refresh, Search } from '@element-plus/icons-vue';
import imageCompression from 'browser-image-compression';

interface TemplateItem {
  id: string;
  name: string;
  fileData?: string | null; // dataURL
}

interface CodeFormatItem {
  id: string;
  name: string;
  format: string;
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
  codeFormats?: CodeFormatItem[];
}

const router = useRouter();

const tenants = ref<Tenant[]>([]);
const searchQuery = ref('');
const isLoading = ref(false);

// 过滤后的账套列表
const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value;
  const query = searchQuery.value.toLowerCase();
  return tenants.value.filter(tenant => 
    tenant.name.toLowerCase().includes(query) || 
    (tenant.code && tenant.code.toLowerCase().includes(query))
  );
});

// 搜索处理函数
const handleSearch = () => {
  console.log('搜索:', searchQuery.value);
};

// Load tenants from backend on mount
const loadTenants = async () => {
  try {
    isLoading.value = true;
    const res = await get<Tenant[] | { code: number; message: string; data: Tenant[] }>('/api/tenants');
    if (Array.isArray(res)) {
      tenants.value = res;
    } else if (res && Array.isArray(res.data)) {
      tenants.value = res.data;
    } else {
      console.warn('接口返回的数据格式不符合预期', res);
      tenants.value = [];
    }
    console.log('加载账套完成', tenants.value);
  } catch (e) {
    console.error('加载账套失败', e);
    tenants.value = [];
    ElMessage.error('加载账套数据失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadTenants();
});

const editDialogVisible = ref(false);
const editModel = ref<Tenant>({ id: '', name: '' });
const tenantFormRef = ref();

const templateDialogVisible = ref(false);
const currentTemplate = ref<TemplateItem>({ id: '', name: '', fileData: null });

const codeFormatDialogVisible = ref(false);
const currentCodeFormat = ref<CodeFormatItem>({ id: '', name: '', format: '' });
const currentCodeFormatPreview = ref<string>('');

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

const generateCodeFormatPreview = () => {
  try {
    currentCodeFormatPreview.value = formatInvoiceCode(currentCodeFormat.value.format || '', 1);
  } catch (e) {
    currentCodeFormatPreview.value = '';
  }
};

const rules = {
  name: [{ required: true, message: '请输入账套名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账套代码', trigger: 'blur' }]
};

const addTenant = () => {
  editModel.value = { 
    id: `t${Date.now()}`, 
    name: '', 
    templates: [], 
    codeFormats: [] 
  } as Tenant;
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
      
      ElMessage.info('正在保存数据，请稍候...');
      
      if (exists) {
        console.log(`更新账套信息: ${payload.id}`, payload);
        await put(`/api/tenants/${editModel.value.id}`, payload);
        // refresh local list
        await loadTenants();
      } else {
        console.log('创建新账套', payload);
        await post('/api/tenants', payload);
        await loadTenants();
      }
      editDialogVisible.value = false;
      ElMessage.success('保存成功');
    } catch (err: any) {
      console.error('保存账套失败', err);
      // 显示具体的错误信息以便调试
      const errorMsg = err?.response?.data?.message || err?.message || '未知错误';
      console.error('错误详情:', errorMsg, err?.response?.data);
      
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
        ElMessage.error(`保存失败: ${errorMsg}`);
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

// 压缩图片函数
const compressImage = async (file: File): Promise<File> => {
  console.log('开始压缩图片，原始大小:', file.size / 1024, 'KB');
  
  const options = {
    maxSizeMB: 0.5,              // 最大文件大小，超过则压缩
    maxWidthOrHeight: 800,       // 最大宽度/高度
    useWebWorker: true,          // 使用Web Worker提高性能
    preserveExif: false          // 不保留EXIF数据，进一步减小体积
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log('压缩后大小:', compressedFile.size / 1024, 'KB');
    return compressedFile;
  } catch (error) {
    console.error('图片压缩失败:', error);
    return file; // 压缩失败时返回原始文件
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

  // 清除现有数据，确保可以重新上传
  if (field === 'logo') editModel.value.logoData = '';
  if (field === 'seal') editModel.value.sealData = '';
  if (field === 'signature') editModel.value.signatureData = '';

  // 尝试上传到后端（/api/tenants/uploads）
  ElMessage.info('正在处理图片，请稍候...');
  try {
    // 压缩图片
    const compressedFile = await compressImage(rawFile);
    
    const form = new FormData();
    form.append('file', compressedFile);
    console.log(`上传图片: ${field}, 大小: ${compressedFile.size / 1024} KB`);
    
    const res = await service.post('/api/tenants/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    // 服务端返回结构：{ code:200, message:'上传成功', data: { url, mimetype } }
    console.log('上传图片响应:', res);
    
    // 服务器返回的数据可能有不同格式，需要处理
    let url = null;
    if (res && typeof res === 'object') {
      // 尝试从各种可能的数据结构中获取url
      const data = (res as any).data;
      if (data && typeof data === 'object') {
        // 典型的 { code: 200, message: '上传成功', data: { url: '...' } } 格式
        url = data.url || null;
      }
    }
    
    if (url) {
      if (field === 'logo') editModel.value.logoData = url;
      if (field === 'seal') editModel.value.sealData = url;
      if (field === 'signature') editModel.value.signatureData = url;
      ElMessage.success('文件上传成功');
      return;
    }
    throw new Error('上传未返回有效的URL');
  } catch (err: any) {
    console.error('上传失败，错误详情:', err);
    const errorMsg = err?.response?.data?.message || err?.message || '未知错误';
    
    // 回退到 dataURL（本地显示）
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (field === 'logo') editModel.value.logoData = data;
      if (field === 'seal') editModel.value.sealData = data;
      if (field === 'signature') editModel.value.signatureData = data;
      // 删除警告消息，因为实际上不影响保存
      console.log('使用本地预览模式显示图片');
    };
    reader.readAsDataURL(rawFile);
  }
};

// 保留原方法以兼容其他地方可能使用的情况
const onFileChange = async (e: Event, field: 'logo' | 'seal' | 'signature') => {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('文件过大，系统将自动压缩图片');
  }
  
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

// 打印模板管理
const openAddTemplate = () => {
  currentTemplate.value = { id: `tpl${Date.now()}`, name: '', fileData: null };
  templateDialogVisible.value = true;
};

const editTemplate = (tpl: TemplateItem) => {
  // 深拷贝，确保编辑不直接影响原对象
  currentTemplate.value = JSON.parse(JSON.stringify(tpl));
  templateDialogVisible.value = true;
};

const removeTemplate = (tpl: TemplateItem) => {
  if (!editModel.value.templates) return;
  editModel.value.templates = editModel.value.templates.filter(t => t.id !== tpl.id);
};

// 发票编码格式管理
const openAddCodeFormat = () => {
  currentCodeFormat.value = { id: `fmt${Date.now()}`, name: '', format: '' };
  codeFormatDialogVisible.value = true;
};

const editCodeFormat = (fmt: CodeFormatItem) => {
  // 深拷贝，确保编辑不直接影响原对象
  currentCodeFormat.value = JSON.parse(JSON.stringify(fmt));
  // 生成示例预览
  generateCodeFormatPreview();
  codeFormatDialogVisible.value = true;
};

const removeCodeFormat = (fmt: CodeFormatItem) => {
  if (!editModel.value.codeFormats) return;
  editModel.value.codeFormats = editModel.value.codeFormats.filter(f => f.id !== fmt.id);
};

const onTemplateFileChange = async (uploadFile: UploadFile) => {
  if (!uploadFile || !uploadFile.raw) return;
  
  const file = uploadFile.raw;
  if (file.type !== 'image/png') {
    ElMessage.error('模板文件仅支持 PNG 格式（当前实现）');
    return;
  }

  // 清除现有数据，确保可以重新上传
  currentTemplate.value.fileData = null;

  ElMessage.info('正在处理模板文件，请稍候...');
  try {
    // 压缩模板文件
    const compressedFile = await compressImage(file);
    
    const form = new FormData();
    form.append('file', compressedFile);
    console.log('上传模板文件, 大小:', compressedFile.size / 1024, 'KB');
    const res = await service.post('/api/tenants/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    console.log('上传模板响应:', res);
    
    // 服务器返回的数据可能有不同格式，需要处理
    let url = null;
    if (res && typeof res === 'object') {
      // 尝试从各种可能的数据结构中获取url
      const data = (res as any).data;
      if (data && typeof data === 'object') {
        url = data.url || null;
      }
    }
    
    if (url) {
      currentTemplate.value.fileData = url;
      ElMessage.success('模板上传成功');
      return;
    }
    throw new Error('上传未返回有效的URL');
  } catch (err: any) {
    console.error('模板上传失败，错误详情:', err);
    const errorMsg = err?.response?.data?.message || err?.message || '未知错误';
    
    const reader = new FileReader();
    reader.onload = () => {
      currentTemplate.value.fileData = reader.result as string;
      // 删除警告消息，因为实际上不影响保存
      console.log('使用本地预览模式显示模板');
    };
    reader.readAsDataURL(file);
  }
};

const saveTemplate = () => {
  try {
    if (!currentTemplate.value.name) {
      ElMessage.warning('请输入模板名称');
      return;
    }
    
    if (!editModel.value.templates) editModel.value.templates = [];
    
    const idx = editModel.value.templates.findIndex(t => t.id === currentTemplate.value.id);
    if (idx >= 0) {
      editModel.value.templates[idx] = { ...currentTemplate.value } as TemplateItem;
    } else {
      editModel.value.templates.push({ ...currentTemplate.value } as TemplateItem);
    }
    
    templateDialogVisible.value = false;
    ElMessage.success('打印模板保存成功');
    console.log('当前打印模板列表:', editModel.value.templates);
  } catch (error) {
    console.error('保存打印模板出错:', error);
    ElMessage.error('保存打印模板失败，请重试');
  }
};

const saveCodeFormat = () => {
  try {
    if (!currentCodeFormat.value.name) {
      ElMessage.warning('请输入格式名称');
      return;
    }
    
    if (!currentCodeFormat.value.format) {
      ElMessage.warning('请输入编码格式');
      return;
    }
    
    if (!editModel.value.codeFormats) editModel.value.codeFormats = [];
    
    const idx = editModel.value.codeFormats.findIndex(f => f.id === currentCodeFormat.value.id);
    if (idx >= 0) {
      editModel.value.codeFormats[idx] = { ...currentCodeFormat.value } as CodeFormatItem;
    } else {
      editModel.value.codeFormats.push({ ...currentCodeFormat.value } as CodeFormatItem);
    }
    
    codeFormatDialogVisible.value = false;
    ElMessage.success('编码格式保存成功');
    console.log('当前编码格式列表:', editModel.value.codeFormats);
  } catch (error) {
    console.error('保存编码格式出错:', error);
    ElMessage.error('保存编码格式失败，请重试');
  }
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

.upload-hover-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
}

.upload-area:hover .upload-hover-mask {
  opacity: 1;
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

<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="素材管理" 
    width="700px"
    class="material-dialog"
  >
    <div class="material-management">
      <div class="dialog-header">
        <h3>账套: {{ accountSet?.name }}</h3>
        <p class="dialog-description">管理企业LOGO、印章和签名素材，用于业务票据打印</p>
      </div>

      <el-tabs v-model="activeTab" class="material-tabs">
        <!-- LOGO管理 -->
        <el-tab-pane label="企业LOGO" name="logo">
          <div class="upload-section">
            <div class="upload-info">
              <h4>企业LOGO</h4>
              <p>建议尺寸: 200×200px，PNG格式，透明背景</p>
            </div>
            <el-upload
              class="upload-demo"
              action="/api/upload/logo"
              :data="{ account_set_id: accountSet?.id }"
              :show-file-list="false"
              :on-success="handleLogoSuccess"
              :before-upload="beforeUpload"
            >
              <el-button type="primary" size="large">
                <el-icon><Upload /></el-icon>
                点击上传LOGO
              </el-button>
            </el-upload>
            <div v-if="accountSet?.logo_path" class="preview-section">
              <div class="preview-title">当前LOGO预览</div>
              <div class="preview-content">
                <img :src="accountSet.logo_path" alt="LOGO" class="preview-image" />
                <div class="preview-actions">
                  <el-button size="small" @click="viewImage(accountSet.logo_path)">查看大图</el-button>
                  <el-button size="small" type="danger" @click="removeImage('logo')">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 印章管理 -->
        <el-tab-pane label="企业印章" name="seal">
          <div class="upload-section">
            <div class="upload-info">
              <h4>企业印章</h4>
              <p>建议尺寸: 150×150px，PNG格式，圆形或椭圆形</p>
            </div>
            <el-upload
              class="upload-demo"
              action="/api/upload/seal"
              :data="{ account_set_id: accountSet?.id }"
              :show-file-list="false"
              :on-success="handleSealSuccess"
              :before-upload="beforeUpload"
            >
              <el-button type="primary" size="large">
                <el-icon><Upload /></el-icon>
                点击上传印章
              </el-button>
            </el-upload>
            <div v-if="accountSet?.seal_path" class="preview-section">
              <div class="preview-title">当前印章预览</div>
              <div class="preview-content">
                <img :src="accountSet.seal_path" alt="印章" class="preview-image" />
                <div class="preview-actions">
                  <el-button size="small" @click="viewImage(accountSet.seal_path)">查看大图</el-button>
                  <el-button size="small" type="danger" @click="removeImage('seal')">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 签名管理 -->
        <el-tab-pane label="负责人签名" name="signature">
          <div class="upload-section">
            <div class="upload-info">
              <h4>负责人签名</h4>
              <p>建议尺寸: 200×80px，PNG格式，透明背景</p>
            </div>
            <el-upload
              class="upload-demo"
              action="/api/upload/signature"
              :data="{ account_set_id: accountSet?.id }"
              :show-file-list="false"
              :on-success="handleSignatureSuccess"
              :before-upload="beforeUpload"
            >
              <el-button type="primary" size="large">
                <el-icon><Upload /></el-icon>
                点击上传签名
              </el-button>
            </el-upload>
            <div v-if="accountSet?.signature_path" class="preview-section">
              <div class="preview-title">当前签名预览</div>
              <div class="preview-content">
                <img :src="accountSet.signature_path" alt="签名" class="preview-image" />
                <div class="preview-actions">
                  <el-button size="small" @click="viewImage(accountSet.signature_path)">查看大图</el-button>
                  <el-button size="small" type="danger" @click="removeImage('signature')">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" size="large">关闭</el-button>
      </div>
    </template>

    <!-- 图片查看对话框 -->
    <el-dialog v-model="imageViewerVisible" title="图片预览" width="500px" align-center>
      <div class="image-viewer">
        <img :src="currentImage" alt="预览" class="full-image" />
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: Boolean,
  accountSet: Object
});

const emit = defineEmits(['update:modelValue', 'update']);

const dialogVisible = ref(false);
const activeTab = ref('logo');
const imageViewerVisible = ref(false);
const currentImage = ref('');

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
});

watch(dialogVisible, (val) => {
  emit('update:modelValue', val);
});

// 文件上传前验证
const beforeUpload = (file) => {
  const isPNG = file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isPNG) {
    ElMessage.error('上传文件只能是 PNG 格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('上传文件大小不能超过 2MB!');
    return false;
  }
  return true;
};

// 上传成功处理
const handleLogoSuccess = (response) => {
  if (props.accountSet) {
    props.accountSet.logo_path = response.file_path;
  }
  ElMessage.success('LOGO上传成功');
  emit('update');
};

const handleSealSuccess = (response) => {
  if (props.accountSet) {
    props.accountSet.seal_path = response.file_path;
  }
  ElMessage.success('印章上传成功');
  emit('update');
};

const handleSignatureSuccess = (response) => {
  if (props.accountSet) {
    props.accountSet.signature_path = response.file_path;
  }
  ElMessage.success('签名上传成功');
  emit('update');
};

// 查看图片
const viewImage = (imageUrl) => {
  currentImage.value = imageUrl;
  imageViewerVisible.value = true;
};

// 删除图片
const removeImage = async (type) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除${getTypeName(type)}吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // 调用API删除文件
    const response = await fetch(`/api/upload/${type}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        account_set_id: props.accountSet?.id,
        file_path: props.accountSet[`${type}_path`]
      })
    });

    if (response.ok) {
      if (props.accountSet) {
        props.accountSet[`${type}_path`] = null;
      }
      ElMessage.success('删除成功');
      emit('update');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const getTypeName = (type) => {
  const names = {
    logo: 'LOGO',
    seal: '印章',
    signature: '签名'
  };
  return names[type] || type;
};
</script>

<style scoped>
.dialog-header {
  margin-bottom: 24px;
}

.dialog-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.dialog-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.material-tabs {
  margin-top: 16px;
}

.upload-section {
  padding: 20px 0;
}

.upload-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.upload-info p {
  margin: 0 0 16px 0;
  color: #909399;
  font-size: 14px;
}

.preview-section {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-title {
  font-weight: 500;
  margin-bottom: 12px;
  color: #606266;
}

.preview-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.preview-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  background: white;
  padding: 8px;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-viewer {
  text-align: center;
}

.full-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
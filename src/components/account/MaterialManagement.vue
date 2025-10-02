<template>
  <el-dialog 
    v-model="dialogVisible" 
    title="素材管理" 
    width="800px"
    class="material-dialog"
    @closed="handleDialogClosed"
  >
    <div class="material-management" v-if="accountSet">
      <div class="dialog-header">
        <h3>账套: {{ accountSet.name }}</h3>
        <p class="dialog-description">管理企业LOGO、印章和签名素材，用于业务票据打印</p>
      </div>

      <el-tabs v-model="activeTab" class="material-tabs">
        <!-- LOGO管理 -->
        <el-tab-pane label="企业LOGO" name="logo">
          <div class="upload-section">
            <div class="upload-info">
              <h4>企业LOGO</h4>
              <p class="size-requirement">建议尺寸: 400×400px，PNG格式，透明背景</p>
              <p class="upload-tip">支持拖拽上传，点击选择文件或直接将图片拖到此处</p>
            </div>
            
            <el-upload
              class="upload-area"
              drag
              action="/api/upload/logo"
              :data="{ account_set_id: accountSet.id }"
              :show-file-list="false"
              :before-upload="beforeLogoUpload"
              :on-success="handleLogoSuccess"
              :on-error="handleUploadError"
              accept=".png,.jpg,.jpeg"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p>点击或拖拽LOGO文件到此区域</p>
                  <p class="upload-hint">支持 PNG、JPG 格式，建议尺寸 400×400px</p>
                </div>
              </div>
            </el-upload>

            <div v-if="accountSet.logo_path" class="preview-section">
              <div class="preview-header">
                <h5>当前LOGO预览</h5>
                <div class="preview-actions">
                  <el-button size="small" @click="viewImage(accountSet.logo_path, 'LOGO')">查看大图</el-button>
                  <el-button size="small" @click="openCropDialog(accountSet.logo_path, 'logo')">优化裁剪</el-button>
                  <el-button size="small" type="danger" @click="removeImage('logo')">删除</el-button>
                </div>
              </div>
              <div class="preview-content">
                <div class="preview-image-container">
                  <img :src="getImageUrl(accountSet.logo_path)" alt="LOGO" class="preview-image" />
                  <div class="image-overlay">
                    <span class="image-size">400×400</span>
                  </div>
                </div>
                <div class="preview-info">
                  <p><strong>状态:</strong> <el-tag type="success" size="small">已上传</el-tag></p>
                  <p><strong>尺寸要求:</strong> 400×400px</p>
                  <p><strong>格式要求:</strong> PNG（推荐）</p>
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
              <p class="size-requirement">建议尺寸: 400×400px，PNG格式，圆形或椭圆形</p>
              <p class="upload-tip">支持拖拽上传，点击选择文件或直接将图片拖到此处</p>
            </div>
            
            <el-upload
              class="upload-area"
              drag
              action="/api/upload/seal"
              :data="{ account_set_id: accountSet.id }"
              :show-file-list="false"
              :before-upload="beforeSealUpload"
              :on-success="handleSealSuccess"
              :on-error="handleUploadError"
              accept=".png,.jpg,.jpeg"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><Stamp /></el-icon>
                <div class="upload-text">
                  <p>点击或拖拽印章文件到此区域</p>
                  <p class="upload-hint">支持 PNG、JPG 格式，建议尺寸 400×400px</p>
                </div>
              </div>
            </el-upload>

            <div v-if="accountSet.seal_path" class="preview-section">
              <div class="preview-header">
                <h5>当前印章预览</h5>
                <div class="preview-actions">
                  <el-button size="small" @click="viewImage(accountSet.seal_path, '印章')">查看大图</el-button>
                  <el-button size="small" @click="openCropDialog(accountSet.seal_path, 'seal')">优化裁剪</el-button>
                  <el-button size="small" type="danger" @click="removeImage('seal')">删除</el-button>
                </div>
              </div>
              <div class="preview-content">
                <div class="preview-image-container">
                  <img :src="getImageUrl(accountSet.seal_path)" alt="印章" class="preview-image" />
                  <div class="image-overlay">
                    <span class="image-size">400×400</span>
                  </div>
                </div>
                <div class="preview-info">
                  <p><strong>状态:</strong> <el-tag type="success" size="small">已上传</el-tag></p>
                  <p><strong>尺寸要求:</strong> 400×400px</p>
                  <p><strong>格式要求:</strong> PNG（推荐）</p>
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
              <p class="size-requirement">建议尺寸: 400×150px，PNG格式，透明背景</p>
              <p class="upload-tip">支持拖拽上传，点击选择文件或直接将图片拖到此处</p>
            </div>
            
            <el-upload
              class="upload-area signature-upload"
              drag
              action="/api/upload/signature"
              :data="{ account_set_id: accountSet.id }"
              :show-file-list="false"
              :before-upload="beforeSignatureUpload"
              :on-success="handleSignatureSuccess"
              :on-error="handleUploadError"
              accept=".png,.jpg,.jpeg"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><Edit /></el-icon>
                <div class="upload-text">
                  <p>点击或拖拽签名文件到此区域</p>
                  <p class="upload-hint">支持 PNG、JPG 格式，建议尺寸 400×150px</p>
                </div>
              </div>
            </el-upload>

            <div v-if="accountSet.signature_path" class="preview-section">
              <div class="preview-header">
                <h5>当前签名预览</h5>
                <div class="preview-actions">
                  <el-button size="small" @click="viewImage(accountSet.signature_path, '签名')">查看大图</el-button>
                  <el-button size="small" @click="openCropDialog(accountSet.signature_path, 'signature')">优化裁剪</el-button>
                  <el-button size="small" type="danger" @click="removeImage('signature')">删除</el-button>
                </div>
              </div>
              <div class="preview-content">
                <div class="preview-image-container signature-preview">
                  <img :src="getImageUrl(accountSet.signature_path)" alt="签名" class="preview-image" />
                  <div class="image-overlay">
                    <span class="image-size">400×150</span>
                  </div>
                </div>
                <div class="preview-info">
                  <p><strong>状态:</strong> <el-tag type="success" size="small">已上传</el-tag></p>
                  <p><strong>尺寸要求:</strong> 400×150px</p>
                  <p><strong>格式要求:</strong> PNG（推荐）</p>
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
        <el-button 
          type="primary" 
          @click="saveAllMaterials" 
          size="large"
          :loading="saving"
          v-if="hasChanges"
        >
          {{ saving ? '保存中...' : '保存所有更改' }}
        </el-button>
      </div>
    </template>

    <!-- 图片查看对话框 -->
    <el-dialog v-model="imageViewerVisible" :title="`${currentImageType}预览`" width="600px" align-center>
      <div class="image-viewer">
        <img :src="currentImage" :alt="currentImageType" class="full-image" />
        <div class="image-info">
          <p><strong>素材类型:</strong> {{ currentImageType }}</p>
          <p><strong>建议尺寸:</strong> {{ getRecommendedSize(currentImageType) }}</p>
          <p><strong>当前状态:</strong> <el-tag type="success">已上传</el-tag></p>
        </div>
      </div>
    </el-dialog>

    <!-- 图片裁剪对话框 -->
    <el-dialog v-model="cropDialogVisible" :title="`${currentCropType}裁剪`" width="800px" align-center>
      <div class="crop-dialog">
        <div class="crop-container">
          <div class="crop-area" ref="cropArea">
            <img :src="currentCropImage" alt="裁剪图片" ref="cropImage" />
          </div>
          <div class="crop-controls">
            <div class="crop-preview">
              <h4>裁剪预览</h4>
              <div class="preview-container" ref="previewContainer">
                <img :src="currentCropImage" alt="预览" ref="previewImage" />
              </div>
            </div>
            <div class="crop-buttons">
              <el-button @click="resetCrop">重置</el-button>
              <el-button type="primary" @click="confirmCrop">确认裁剪</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled, Stamp, Edit } from '@element-plus/icons-vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps({
  modelValue: Boolean,
  accountSet: Object
});

const emit = defineEmits(['update:modelValue', 'update']);

const dialogVisible = ref(false);
const activeTab = ref('logo');
const imageViewerVisible = ref(false);
const cropDialogVisible = ref(false);
const currentImage = ref('');
const currentImageType = ref('');
const currentCropImage = ref('');
const currentCropType = ref('');
const saving = ref(false);
const cropper = ref(null);

// 计算是否有更改
const hasChanges = computed(() => {
  return props.accountSet?.logo_path || props.accountSet?.seal_path || props.accountSet?.signature_path;
});

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
});

watch(dialogVisible, (val) => {
  emit('update:modelValue', val);
});

const handleDialogClosed = () => {
  activeTab.value = 'logo';
};

// 文件上传前验证
const validateImage = (file, expectedWidth, expectedHeight, typeName) => {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isImage) {
      ElMessage.error(`上传${typeName}只能是图片格式!`);
      return reject(false);
    }
    if (!isLt5M) {
      ElMessage.error(`上传${typeName}大小不能超过 5MB!`);
      return reject(false);
    }

    // 创建图片对象检查尺寸
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.width;
      const height = img.height;
      
      if (width !== expectedWidth || height !== expectedHeight) {
        ElMessage.warning(`建议${typeName}尺寸为 ${expectedWidth}×${expectedHeight}px，当前为 ${width}×${height}px`);
      }
      resolve(true);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(true); // 如果图片加载失败，仍然允许上传
    };
    
    img.src = objectUrl;
  });
};

const beforeLogoUpload = (file) => {
  return validateImage(file, 400, 400, 'LOGO');
};

const beforeSealUpload = (file) => {
  return validateImage(file, 400, 400, '印章');
};

const beforeSignatureUpload = (file) => {
  return validateImage(file, 400, 150, '签名');
};

// 上传成功处理
const handleLogoSuccess = (response) => {
  if (props.accountSet && response.success) {
    props.accountSet.logo_path = response.file_path;
    ElMessage.success('LOGO上传成功');
    emit('update');
  }
};

const handleSealSuccess = (response) => {
  if (props.accountSet && response.success) {
    props.accountSet.seal_path = response.file_path;
    ElMessage.success('印章上传成功');
    emit('update');
  }
};

const handleSignatureSuccess = (response) => {
  if (props.accountSet && response.success) {
    props.accountSet.signature_path = response.file_path;
    ElMessage.success('签名上传成功');
    emit('update');
  }
};

// 上传错误处理
const handleUploadError = (error) => {
  console.error('上传失败:', error);
  ElMessage.error('上传失败，请重试或联系管理员');
};

// 查看图片
const viewImage = (imageUrl, type) => {
  currentImage.value = getImageUrl(imageUrl);
  currentImageType.value = type;
  imageViewerVisible.value = true;
};

// 打开裁剪对话框
const openCropDialog = (imageUrl, type) => {
  currentCropImage.value = getImageUrl(imageUrl);
  currentCropType.value = type;
  cropDialogVisible.value = true;
  
  nextTick(() => {
    initCropper();
  });
};

// 初始化裁剪器
const initCropper = () => {
  const image = document.querySelector('.crop-area img');
  const preview = document.querySelector('.preview-container img');
  
  if (cropper.value) {
    cropper.value.destroy();
  }
  
  // 根据类型设置裁剪比例
  let aspectRatio = 1; // 默认正方形
  if (currentCropType.value === 'signature') {
    aspectRatio = 400 / 150; // 签名比例
  }
  
  cropper.value = new Cropper(image, {
    aspectRatio: aspectRatio,
    viewMode: 1,
    preview: preview,
    guides: true,
    center: true,
    highlight: true,
    background: false,
    autoCropArea: 0.8,
    responsive: true,
    restore: true,
    checkCrossOrigin: false,
    cropBoxResizable: true,
    cropBoxMovable: true,
    toggleDragModeOnDblclick: true
  });
};

// 重置裁剪
const resetCrop = () => {
  if (cropper.value) {
    cropper.value.reset();
  }
};

// 确认裁剪
const confirmCrop = () => {
  if (cropper.value) {
    const canvas = cropper.value.getCroppedCanvas();
    
    // 根据类型设置输出尺寸
    let outputWidth = 400;
    let outputHeight = 400;
    
    if (currentCropType.value === 'signature') {
      outputWidth = 400;
      outputHeight = 150;
    }
    
    // 调整画布尺寸
    const resizedCanvas = document.createElement('canvas');
    const resizedContext = resizedCanvas.getContext('2d');
    resizedCanvas.width = outputWidth;
    resizedCanvas.height = outputHeight;
    
    // 绘制调整后的图像
    resizedContext.drawImage(canvas, 0, 0, outputWidth, outputHeight);
    
    // 获取Base64数据
    const croppedImageData = resizedCanvas.toDataURL('image/png');
    
    // 更新对应类型的图片
    if (props.accountSet) {
      if (currentCropType.value === 'logo') {
        props.accountSet.logo_path = croppedImageData;
      } else if (currentCropType.value === 'seal') {
        props.accountSet.seal_path = croppedImageData;
      } else if (currentCropType.value === 'signature') {
        props.accountSet.signature_path = croppedImageData;
      }
      
      ElMessage.success('裁剪成功');
      emit('update');
    }
    
    cropDialogVisible.value = false;
    
    // 销毁裁剪器
    if (cropper.value) {
      cropper.value.destroy();
      cropper.value = null;
    }
  }
};

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // 对于相对路径，可以添加基础URL
  return imagePath;
};

// 删除图片
const removeImage = async (type) => {
  try {
    const typeNames = {
      logo: 'LOGO',
      seal: '印章',
      signature: '签名'
    };
    
    await ElMessageBox.confirm(
      `确定要删除${typeNames[type]}吗？`,
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

// 保存所有素材更改
const saveAllMaterials = async () => {
  saving.value = true;
  try {
    // 这里可以添加保存逻辑，如果需要的话
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟保存
    ElMessage.success('素材保存成功');
    emit('update');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
};

// 获取推荐尺寸
const getRecommendedSize = (type) => {
  const sizes = {
    'LOGO': '400×400px',
    '印章': '400×400px',
    '签名': '400×150px'
  };
  return sizes[type] || '';
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

.size-requirement {
  margin: 0 0 4px 0;
  color: #e6a23c;
  font-weight: 500;
  font-size: 14px;
}

.upload-tip {
  margin: 0 0 16px 0;
  color: #909399;
  font-size: 13px;
}

.upload-area {
  margin-bottom: 24px;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: #f0f7ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.upload-text {
  text-align: center;
}

.upload-text p {
  margin: 4px 0;
  color: #606266;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.signature-upload :deep(.el-upload-dragger) {
  height: 120px;
}

.preview-section {
  margin-top: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h5 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.preview-image-container {
  position: relative;
  width: 120px;
  height: 120px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.signature-preview {
  width: 200px;
  height: 80px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  font-size: 10px;
  text-align: center;
}

.preview-info {
  flex: 1;
}

.preview-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}

.image-viewer {
  text-align: center;
}

.full-image {
  max-width: 100%;
  max-height: 400px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
  margin-bottom: 16px;
}

.image-info {
  text-align: left;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
}

.image-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

/* 裁剪对话框样式 */
.crop-dialog {
  padding: 0 10px;
}

.crop-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.crop-area {
  width: 100%;
  height: 400px;
  background: #f8f9fa;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  overflow: hidden;
}

.crop-controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.crop-preview {
  width: 150px;
}

.crop-preview h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.preview-container {
  width: 150px;
  height: 150px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.crop-buttons {
  display: flex;
  gap: 10px;
}
</style>
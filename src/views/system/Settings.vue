<template>
  <div class="settings-container">
    <h1 class="page-title">系统设置</h1>
    
    <el-card class="settings-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础设置" name="basic">
          <el-form :model="basicForm" :rules="basicRules" ref="basicFormRef" label-width="120px" class="settings-form">
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="basicForm.systemName" />
            </el-form-item>
            
            <el-form-item label="系统Logo">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :auto-upload="false"
                :on-change="handleLogoChange"
              >
                <img v-if="basicForm.logoUrl" :src="basicForm.logoUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">建议尺寸：200x60px，支持PNG、JPG格式</div>
            </el-form-item>
            
            <el-form-item label="系统描述" prop="description">
              <el-input v-model="basicForm.description" type="textarea" :rows="3" />
            </el-form-item>
            
            <el-form-item label="备案号" prop="recordNumber">
              <el-input v-model="basicForm.recordNumber" />
            </el-form-item>
            
            <el-form-item label="版权信息" prop="copyright">
              <el-input v-model="basicForm.copyright" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="邮件设置" name="email">
          <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-width="120px" class="settings-form">
            <el-form-item label="SMTP服务器" prop="smtpServer">
              <el-input v-model="emailForm.smtpServer" />
            </el-form-item>
            
            <el-form-item label="SMTP端口" prop="smtpPort">
              <el-input v-model="emailForm.smtpPort" />
            </el-form-item>
            
            <el-form-item label="邮箱账号" prop="emailAccount">
              <el-input v-model="emailForm.emailAccount" />
            </el-form-item>
            
            <el-form-item label="邮箱密码" prop="emailPassword">
              <el-input v-model="emailForm.emailPassword" type="password" show-password />
            </el-form-item>
            
            <el-form-item label="发件人名称" prop="senderName">
              <el-input v-model="emailForm.senderName" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveEmailSettings">保存设置</el-button>
              <el-button type="success" @click="testEmailSettings">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securityForm" :rules="securityRules" ref="securityFormRef" label-width="120px" class="settings-form">
            <el-form-item label="密码强度" prop="passwordStrength">
              <el-select v-model="securityForm.passwordStrength" placeholder="请选择密码强度要求" style="width: 100%;">
                <el-option label="低：仅限制长度" value="low" />
                <el-option label="中：要求包含字母和数字" value="medium" />
                <el-option label="高：要求包含大小写字母、数字和特殊字符" value="high" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="密码最小长度" prop="passwordLength">
              <el-input-number v-model="securityForm.passwordLength" :min="6" :max="20" />
            </el-form-item>
            
            <el-form-item label="登录失败锁定">
              <el-switch v-model="securityForm.loginLock" />
            </el-form-item>
            
            <el-form-item label="失败锁定次数" v-if="securityForm.loginLock" prop="maxLoginAttempts">
              <el-input-number v-model="securityForm.maxLoginAttempts" :min="3" :max="10" />
            </el-form-item>
            
            <el-form-item label="锁定时间(分钟)" v-if="securityForm.loginLock" prop="lockTime">
              <el-input-number v-model="securityForm.lockTime" :min="5" :max="1440" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

// 当前活动标签页
const activeTab = ref('basic');

// 基础设置表单
const basicFormRef = ref<FormInstance>();
const basicForm = reactive({
  systemName: 'Jinza管理系统',
  logoUrl: '',
  description: '一个基于Vue3 + Element Plus的现代化管理系统',
  recordNumber: '粤ICP备XXXXXXXX号',
  copyright: '© 2025 Jinza管理系统 版权所有'
});

const basicRules: FormRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '最多 200 个字符', trigger: 'blur' }
  ]
};

// 邮件设置表单
const emailFormRef = ref<FormInstance>();
const emailForm = reactive({
  smtpServer: 'smtp.example.com',
  smtpPort: '465',
  emailAccount: 'admin@example.com',
  emailPassword: '',
  senderName: 'Jinza管理系统'
});

const emailRules: FormRules = {
  smtpServer: [
    { required: true, message: '请输入SMTP服务器', trigger: 'blur' }
  ],
  smtpPort: [
    { required: true, message: '请输入SMTP端口', trigger: 'blur' }
  ],
  emailAccount: [
    { required: true, message: '请输入邮箱账号', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
};

// 安全设置表单
const securityFormRef = ref<FormInstance>();
const securityForm = reactive({
  passwordStrength: 'medium',
  passwordLength: 8,
  loginLock: true,
  maxLoginAttempts: 5,
  lockTime: 30
});

const securityRules: FormRules = {
  passwordLength: [
    { required: true, message: '请设置密码最小长度', trigger: 'blur' }
  ],
  maxLoginAttempts: [
    { required: true, message: '请设置失败锁定次数', trigger: 'blur' }
  ],
  lockTime: [
    { required: true, message: '请设置锁定时间', trigger: 'blur' }
  ]
};

// 处理Logo上传
const handleLogoChange = (file: any) => {
  // 预览上传的图片
  basicForm.logoUrl = URL.createObjectURL(file.raw);
};

// 保存基础设置
const saveBasicSettings = async () => {
  if (!basicFormRef.value) return;
  
  await basicFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟API保存
      setTimeout(() => {
        ElMessage.success('基础设置保存成功');
      }, 500);
    }
  });
};

// 保存邮件设置
const saveEmailSettings = async () => {
  if (!emailFormRef.value) return;
  
  await emailFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟API保存
      setTimeout(() => {
        ElMessage.success('邮件设置保存成功');
      }, 500);
    }
  });
};

// 测试邮件设置
const testEmailSettings = async () => {
  if (!emailFormRef.value) return;
  
  await emailFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟API测试
      ElMessage.info('正在测试邮件连接...');
      setTimeout(() => {
        ElMessage.success('邮件连接测试成功');
      }, 1500);
    }
  });
};

// 保存安全设置
const saveSecuritySettings = async () => {
  if (!securityFormRef.value) return;
  
  await securityFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟API保存
      setTimeout(() => {
        ElMessage.success('安全设置保存成功');
      }, 500);
    }
  });
};
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.settings-card {
  margin-bottom: 20px;
}

.settings-form {
  max-width: 650px;
  margin: 20px auto;
}

.avatar-uploader {
  width: 200px;
  height: 60px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  line-height: 60px;
  text-align: center;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}
</style>
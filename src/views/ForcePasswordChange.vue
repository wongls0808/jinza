<template>
  <div class="force-mask">
    <div class="dialog">
      <h2>首次登录 / 弱密码需要更新</h2>
      <p class="hint">为保障账户安全，请设置一个更安全的新密码。新密码需满足：长度≥8，避免顺子、重复字符与常见弱口令。</p>
      <el-form :model="form" label-width="100px" :disabled="loading">
        <el-form-item label="旧密码" v-if="requireOld">
          <el-input v-model="form.oldPassword" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="form.newPassword" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="form.confirm" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-alert v-if="strengthMsg" :title="strengthMsg" :type="strengthType" show-icon :closable="false" class="strength" />
      </el-form>
      <div class="actions">
        <el-button type="primary" :loading="loading" @click="submit">提交</el-button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/utils/api';

const props = defineProps({ userId: { type: Number, required: true }, requireOld: { type: Boolean, default: true } });
const emit = defineEmits(['done']);

const form = ref({ oldPassword:'', newPassword:'', confirm:'' });
const loading = ref(false);
const strengthMsg = ref('');
const strengthType = ref('info');

function evaluate(pw){
  if (!pw) { strengthMsg.value='请输入新密码'; strengthType.value='info'; return; }
  if (pw.length < 8) { strengthMsg.value='长度不足 8 位'; strengthType.value='warning'; return; }
  if (/^(.)\1+$/.test(pw)) { strengthMsg.value='不能全部相同字符'; strengthType.value='warning'; return; }
  const lower = pw.toLowerCase();
  const seq = 'abcdefghijklmnopqrstuvwxyz';
  const seqNum = '0123456789';
  const checkSeq = (s) => {
    for (let i=0;i<=s.length-6;i++){ const part=s.slice(i,i+6); const rev=part.split('').reverse().join(''); if(seq.includes(part)||seqNum.includes(part)||seq.includes(rev)||seqNum.includes(rev)) return true; }
    return false;
  };
  if (checkSeq(lower)) { strengthMsg.value='避免顺子或倒序连续字符'; strengthType.value='warning'; return; }
  const common=['password','123456','12345678','123456789','qwerty','admin','111111','abc123','iloveyou'];
  if (common.includes(lower)) { strengthMsg.value='过于常见的弱口令'; strengthType.value='warning'; return; }
  // 简易强度评分
  let score = 0; if (/[a-z]/.test(pw)) score++; if (/[A-Z]/.test(pw)) score++; if (/\d/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <=1) { strengthMsg.value='强度较低，建议混合大小写/数字/符号'; strengthType.value='warning'; }
  else if (score ===2) { strengthMsg.value='强度一般，添加更多字符类型可提升安全'; strengthType.value='info'; }
  else { strengthMsg.value='密码强度良好'; strengthType.value='success'; }
}
watch(()=>form.value.newPassword, evaluate);

async function submit(){
  if (!form.value.newPassword || form.value.newPassword!==form.value.confirm) {
    ElMessage.error('请确认新密码两次一致'); return;
  }
  loading.value = true;
  try {
    await userApi.changePassword(props.userId, { oldPassword: props.requireOld ? form.value.oldPassword : undefined, newPassword: form.value.newPassword });
    ElMessage.success('密码已更新');
    emit('done');
  } catch(e){
    ElMessage.error(e?.data?.error || '修改失败');
  } finally { loading.value=false; }
}
</script>
<style scoped>
.force-mask { position:fixed; inset:0; backdrop-filter: blur(4px); background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:9999; }
.dialog { width:480px; background:#fff; border-radius:16px; padding:28px 32px 24px; box-shadow:0 8px 28px rgba(0,0,0,.25); display:flex; flex-direction:column; gap:14px; }
.dialog h2 { margin:0; font-size:20px; font-weight:600; }
.hint { margin:0; font-size:13px; color:#606266; line-height:1.5; }
.actions { text-align:right; margin-top:4px; }
.strength { margin-top:4px; }
</style>

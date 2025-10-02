<template>
  <div class="recycle-bin">
    <div class="toolbar">
      <el-input v-model="search" placeholder="搜索客户名称/注册号/税号" clearable @clear="loadData" @keyup.enter="loadData" style="width:260px" />
      <el-button type="primary" @click="loadData" :loading="loading">刷新</el-button>
    </div>
    <el-empty v-if="!loading && items.length===0" description="暂无已删除客户" />
    <div v-else class="cards-grid">
      <div v-for="c in items" :key="c.id" class="entity-card deleted">
        <div class="card-header">
          <div class="title">{{ c.name }}</div>
          <el-dropdown @command="cmd=>handleCommand(cmd,c)">
            <span class="more-actions">⋮</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="restore">恢复</el-dropdown-item>
                <el-dropdown-item divided command="purge">彻底删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="meta">
          <div v-if="c.registration_no">注册号：{{ c.registration_no }}</div>
          <div v-if="c.tax_no">税号：{{ c.tax_no }}</div>
          <div>状态：<el-tag size="small" type="info">已删除</el-tag></div>
          <div class="deleted-time" v-if="c.deleted_at">删除时间：{{ formatTime(c.deleted_at) }}</div>
        </div>
        <div class="tags" v-if="c.tags && c.tags.length">
          <span v-for="t in c.tags.slice(0,4)" :key="t" class="tag-chip" :style="tagStyle(t)">{{ t }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const items = ref([]);
const loading = ref(false);
const search = ref('');

const loadData = async () => {
  loading.value = true;
  try {
    const qs = new URLSearchParams();
    if (search.value.trim()) qs.append('search', search.value.trim());
    qs.append('includeDeleted','1');
    const resp = await fetch(`/api/customers?${qs.toString()}`);
    const data = await resp.json();
    items.value = Array.isArray(data) ? data.filter(r=>r.deleted_at) : [];
  } catch (e) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const restoreItem = async (row) => {
  try {
    const resp = await fetch(`/api/customers/${row.id}/restore`, { method:'PATCH' });
    if (!resp.ok) throw new Error();
    ElMessage.success('已恢复');
    loadData();
  } catch {
    ElMessage.error('恢复失败');
  }
};

const purgeItem = async (row) => {
  try {
    await ElMessageBox.confirm(`确定彻底删除【${row.name}】? 此操作不可恢复`, '警告', { type:'warning' });
  } catch { return; }
  try {
    const resp = await fetch(`/api/customers/${row.id}?force=1`, { method:'DELETE' });
    if (!resp.ok) throw new Error();
    ElMessage.success('已彻底删除');
    loadData();
  } catch {
    ElMessage.error('操作失败');
  }
};

const handleCommand = (cmd, row) => {
  if (cmd==='restore') return restoreItem(row);
  if (cmd==='purge') return purgeItem(row);
};

// 复用标签颜色算法（与 Customers.vue 保持一致，可考虑抽取 util）
function hashHue(str){
  let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h) % 360;
}
function tagStyle(tag){
  const h = hashHue(tag);
  return { backgroundColor:`hsl(${h} 55% 50% / .15)`, border:`1px solid hsl(${h} 55% 50% / .4)`, color:`hsl(${h} 70% 30%)` };
}

function formatTime(ts){
  if(!ts) return ''; return ts.replace('T',' ').replace('Z','');
}
</script>

<style scoped>
.toolbar { display:flex; gap:12px; margin-bottom:16px; }
.cards-grid { display:grid; gap:16px; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); }
.entity-card { background:#fff; border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,.08); position:relative; display:flex; flex-direction:column; gap:8px; }
.entity-card.deleted { opacity:0.9; border:1px dashed #d3d3d3; }
.card-header { display:flex; justify-content:space-between; align-items:center; }
.title { font-weight:600; font-size:15px; }
.more-actions { cursor:pointer; padding:4px 6px; border-radius:4px; }
.more-actions:hover { background:#f0f2f5; }
.meta { font-size:12px; line-height:1.5; color:#606266; display:flex; flex-direction:column; gap:2px; }
.tags { display:flex; flex-wrap:wrap; gap:4px; }
.tag-chip { font-size:11px; padding:2px 6px; border-radius:10px; line-height:1.2; }
.deleted-time { font-size:11px; color:#909399; }
</style>

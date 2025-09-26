<template>
  <div class="settings-page">
    <div class="settings-container">
      <aside class="settings-aside">
        <el-menu default-active="general" class="el-menu-vertical" router>
          <el-menu-item index="general">常规设置</el-menu-item>
          <el-menu-item index="users">用户与权限</el-menu-item>
          <el-menu-item index="tenant">账套配置</el-menu-item>
          <el-menu-item index="appearance">外观</el-menu-item>
        </el-menu>
      </aside>

      <section class="settings-main">
        <h2>系统设置</h2>
        <div class="settings-content">
          <p>请选择左侧菜单项以显示对应设置界面（此处为占位）</p>
          <el-card>
            <div>示例：应用名称、公司信息、通知配置、第三方集成等。</div>
          </el-card>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// 基础占位页，实际表单与数据可在后续添加
</script>

<style scoped>
.settings-page { padding: 20px; }
.settings-container { display: flex; gap: 20px; }
.settings-aside { width: 220px; }
.settings-main { flex: 1; }
.settings-content { margin-top: 12px; }
</style>

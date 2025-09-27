<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background: #f5f7fa; border-right: 1px solid #e4e7ed;">
      <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="handleMenuSelect">
        <el-menu-item v-for="item in menuItems" :key="item.key" :index="item.key">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; box-shadow: 0 2px 8px #f0f1f2; display: flex; align-items: center; height: 64px;">
        <h2 style="margin:0">jinza管理系统</h2>
      </el-header>
      <el-main style="background: #f0f2f5; display: flex; justify-content: center; align-items: flex-start;">
        <el-card class="single-card" shadow="hover">
          <template v-if="activeMenu === 'account'">
            <AccountManager />
          </template>
          <template v-else>
            <div class="card-title">{{ currentCard.title }}</div>
            <div class="card-desc">{{ currentCard.desc }}</div>
          </template>
        </el-card>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { User, Setting, Tickets, OfficeBuilding, UserFilled, Document, ShoppingCart, Money } from '@element-plus/icons-vue'

import AccountManager from './components/AccountManager.vue'

const menuItems = [
  { key: 'account', label: '账套管理', icon: Setting },
  { key: 'user', label: '用户管理', icon: User },
  { key: 'customer', label: '客户管理', icon: OfficeBuilding },
  { key: 'supplier', label: '供应商管理', icon: UserFilled },
  { key: 'salesman', label: '业务员管理', icon: Tickets },
  { key: 'invoice', label: '开票', icon: Document },
  { key: 'purchase', label: '采购管理', icon: ShoppingCart },
  { key: 'payment', label: '收付管理', icon: Money },
]
const activeMenu = ref(menuItems[0].key)

const cards = {
  account: { title: '账套管理', desc: '管理账套信息，配置财务参数。' },
  user: { title: '用户管理', desc: '管理系统用户及权限。' },
  customer: { title: '客户管理', desc: '维护客户资料与往来信息。' },
  supplier: { title: '供应商管理', desc: '维护供应商资料与往来信息。' },
  salesman: { title: '业务员管理', desc: '管理业务员信息及业绩。' },
  invoice: { title: '开票', desc: '发票开具与管理。' },
  purchase: { title: '采购管理', desc: '采购流程与订单管理。' },
  payment: { title: '收付管理', desc: '收款与付款流程管理。' },
}
const currentCard = ref(cards[activeMenu.value])

function handleMenuSelect(key) {
  activeMenu.value = key
  currentCard.value = cards[key]
}
</script>

<style scoped>
.single-card {
  width: 400px;
  margin-top: 48px;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.06);
}
.card-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 12px;
}
.card-desc {
  color: #888;
  font-size: 16px;
}
</style>

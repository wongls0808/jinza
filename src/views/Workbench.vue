<template>
  <div class="workbench container">
    <div class="hero">
      <div class="welcome">{{ t('workbench.title') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>

    <!-- 高频操作置顶工具栏：匹配 / 结汇 / 付款 / 购汇（左对齐，独立卡片） -->
    <div class="hf-toolbar" role="toolbar" aria-label="High frequency actions" v-if="has('dashboard:quick_actions')">
      <div class="hf-row">
        <div class="hf-item info" role="button" tabindex="0" :aria-label="t('home.qaTransactions')" v-if="has('dashboard:action:match')" @click="go({ name: 'transactions' })" @keydown.enter.prevent="go({ name: 'transactions' })" @keydown.space.prevent="go({ name: 'transactions' })">
          <div class="hf-icon"><Tickets /></div>
          <div class="hf-label">{{ t('home.qaTransactions') }}</div>
        </div>
        <div class="hf-item primary" role="button" tabindex="0" :aria-label="t('home.qaSettlements')" v-if="has('dashboard:action:settle')" @click="openSettleDrawer()" @keydown.enter.prevent="openSettleDrawer()" @keydown.space.prevent="openSettleDrawer()">
          <div class="hf-icon"><Collection /></div>
          <div class="hf-label">{{ t('home.qaSettlements') }}</div>
        </div>
        <div class="hf-item success" role="button" tabindex="0" :aria-label="t('home.qaPayments')" v-if="has('dashboard:action:pay')" @click="openPayDrawer()" @keydown.enter.prevent="openPayDrawer()" @keydown.space.prevent="openPayDrawer()">
          <div class="hf-icon"><CreditCard /></div>
          <div class="hf-label">{{ t('home.qaPayments') }}</div>
        </div>
        <div class="hf-item warning" role="button" tabindex="0" :aria-label="t('home.qaFx')" v-if="has('dashboard:action:buyfx')" @click="openBuyDrawer()" @keydown.enter.prevent="openBuyDrawer()" @keydown.space.prevent="openBuyDrawer()">
          <div class="hf-icon"><Coin /></div>
          <div class="hf-label">{{ t('home.qaFx') }}</div>
        </div>
      </div>
    </div>

    <div class="quick" style="margin-top:8px; margin-bottom:8px; position: relative;" v-if="has('dashboard:navigation')">
      <el-card shadow="never" class="card--plain">
        <div class="card-grid single-row">
          <div
            v-for="it in quickActionsFiltered" :key="it.key"
            class="feature-card"
            role="button"
            :aria-label="it.label"
            tabindex="0"
            v-tilt="{ max: 8, scale: 1.02 }"
            @click="go({ name: it.route })"
            @keydown.enter.prevent="go({ name: it.route })"
            @keydown.space.prevent="go({ name: it.route })"
          >
            <div class="fc-icon">
              <component :is="it.icon" />
            </div>
            <div class="fc-texts">
              <div class="fc-title">{{ it.label }}</div>
              <!-- 描述词已移除 -->
            </div>
            <div class="fc-arrow">›</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 6 张固定指标卡：仅标题 + 合计金额，点击查看明细 -->
    <div class="kpi6-grid" v-if="has('view_dashboard')">
      <div class="kpi-card theme-success" role="button" tabindex="0" @click="openStat('cusMYR')" @keydown.enter.prevent="openStat('cusMYR')" @keydown.space.prevent="openStat('cusMYR')">
        <el-tooltip v-if="has('dashboard:kpi:customer_balance_myr')" :content="t('workbench.countTooltip', { n: stats.lists.cusMYR.length })" placement="top">
          <span class="kpi-count">{{ stats.lists.cusMYR.length }}</span>
        </el-tooltip>
  <div class="kpi-title">{{ t('workbench.kpis.cusMYR') }}</div>
        <div class="kpi-value" v-if="has('dashboard:kpi:customer_balance_myr')">{{ money(stats.totals.cusMYR) }}</div>
      </div>
      <div class="kpi-card theme-warning" role="button" tabindex="0" @click="openStat('cusCNY')" @keydown.enter.prevent="openStat('cusCNY')" @keydown.space.prevent="openStat('cusCNY')">
        <el-tooltip v-if="has('dashboard:kpi:customer_balance_cny')" :content="t('workbench.countTooltip', { n: stats.lists.cusCNY.length })" placement="top">
          <span class="kpi-count">{{ stats.lists.cusCNY.length }}</span>
        </el-tooltip>
  <div class="kpi-title">{{ t('workbench.kpis.cusCNY') }}</div>
        <div class="kpi-value" v-if="has('dashboard:kpi:customer_balance_cny')">{{ money(stats.totals.cusCNY) }}</div>
      </div>
      <div class="kpi-card theme-primary" role="button" tabindex="0" @click="openStat('bankMYR')" @keydown.enter.prevent="openStat('bankMYR')" @keydown.space.prevent="openStat('bankMYR')">
        <el-tooltip v-if="has('dashboard:kpi:bank_balance_myr')" :content="t('workbench.countTooltip', { n: stats.lists.bankMYR.length })" placement="top">
          <span class="kpi-count">{{ stats.lists.bankMYR.length }}</span>
        </el-tooltip>
  <div class="kpi-title">{{ t('workbench.kpis.bankMYR') }}</div>
        <div class="kpi-value" v-if="has('dashboard:kpi:bank_balance_myr')">{{ money(stats.totals.bankMYR) }}</div>
      </div>
      <div class="kpi-card theme-info" role="button" tabindex="0" @click="openStat('payCNY')" @keydown.enter.prevent="openStat('payCNY')" @keydown.space.prevent="openStat('payCNY')">
        <el-tooltip v-if="has('dashboard:kpi:payable_cny')" :content="t('workbench.countTooltip', { n: stats.lists.payCNY.length })" placement="top">
          <span class="kpi-count">{{ stats.lists.payCNY.length }}</span>
        </el-tooltip>
  <div class="kpi-title">{{ t('workbench.kpis.payCNY') }}</div>
        <div class="kpi-value" v-if="has('dashboard:kpi:payable_cny')">{{ money(stats.totals.payCNY) }}</div>
      </div>
      <div class="kpi-card theme-success" role="button" tabindex="0" @click="openStat('exchMYR')" @keydown.enter.prevent="openStat('exchMYR')" @keydown.space.prevent="openStat('exchMYR')">
        <el-tooltip v-if="has('dashboard:kpi:exchangeable_myr')" :content="t('workbench.countTooltip', { n: stats.lists.exchMYR.length })" placement="top">
          <span class="kpi-count">{{ stats.lists.exchMYR.length }}</span>
        </el-tooltip>
  <div class="kpi-title">{{ t('workbench.kpis.exchMYR') }}</div>
        <div class="kpi-value" v-if="has('dashboard:kpi:exchangeable_myr')">{{ money(stats.totals.exchMYR) }}</div>
      </div>
      <div class="kpi-card theme-danger" role="button" tabindex="0" @click="openStat('pendingCNY')" @keydown.enter.prevent="openStat('pendingCNY')" @keydown.space.prevent="openStat('pendingCNY')">
        <el-tooltip v-if="has('dashboard:kpi:paying_cny')" :content="t('workbench.countTooltip', { n: stats.lists.pendingCNY.length })" placement="top">
          <span class="kpi-count">{{ stats.lists.pendingCNY.length }}</span>
        </el-tooltip>
  <div class="kpi-title">{{ t('workbench.kpis.pendingCNY') }}</div>
        <div class="kpi-value" v-if="has('dashboard:kpi:paying_cny')">{{ money(stats.totals.pendingCNY) }}</div>
      </div>
      <!-- 新增：未匹配交易（统一为KPI卡片，加入同一网格） -->
      <div class="kpi-card theme-danger" role="button" tabindex="0" v-if="has('dashboard:kpi:unmatched_txn')" @click="goToPendingTx" @keydown.enter.prevent="goToPendingTx" @keydown.space.prevent="goToPendingTx">
  <el-tooltip :content="`${t('workbench.kpis.unmatched')} ${unmatchedCount} / ${t('common.total')} ${totalTx}`" placement="top">
          <span class="kpi-count">{{ unmatchedCount }}</span>
        </el-tooltip>
  <div class="kpi-title">{{ t('workbench.kpis.unmatched') }}</div>
        <div class="kpi-value">{{ unmatchedCount.toLocaleString() }}</div>
      </div>
    </div>

    <!-- 服务器监控入口从独立区域移动到任务栏（filters）右侧，保留抽屉详情 -->

    <!-- 统计图形区域：时间筛选 + 6 张图形卡（迷你柱状条） -->
  <div class="filters" v-if="has('dashboard:navigation')">
      <el-popover
        v-model:visible="datePopover"
        placement="bottom-start"
        :width="360"
        trigger="click"
        popper-class="wb-date-popover"
        :teleported="false">
        <div class="date-pop-content" @click.stop>
          <el-date-picker
            v-model="range"
            type="daterange"
            unlink-panels
            :editable="false"
            :teleported="false"
          />
          <div class="date-pop-ops">
            <el-button size="small" @click="onDateClear">{{ t('workbench.filters.clear') }}</el-button>
            <el-button size="small" type="primary" @click="onDateApply">{{ t('workbench.filters.apply') }}</el-button>
          </div>
        </div>
        <template #reference>
          <el-button size="small" circle :type="dateBtnType" :title="dateRangeLabel">
            <el-icon><Calendar /></el-icon>
          </el-button>
        </template>
      </el-popover>
      <el-radio-group v-model="quick" size="small" @change="onQuick">
        <el-radio-button label="30d">{{ t('workbench.filters.last30d') }}</el-radio-button>
        <el-radio-button label="6m">{{ t('workbench.filters.last6m') }}</el-radio-button>
        <el-radio-button label="y">{{ t('workbench.filters.thisYear') }}</el-radio-button>
      </el-radio-group>
      <el-button size="small" @click="clearFilters">{{ t('workbench.filters.clear') }}</el-button>
  <div class="monitor-bar" v-if="has('dashboard:server_monitor')" role="button" @click="openMonitor" :title="t('workbench.monitor.title')">
        <div class="mb-item">
          <span class="mb-label">CPU</span>
          <el-progress :percentage="monitorCpuPct" :stroke-width="6" :color="cpuColor" :text-inside="false" />
        </div>
        <div class="mb-item">
          <span class="mb-label">MEM</span>
          <el-progress :percentage="monitorMemPct" :stroke-width="6" :color="memColor" :text-inside="false" />
        </div>
        <div class="mb-item">
          <span class="mb-label">DB</span>
          <el-progress :percentage="monitorDbPct" :stroke-width="6" :color="dbColor" :text-inside="false" />
        </div>
      </div>
    </div>
    <div class="kpi6-grid">
      <div v-if="has('dashboard:total:transactions_debit')" class="kpi-card theme-primary" role="button" tabindex="0" @click="openDetail('tx-debit')" @keydown.enter.prevent="openDetail('tx-debit')" @keydown.space.prevent="openDetail('tx-debit')">
        <div class="kpi-title">{{ t('workbench.charts.transactionsDebit') }}</div>
        <div class="kpi-value">{{ money(summary.transactions.debit) }}</div>
      </div>
      <div v-if="has('dashboard:total:transactions_credit')" class="kpi-card theme-success" role="button" tabindex="0" @click="openDetail('tx-credit')" @keydown.enter.prevent="openDetail('tx-credit')" @keydown.space.prevent="openDetail('tx-credit')">
        <div class="kpi-title">{{ t('workbench.charts.transactionsCredit') }}</div>
        <div class="kpi-value">{{ money(summary.transactions.credit) }}</div>
      </div>
      <div v-if="has('dashboard:total:settlements')" class="kpi-card theme-info" role="button" tabindex="0" @click="openDetail('settle')" @keydown.enter.prevent="openDetail('settle')" @keydown.space.prevent="openDetail('settle')">
        <div class="kpi-title">{{ t('workbench.charts.settlementsTotal') }}</div>
        <div class="kpi-value">{{ money(summary.settlements.base) }}</div>
      </div>
      <div v-if="has('dashboard:total:buyfx')" class="kpi-card theme-warning" role="button" tabindex="0" @click="openDetail('buy')" @keydown.enter.prevent="openDetail('buy')" @keydown.space.prevent="openDetail('buy')">
        <div class="kpi-title">{{ t('workbench.charts.buyfxTotal') }}</div>
        <div class="kpi-value">{{ money(summary.buyfx.total) }}</div>
      </div>
      <div v-if="has('dashboard:total:payments')" class="kpi-card theme-danger" role="button" tabindex="0" @click="openDetail('pay')" @keydown.enter.prevent="openDetail('pay')" @keydown.space.prevent="openDetail('pay')">
        <div class="kpi-title">{{ t('workbench.charts.paymentsTotal') }}</div>
        <div class="kpi-value">{{ money(summary.payments.total) }}</div>
      </div>
      <div v-if="has('dashboard:total:expenses')" class="kpi-card theme-warning" role="button" tabindex="0" @click="openDetail('exp')" @keydown.enter.prevent="openDetail('exp')" @keydown.space.prevent="openDetail('exp')">
        <div class="kpi-title">{{ t('workbench.charts.expensesTotal') }}</div>
        <div class="kpi-value">{{ money(summary.expenses.total) }}</div>
      </div>
    </div>

    <!-- 可拖拽的“付款待审”浮动按钮（持久化位置） -->
    <div
      class="floating-payments"
      :style="fabStyle"
      role="button"
      :aria-label="t('workbench.todos.payments')"
      v-if="has('dashboard:pending_pay_approval')"
      @mousedown="onFabDown"
      @touchstart="onFabDown"
      @click="onFabClick"
    >
      <el-badge :value="paymentsCount" :max="99" type="danger">
        <div class="fp-btn">
          <CreditCard />
        </div>
      </el-badge>
    </div>

    <!-- 付款待审抽屉列表（含审核操作） -->
  <el-drawer v-model="paymentsDrawer" :title="t('workbench.todos.payments')" size="min(980px, 90vw)">
      <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center; flex-wrap: wrap;">
  <el-select v-model="batch.platform_id" :placeholder="t('transactions.selectPlatform')" size="small" style="min-width:240px; max-width:300px;" filterable>
          <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name + (p.fee_percent!=null? ` (${t('workbench.preview.feePercent')} ${Number(p.fee_percent||0).toFixed(4)}%)` : '')" />
        </el-select>
  <el-button :disabled="!has('manage_fx') || !batch.platform_id || !multipleSelection.length || !canBatchApprove" type="success" size="small" @click="doBatchApprove">{{ t('common.approve') }}</el-button>
  <el-button size="small" type="primary" @click="loadPaymentsList">{{ t('common.refresh') }}</el-button>
      </div>
      <!-- 余额预览（批量） -->
      <div v-if="selectedPlatform" class="preview-card">
        <div class="row">
          <div class="cell head">{{ t('workbench.preview.feePercent') }}</div>
          <div class="cell">{{ Number(selectedPlatform.fee_percent||0).toFixed(4) }}%</div>
        </div>
        <div class="row">
          <div class="cell head">{{ t('workbench.preview.currency') }}</div>
          <div class="cell">USD</div>
          <div class="cell">MYR</div>
          <div class="cell">CNY</div>
        </div>
        <div class="row">
          <div class="cell head">{{ t('workbench.preview.availableBalance') }}</div>
          <div class="cell mono">{{ money(Number(selectedPlatform.balance_usd||0)) }}</div>
          <div class="cell mono">{{ money(Number(selectedPlatform.balance_myr||0)) }}</div>
          <div class="cell mono">{{ money(Number(selectedPlatform.balance_cny||0)) }}</div>
        </div>
        <div class="row">
          <div class="cell head">{{ t('workbench.preview.orderDeduction') }}</div>
          <div class="cell mono warn" :class="{ danger: need.USD>0 && after.USD<0 }">{{ money(need.USD) }}</div>
          <div class="cell mono warn" :class="{ danger: need.MYR>0 && after.MYR<0 }">{{ money(need.MYR) }}</div>
          <div class="cell mono warn" :class="{ danger: need.CNY>0 && after.CNY<0 }">{{ money(need.CNY) }}</div>
        </div>
        <div class="row">
          <div class="cell head">{{ t('workbench.preview.balanceAfter') }}</div>
          <div class="cell mono" :class="{ danger: after.USD<0 }">{{ money(after.USD) }}</div>
          <div class="cell mono" :class="{ danger: after.MYR<0 }">{{ money(after.MYR) }}</div>
          <div class="cell mono" :class="{ danger: after.CNY<0 }">{{ money(after.CNY) }}</div>
        </div>
      </div>
      <el-table :data="payments" size="small" border v-loading="paymentsLoading" :default-sort="{ prop: 'pay_date', order: 'ascending' }" @selection-change="onSelectionChange" @header-dragend="onColResizePay">
        <el-table-column type="selection" column-key="__sel" :width="colWPay('__sel', 46)" />
        <el-table-column type="index" column-key="__idx" :label="t('common.no')" :width="colWPay('__idx', 60)" />
  <el-table-column prop="pay_date" :label="t('fx.payDate')" :width="colWPay('pay_date', 120)">
          <template #default="{ row }">{{ fmtDate(row.pay_date) }}</template>
        </el-table-column>
  <el-table-column prop="bill_no" :label="t('common.billNo')" :width="colWPay('bill_no', 200)" />
  <el-table-column prop="customer_name" :label="t('common.customer')" :width="colWPay('customer_name', 180)" />
  <el-table-column :label="t('transactions.bankName')" column-key="bank" :width="colWPay('bank', 160)">
          <template #default="{ row }">
            <div style="display:flex; align-items:center; gap:6px;">
              <img v-if="row.bank_code" :src="bankImg(row.bank_code)" :alt="row.bank_code" style="height:16px; width:auto; object-fit:contain;" @error="onBankImgErr($event)" />
              <span>{{ row.bank_name || row.bank_code || '-' }}</span>
            </div>
          </template>
        </el-table-column>
  <el-table-column prop="total_amount" :label="t('common.amount')" :width="colWPay('total_amount', 140)" align="right">
          <template #default="{ row }">{{ money(row.total_amount) }}</template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" column-key="ops" :width="colWPay('ops', 420)" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openTodo(row)">{{ t('common.view') }}</el-button>
            <el-button v-if="has('manage_fx') && row.status==='pending'" size="small" type="success" @click="openApprove(row)">{{ t('common.approve') }}</el-button>
            <el-button v-if="has('manage_fx') && row.status==='completed'" size="small" type="warning" @click="doUnapprove(row)">{{ t('common.revoke') }}</el-button>
            <template v-if="has('delete_fx') && row.status==='pending'">
              <el-popconfirm :title="t('common.confirmDelete')" @confirm="rejectPayment(row)">
                <template #reference>
                  <el-button size="small" type="danger">{{ t('common.reject') }}</el-button>
                </template>
              </el-popconfirm>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 快捷操作：结汇抽屉 -->
    <el-drawer v-model="settleDrawer.visible" :title="t('home.qaSettlements')" size="50%">
      <FXManagement ref="settleRef" mode="settle" :in-drawer="true" :initial-settle-customer-id="settlePrefillCustomerId" @settlementCreated="onSettlementCreated" />
    </el-drawer>
    <!-- 快捷操作：付款抽屉 -->
    <el-drawer v-model="payDrawer.visible" :title="t('home.qaPayments')" size="50%">
      <FXManagement ref="payRef" mode="pay" :in-drawer="true" :initial-pay-customer-id="payPrefillCustomerId" @paymentCreated="onPaymentCreated" />
    </el-drawer>
    <!-- 快捷操作：购汇抽屉 -->
    <el-drawer v-model="buyDrawer.visible" :title="t('home.qaFx')" size="520px">
      <BuyFX :manage="false" :compact="true" />
    </el-drawer>

    <!-- 付款单明细抽屉 -->
  <el-drawer v-model="todoDrawer" :title="t('workbench.todos.payments')" size="900px">
      <div v-if="todoDetail">
        <div class="todo-head">
          <div>{{ t('common.billNo') }}：{{ todoDetail.bill_no || ('Payment-' + todoDetail.id) }}</div>
          <div>{{ t('common.customer') }}：{{ todoDetail.customer_name }}</div>
          <div>{{ t('common.date') }}：{{ fmtDate(todoDetail.pay_date) }}</div>
        </div>
        <el-table :data="todoDetail.items || []" border size="small" height="50vh" @header-dragend="onColResizeTodo">
          <el-table-column type="index" column-key="__idx" :label="t('common.no')" :width="colWTodo('__idx', 60)" />
          <el-table-column prop="account_name" :label="t('accounts.fields.accountName')" :width="colWTodo('account_name', 180)" />
          <el-table-column prop="bank_account" :label="t('accounts.fields.bankAccount')" :width="colWTodo('bank_account', 200)" />
          <el-table-column :label="t('transactions.bankName')" column-key="bank" :width="colWTodo('bank', 180)">
            <template #default="{ row }">
              <div style="display:flex; align-items:center; gap:8px;">
                <img v-if="row.bank_code" :src="bankImg(row.bank_code)" :alt="row.bank_code" style="height:16px; width:auto; object-fit:contain;" @error="onBankImgErr($event)" />
                <span>{{ row.bank_name || row.bank_code || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="currency_code" :label="t('transactions.currency')" :width="colWTodo('currency_code', 120)" />
          <el-table-column prop="amount" :label="t('common.amount')" :width="colWTodo('amount', 140)" align="right">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    

    <!-- 审核弹窗：选择平台并预览余额 -->
    <el-dialog v-model="approveDialog.visible" :title="t('workbench.approveDialogTitle')" width="min(560px, 90vw)">
      <el-form :label-width="$i18n.locale === 'zh' ? '100px' : '120px'">
        <el-form-item :label="t('buyfx.platform')">
          <el-select v-model="approveDialog.platform_id" filterable :placeholder="t('transactions.selectPlatform')" style="min-width: 260px; max-width: 100%;">
            <el-option v-for="p in platforms" :key="p.id" :value="p.id" :label="p.name" />
          </el-select>
        </el-form-item>
        <el-alert v-if="approveDialog.platform_id" type="info" :closable="false" show-icon>
          {{ t('workbench.preview.orderDeduction') }}
        </el-alert>
        <div v-if="selectedPlatformSingle" class="preview-card" style="margin-top:8px;">
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.feePercent') }}</div>
            <div class="cell">{{ Number(selectedPlatformSingle.fee_percent||0).toFixed(4) }}%</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.currency') }}</div>
            <div class="cell">USD</div>
            <div class="cell">MYR</div>
            <div class="cell">CNY</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.availableBalance') }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_usd||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_myr||0)) }}</div>
            <div class="cell mono">{{ money(Number(selectedPlatformSingle.balance_cny||0)) }}</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.orderDeduction') }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.USD>0 && afterSingle.USD<0 }">{{ money(needSingle.USD) }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.MYR>0 && afterSingle.MYR<0 }">{{ money(needSingle.MYR) }}</div>
            <div class="cell mono warn" :class="{ danger: needSingle.CNY>0 && afterSingle.CNY<0 }">{{ money(needSingle.CNY) }}</div>
          </div>
          <div class="row">
            <div class="cell head">{{ t('workbench.preview.balanceAfter') }}</div>
            <div class="cell mono" :class="{ danger: afterSingle.USD<0 }">{{ money(afterSingle.USD) }}</div>
            <div class="cell mono" :class="{ danger: afterSingle.MYR<0 }">{{ money(afterSingle.MYR) }}</div>
            <div class="cell mono" :class="{ danger: afterSingle.CNY<0 }">{{ money(afterSingle.CNY) }}</div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="approveDialog.visible=false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!canApproveSingle" :loading="approveDialog.loading" @click="confirmApprove">{{ t('common.ok') }}</el-button>
      </template>
    </el-dialog>

  <!-- 审核日志抽屉 -->
  <el-drawer v-model="auditDrawer.visible" :title="t('workbench.auditLog')" size="720px">
      <el-table :data="auditRows" size="small" border @header-dragend="onColResizeAudit">
        <el-table-column type="index" column-key="idx" :label="t('common.no')" :width="colWAudit('idx', 60)" />
  <el-table-column prop="acted_at" column-key="acted_at" :label="t('common.date')" :width="colWAudit('acted_at', 170)" />
  <el-table-column prop="action" column-key="action" :label="t('buyfx.action')" :width="colWAudit('action', 110)" />
  <el-table-column prop="platform_name" column-key="platform_name" :label="t('buyfx.platform')" :width="colWAudit('platform_name', 160)" />
  <el-table-column column-key="fee" :label="t('workbench.preview.feePercent')" :width="colWAudit('fee', 120)" align="right">
          <template #default="{ row }">{{ money(row.fee_amount) }} ({{ row.fee_percent }}%)</template>
        </el-table-column>
  <el-table-column column-key="deltas" :label="t('workbench.deductionDetails')" :width="colWAudit('deltas', 320)">
          <template #default="{ row }">
            <div v-if="row.deltas">
              <div v-for="(v, k) in row.deltas" :key="k">{{ k }}：{{ t('common.amount') }} {{ money(v.amount) }}，{{ t('buyfx.fee') }} {{ money(v.fee) }}，{{ t('common.total') }} {{ money(v.total) }}</div>
            </div>
          </template>
        </el-table-column>
  <el-table-column prop="acted_by_name" column-key="acted_by_name" :label="t('common.createdBy')" :width="colWAudit('acted_by_name', 140)" />
      </el-table>
    </el-drawer>

    <!-- 统计明细抽屉（查看被计入的数据） -->
  <el-drawer v-model="detailDrawer.visible" :title="detailDrawer.title" :size="detailDrawerSize">
      <el-table :data="detailDrawer.rows" size="small" border v-loading="detailDrawer.loading" @header-dragend="onColResizeDetail">
        <!-- 交易明细(借)：交易日期/账号/账户名称/借方金额 -->
        <template v-if="detailDrawer.type==='tx-debit'">
          <el-table-column prop="trn_date" column-key="trn_date" :label="t('common.date')" :width="colWDetail('trn_date', 120)" />
          <el-table-column prop="account_number" column-key="account_number" :label="t('accounts.fields.bankAccount')" :width="colWDetail('account_number', 180)" />
          <el-table-column prop="account_name" column-key="account_name" :label="t('accounts.fields.accountName')" :width="colWDetail('account_name', 220)" />
          <el-table-column prop="debit" column-key="debit" :label="t('common.debit')" :width="colWDetail('debit', 140)" align="right">
            <template #default="{ row }">{{ money(row.debit) }}</template>
          </el-table-column>
        </template>
        <!-- 交易明细(贷)：交易日期/账号/账户名称/贷方金额 -->
        <template v-else-if="detailDrawer.type==='tx-credit'">
          <el-table-column prop="trn_date" column-key="trn_date" :label="t('common.date')" :width="colWDetail('trn_date', 120)" />
          <el-table-column prop="account_number" column-key="account_number" :label="t('accounts.fields.bankAccount')" :width="colWDetail('account_number', 180)" />
          <el-table-column prop="account_name" column-key="account_name" :label="t('accounts.fields.accountName')" :width="colWDetail('account_name', 220)" />
          <el-table-column prop="credit" column-key="credit" :label="t('common.credit')" :width="colWDetail('credit', 140)" align="right">
            <template #default="{ row }">{{ money(row.credit) }}</template>
          </el-table-column>
        </template>
        <!-- 结汇明细：日期/单号/客户/基金额(MYR) -->
        <template v-else-if="detailDrawer.type==='settle'">
          <el-table-column prop="settle_date" column-key="settle_date" :label="t('common.date')" :width="colWDetail('settle_date', 130)">
            <template #default="{ row }">{{ fmtDate(row.settle_date) }}</template>
          </el-table-column>
          <el-table-column prop="bill_no" column-key="bill_no" :label="t('common.billNo')" :width="colWDetail('bill_no', 160)" />
          <el-table-column prop="customer_name" column-key="customer_name" :label="t('common.customer')" :width="colWDetail('customer_name', 240)" />
          <el-table-column prop="total_base" column-key="total_base" :label="t('workbench.charts.selectedTotalMYR')" :width="colWDetail('total_base', 160)" align="right">
            <template #default="{ row }">{{ money(row.total_base) }}</template>
          </el-table-column>
        </template>
        <!-- 购汇转换：日期/平台/卖出金额/买入金额(MYR) -->
        <template v-else-if="detailDrawer.type==='buy'">
          <el-table-column prop="created_at" column-key="created_at" :label="t('common.date')" :width="colWDetail('created_at', 170)" />
          <el-table-column prop="platform_name" column-key="platform_name" :label="t('buyfx.platform')" :width="colWDetail('platform_name', 220)" />
          <el-table-column prop="amount_from" column-key="amount_from" :label="t('buyfx.sellAmount')" :width="colWDetail('amount_from', 160)" align="right">
            <template #default="{ row }">{{ money(row.amount_from) }} {{ row.from_currency }}</template>
          </el-table-column>
          <el-table-column prop="amount_to" column-key="amount_to" :label="t('buyfx.buyAmount')" :width="colWDetail('amount_to', 160)" align="right">
            <template #default="{ row }">{{ money(row.amount_to) }} {{ row.to_currency }}</template>
          </el-table-column>
        </template>
        <!-- 付款单历史明细：付款日期/单号/客户/账户名称/银行/银行账户/金额 -->
        <template v-else-if="detailDrawer.type==='pay'">
          <el-table-column prop="pay_date" column-key="pay_date" :label="t('fx.payDate')" :width="colWDetail('pay_date', 130)">
            <template #default="{ row }">{{ fmtDate(row.pay_date) }}</template>
          </el-table-column>
          <el-table-column prop="bill_no" column-key="bill_no" :label="t('common.billNo')" :width="colWDetail('bill_no', 160)" />
          <el-table-column prop="customer_name" column-key="customer_name" :label="t('common.customer')" :width="colWDetail('customer_name', 240)" />
          <el-table-column prop="account_name" column-key="account_name" :label="t('accounts.fields.accountName')" :width="colWDetail('account_name', 220)" />
          <el-table-column prop="bank_name" column-key="bank_name" :label="t('transactions.bankName')" :width="colWDetail('bank_name', 160)" />
          <el-table-column prop="bank_account" column-key="bank_account" :label="t('accounts.fields.bankAccount')" :width="colWDetail('bank_account', 180)" />
          <el-table-column prop="amount" column-key="amount" :label="t('common.amount')" :width="colWDetail('amount', 140)" align="right">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </template>
        <!-- 费用借贷报表：项目/借/贷/净额 -->
        <template v-else-if="detailDrawer.type==='exp'">
          <el-table-column prop="description" column-key="description" :label="t('expenses.description')" :width="colWDetail('description', 280)">
            <template #default="{ row }">{{ row.description }}<span v-if="row.drcr">（{{ row.drcr==='debit'? t('common.debit'): t('common.credit') }}）</span></template>
          </el-table-column>
          <el-table-column prop="debit_total" column-key="debit_total" :label="t('expenses.columns.debit')" :width="colWDetail('debit_total', 140)" align="right">
            <template #default="{ row }">{{ money(row.debit_total) }}</template>
          </el-table-column>
          <el-table-column prop="credit_total" column-key="credit_total" :label="t('expenses.columns.credit')" :width="colWDetail('credit_total', 140)" align="right">
            <template #default="{ row }">{{ money(row.credit_total) }}</template>
          </el-table-column>
          <el-table-column prop="net" column-key="net" :label="t('expenses.summary.net')" :width="colWDetail('net', 160)" align="right">
            <template #default="{ row }">{{ money(row.net) }}</template>
          </el-table-column>
        </template>
      </el-table>
      <div v-if="detailDrawer.type==='pay'" class="kpi-sub" style="margin-top:8px;">{{ t('workbench.notePaymentsDetail') }}</div>
    </el-drawer>

    <!-- KPI 列表抽屉（客户余额/银行余额/平台余额/待付余额等） -->
  <el-drawer v-model="statDrawer.visible" :title="statDrawer.title" size="560px">
      <el-table :data="statDrawer.rows" size="small" border>
        <el-table-column type="index" :label="t('common.no')" width="60" />
        <el-table-column prop="label" :label="t('common.name')" />
        <el-table-column prop="value" :label="t('common.amount')" width="160" align="right">
          <template #default="{ row }">{{ money(row.value) }}</template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 服务器监控抽屉 -->
  <el-drawer v-model="monitor.visible" :title="t('workbench.monitor.title')" size="560px">
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap;">
        <el-button size="small" type="primary" @click="loadMonitor">{{ t('workbench.monitor.refresh') }}</el-button>
        <el-switch v-model="monitor.auto" :active-text="t('workbench.monitor.autoRefresh')" />
      </div>
      <el-table :data="monitorRows" size="small" border v-loading="monitor.loading" @header-dragend="onColResizeMonitor">
        <el-table-column type="index" column-key="__idx" :label="t('common.no')" :width="colWMonitor('__idx', 60)" />
        <el-table-column prop="name" column-key="name" :label="t('workbench.monitor.labelMetric')" :width="colWMonitor('name', 220)" />
        <el-table-column prop="value" column-key="value" :label="t('workbench.monitor.labelValue')" :width="colWMonitor('value', 240)" />
        <el-table-column prop="status" column-key="status" :label="t('workbench.monitor.statusLabel')" :width="colWMonitor('status', 140)">
          <template #default="{ row }">
            <el-tag v-if="row.tag" :type="row.tag">{{ row.status }}</el-tag>
            <span v-else>{{ row.status || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted, watch } from 'vue'
import { api, request as httpRequest } from '@/api'
import { ElMessage } from 'element-plus'
// 指标图无需 echarts
import { useTableMemory } from '@/composables/useTableMemory'
import FXManagement from './FXManagement.vue'
import BuyFX from './BuyFX.vue'

const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()
// 表格列宽记忆（付款待审列表 / 付款明细表）
const { colW: colWPay, onColResize: onColResizePay } = useTableMemory('wb-payments')
const { colW: colWTodo, onColResize: onColResizeTodo } = useTableMemory('wb-todo')
// 审核日志抽屉列宽记忆
const { colW: colWAudit, onColResize: onColResizeAudit } = useTableMemory('wb-audit')
// 统计明细抽屉列宽记忆（按类型区分命名空间）
// 注意：detailDrawer 需在下方函数首次访问前定义，避免 TDZ 错误
const detailDrawer = ref({ visible: false, title: '', type: '', loading: false, rows: [] })
function detailMemKey(){ return `wb-detail:${detailDrawer.type || 'unknown'}` }
let _detailMem = useTableMemory(detailMemKey())
function refreshDetailMem(){ _detailMem = useTableMemory(detailMemKey()) }
const colWDetail = (col, def) => _detailMem.colW(col, def)
const onColResizeDetail = (nw, ow, col, evt) => _detailMem.onColResize(nw, ow, col, evt)
// 明细抽屉动态宽度：借/贷/结汇/购汇为40%，费用为50%，其他默认60%
const detailDrawerSize = computed(() => {
  const tp = detailDrawer.value.type
  if (tp === 'tx-debit' || tp === 'tx-credit' || tp === 'settle' || tp === 'buy') return '40%'
  if (tp === 'exp') return '50%'
  return '60%'
})

// 服务器监控列宽记忆
const { colW: colWMonitor, onColResize: onColResizeMonitor } = useTableMemory('wb-monitor')

// —— 计算图形：聚合汇总 ——
const summary = ref({
  transactions: { debit: 0, credit: 0 },
  settlements: { base: 0, settled: 0 },
  buyfx: { total: 0 },
  payments: { total: 0 },
  expenses: { total: 0 },
})
const range = ref(null)
const quick = ref('')
const datePopover = ref(false)
const dateRangeLabel = computed(() => {
  if (!Array.isArray(range.value) || !range.value[0] || !range.value[1]) return `${t('common.startDate')} ~ ${t('common.endDate')}`
  const s = fmtYmd(range.value[0]); const e = fmtYmd(range.value[1])
  return `${s} ~ ${e}`
})
const dateBtnType = computed(() => {
  if (datePopover.value) return 'primary' // 打开时高亮
  if (Array.isArray(range.value) && range.value[0] && range.value[1]) return 'success' // 已选择范围
  if (quick.value) return 'warning' // 使用快捷筛选
  return '' // 默认
})
function fmtYmd(d){ try { return d.toISOString().slice(0,10) } catch { return '' } }
async function loadSummary(){
  try {
    const params = new URLSearchParams()
    if (Array.isArray(range.value) && range.value[0] && range.value[1]) { params.set('startDate', fmtYmd(range.value[0])); params.set('endDate', fmtYmd(range.value[1])) }
    const r = await httpRequest(`/workbench/summary?${params.toString()}`)
    summary.value = {
      transactions: { debit: Number(r?.transactions?.debit||0), credit: Number(r?.transactions?.credit||0) },
      settlements: { base: Number(r?.settlements?.base||0), settled: Number(r?.settlements?.settled||0) },
      buyfx: { total: Number(r?.buyfx?.total||0) },
      payments: { total: Number(r?.payments?.total||0) },
      expenses: { total: Number(r?.expenses?.total||0) },
    }
  } catch {}
}
function onQuick(){
  const now = new Date()
  let s=null, e=null
  if (quick.value==='30d') { e = now; s = new Date(now); s.setDate(now.getDate()-30) }
  else if (quick.value==='6m') { e = now; s = new Date(now); s.setMonth(now.getMonth()-6) }
  else if (quick.value==='y') { e = now; s = new Date(now.getFullYear(),0,1) }
  else { range.value = null; return loadSummary() }
  range.value = [s, e]
  loadSummary()
}
function clearFilters(){ quick.value=''; range.value=null; loadSummary() }
function onDateApply(){
  if (Array.isArray(range.value) && range.value[0] && range.value[1]) {
    datePopover.value = false
    quick.value = ''
    loadSummary()
    // 同步刷新统计区
    loadStats()
  }
}
function onDateClear(){
  range.value = null
  quick.value = ''
  datePopover.value = false
  loadSummary()
  loadStats()
}
// 图形区域仅显示合计，不提供明细抽屉（声明已提前放置于顶部以供列宽记忆使用）
async function openDetail(type){
  // 切换列宽记忆空间到当前明细类型
  detailDrawer.value.type = type
  refreshDetailMem()
  const params = new URLSearchParams()
  if (Array.isArray(range.value) && range.value[0] && range.value[1]) { params.set('startDate', fmtYmd(range.value[0])); params.set('endDate', fmtYmd(range.value[1])) }
  detailDrawer.value = { visible: true, title: '', type, loading: true, rows: [] }
  try {
    if (type === 'tx-debit' || type === 'tx-credit') {
      detailDrawer.value.title = type==='tx-debit' ? t('workbench.charts.transactionsDebit') : t('workbench.charts.transactionsCredit')
      // 根据筛选时间拉取部分数据（不分页，前500条）
      const list = await api.transactions.list({ startDate: params.get('startDate')||'', endDate: params.get('endDate')||'', page: 1, pageSize: 500, sort: 'transaction_date', order: 'asc' })
      const rows = Array.isArray(list?.data) ? list.data : (Array.isArray(list?.items) ? list.items : Array.isArray(list) ? list : [])
      const shaped = rows.map(r => ({
        trn_date: r.trn_date || r.transaction_date,
        account_number: r.account_number,
        account_name: r.account_name,
        debit: Number(r.debit_amount||r.debit||0),
        credit: Number(r.credit_amount||r.credit||0)
      }))
      detailDrawer.value.rows = (type==='tx-debit')
        ? shaped.filter(x => x.debit > 0).map(x => ({ trn_date: x.trn_date, account_number: x.account_number, account_name: x.account_name, debit: x.debit }))
        : shaped.filter(x => x.credit > 0).map(x => ({ trn_date: x.trn_date, account_number: x.account_number, account_name: x.account_name, credit: x.credit }))
    } else if (type === 'settle') {
      detailDrawer.value.title = t('workbench.charts.settlements')
      const res = await api.fx.settlements.list({ startDate: params.get('startDate')||'', endDate: params.get('endDate')||'' })
      const items = res?.items || []
      detailDrawer.value.rows = items.map(x => ({ settle_date: x.settle_date, bill_no: x.bill_no, customer_name: x.customer_name, total_base: Number(x.total_base||0) }))
    } else if (type === 'buy') {
      detailDrawer.value.title = t('workbench.charts.buyfx')
      const res = await api.buyfx.listTransfers()
      const items = res?.items || []
      // 若有时间筛选，前端进行 created_at 过滤
      const [s, e] = (Array.isArray(range.value) && range.value[0] && range.value[1]) ? [new Date(range.value[0]), new Date(range.value[1])] : [null, null]
      const inRange = (d) => {
        if (!s || !e) return true
        try { const dt = new Date(d); return dt >= s && dt <= e } catch { return true }
      }
      const filtered = items.filter(it => inRange(it.created_at))
      detailDrawer.value.rows = filtered.map(x => ({ created_at: (x.created_at||'').slice(0,19).replace('T',' '), platform_name: x.platform_name, amount_from: Number(x.amount_from||0), from_currency: x.from_currency, amount_to: Number(x.amount_to||0), to_currency: x.to_currency }))
    } else if (type === 'pay') {
      detailDrawer.value.title = t('workbench.charts.payments')
      const res = await api.fx.payments.list({ view: 'item', startDate: params.get('startDate')||'', endDate: params.get('endDate')||'', page: 1, pageSize: 500 })
      const items = Array.isArray(res) ? res : (res?.items || [])
      detailDrawer.value.rows = items.map(it => ({
        pay_date: it.pay_date,
        bill_no: it.bill_no,
        customer_name: it.customer_name,
        account_name: it.account_name,
        bank_name: it.bank_name,
        bank_account: it.bank_account,
        amount: Number(it.amount||0)
      }))
    } else if (type === 'exp') {
      detailDrawer.value.title = t('workbench.charts.expenses')
      const res = await api.expenses.report({ startDate: params.get('startDate')||'', endDate: params.get('endDate')||'' })
      const items = res?.items || []
      detailDrawer.value.rows = items.map(x => ({ description: x.description, drcr: x.drcr, debit_total: Number(x.debit_total||0), credit_total: Number(x.credit_total||0), net: Number(x.net||0) }))
    }
  } catch (e) {
    detailDrawer.value.rows = []
  } finally {
    detailDrawer.value.loading = false
  }
}

// —— 服务器监控 ——
const monitor = ref({ visible: false, loading: false, auto: false, timer: null })
const monitorRows = ref([])
const monitorSnapshot = ref({ cpuPct: 0, memPct: 0, dbPct: 0 })
function humanUptime(sec){
  try { sec = Number(sec||0) } catch { sec = 0 }
  const d = Math.floor(sec/86400); sec%=86400
  const h = Math.floor(sec/3600); sec%=3600
  const m = Math.floor(sec/60); const s = Math.floor(sec%60)
  const parts = []
  if (d) parts.push(d+'d'); if (h) parts.push(h+'h'); if (m) parts.push(m+'m'); parts.push(s+'s')
  return parts.join(' ')
}
function toRows(d){
  const rows = []
  rows.push({ name: t('workbench.monitor.metrics.time'), value: d.time })
  rows.push({ name: t('workbench.monitor.metrics.uptime'), value: humanUptime(d.uptimeSec) })
  rows.push({ name: t('workbench.monitor.metrics.node'), value: d.node?.version })
  rows.push({ name: t('workbench.monitor.metrics.pid'), value: String(d.node?.pid) })
  rows.push({ name: t('workbench.monitor.metrics.platform'), value: `${d.node?.platform}/${d.node?.arch}` })
  rows.push({ name: t('workbench.monitor.metrics.rss'), value: String(d.memory?.rssMB) })
  rows.push({ name: t('workbench.monitor.metrics.heapUsed'), value: String(d.memory?.heapUsedMB) })
  rows.push({ name: t('workbench.monitor.metrics.heapTotal'), value: String(d.memory?.heapTotalMB) })
  rows.push({ name: t('workbench.monitor.metrics.sysMem'), value: `${d.system?.usedMemMB}/${d.system?.totalMemMB}` })
  rows.push({ name: t('workbench.monitor.metrics.memUsedPct'), value: d.system?.memUsedPct!=null ? `${d.system.memUsedPct}%` : '-' })
  rows.push({ name: t('workbench.monitor.metrics.cpus'), value: String(d.system?.cpus) })
  rows.push({ name: t('workbench.monitor.metrics.load'), value: Array.isArray(d.system?.load) ? d.system.load.map(x=> (Math.round(Number(x||0)*100)/100)).join(' / ') : '-' })
  rows.push({ name: t('workbench.monitor.metrics.dbConfigured'), value: d.db?.configured ? t('workbench.monitor.status.yes') : t('workbench.monitor.status.no') })
  rows.push({ name: t('workbench.monitor.metrics.dbOk'), value: d.db?.ok ? t('workbench.monitor.status.ok') : t('workbench.monitor.status.fail'), status: d.db?.ok ? t('workbench.monitor.status.ok') : t('workbench.monitor.status.fail'), tag: d.db?.ok ? 'success' : 'danger' })
  rows.push({ name: t('workbench.monitor.metrics.dbLatency'), value: d.db?.latencyMs!=null ? String(d.db.latencyMs) : '-' })
  rows.push({ name: t('workbench.monitor.metrics.dbNow'), value: d.db?.now ? String(d.db.now) : '-' })
  rows.push({ name: t('workbench.monitor.metrics.dbVersion'), value: d.db?.version || '-' })
  rows.push({ name: t('workbench.monitor.metrics.dbSessions'), value: d.db?.sessions!=null ? String(d.db.sessions) : '-' })
  rows.push({ name: t('workbench.monitor.metrics.dbUsers'), value: d.db?.users!=null ? String(d.db.users) : '-' })
  // DB size
  if (d.db?.sizeMB != null) {
    rows.push({ name: t('workbench.monitor.metrics.dbSize'), value: String(d.db.sizeMB) })
  }
  // DB connections with colored status
  if (d.db?.connUsed != null && d.db?.connMax != null) {
    const pct = d.db.connUsedPct
    let tag = ''
    if (pct != null) {
      if (pct >= 90) tag = 'danger'
      else if (pct >= 70) tag = 'warning'
      else tag = 'success'
    }
    rows.push({ name: t('workbench.monitor.metrics.dbConn'), value: `${d.db.connUsed}/${d.db.connMax} (${pct!=null? pct+'%':'-'})`, status: pct!=null? (pct+'%'):'-', tag })
  }
  // Top tables
  if (Array.isArray(d.db?.topTables) && d.db.topTables.length) {
    const text = d.db.topTables.map(x => `${x.name}:${x.sizeMB}MB`).join(', ')
    rows.push({ name: t('workbench.monitor.metrics.dbTopTables'), value: text })
  }
  return rows
}
async function loadMonitor(){
  monitor.value.loading = true
  try {
    const d = await api.system.health()
    monitorRows.value = toRows(d)
    // 更新顶部监控条快照
    try {
      const memPct = Number(d?.system?.memUsedPct || 0)
      // 没有跨平台 cpu 的即时报表，借助 loadavg(1) ≈ 相对压力（0-#CPU），折算百分比
      let cpuPct = 0
      if (Array.isArray(d?.system?.load) && typeof d?.system?.cpus === 'number' && d.system.cpus > 0) {
        const la1 = Number(d.system.load[0] || 0)
        cpuPct = Math.max(0, Math.min(100, Math.round((la1 / d.system.cpus) * 100)))
      }
      let dbPct = (d?.db?.connUsedPct != null) ? Number(d.db.connUsedPct) : 0
      monitorSnapshot.value = { cpuPct, memPct, dbPct }
    } catch {}
  } catch (e) {
    ElMessage.error(e?.message || 'Failed')
  } finally {
    monitor.value.loading = false
  }
}
function openMonitor(){
  monitor.value.visible = true
  loadMonitor()
}
watch(() => monitor.value.auto, (on) => {
  if (on) {
    if (monitor.value.timer) clearInterval(monitor.value.timer)
    monitor.value.timer = setInterval(loadMonitor, 5000)
  } else {
    if (monitor.value.timer) { clearInterval(monitor.value.timer); monitor.value.timer = null }
  }
})
onMounted(() => {
  // 清理定时器（页面关闭或刷新）
  window.addEventListener('beforeunload', () => { if (monitor.value.timer) clearInterval(monitor.value.timer) })
  // 轻量自动刷新顶部监控条（不打开抽屉也更新），每 15 秒拉一次
  try {
    setInterval(() => { loadMonitor() }, 15000)
    // 首次取一遍
    loadMonitor()
  } catch {}
})

// 顶部监控条显示（百分比与配色）
const monitorCpuPct = computed(() => Number(monitorSnapshot.value.cpuPct || 0))
const monitorMemPct = computed(() => Number(monitorSnapshot.value.memPct || 0))
const monitorDbPct = computed(() => Number(monitorSnapshot.value.dbPct || 0))
function colorByPct(p){ if (p>=90) return '#f56c6c'; if (p>=70) return '#e6a23c'; return '#67c23a' }
const cpuColor = computed(() => colorByPct(monitorCpuPct.value))
const memColor = computed(() => colorByPct(monitorMemPct.value))
const dbColor = computed(() => colorByPct(monitorDbPct.value))

// 工作台页面：入口按类别排序（管理 -> 历史），每个入口独立授权
const quickActions = computed(() => [
  // 管理类
  { key: 'tx', label: t('home.qaTransactions'), desc: t('workbench.cards.tx'), route: 'transactions', color: 'blue', icon: 'Tickets' },
  { key: 'settleManage', label: t('home.qaSettlements'), desc: t('workbench.cards.settleManage'), route: 'fx-settlements', color: 'green', icon: 'Collection' },
  // 历史类
  { key: 'settleHistory', label: t('home.qaSettlementsHistory'), desc: t('workbench.cards.settleHistory'), route: 'fx-settlements', color: 'teal', icon: 'FolderOpened' },
  { key: 'payHistory', label: t('home.qaPaymentsHistory'), desc: t('workbench.cards.payHistory'), route: 'fx-payments', color: 'orange', icon: 'CreditCard' },
  { key: 'buyHistory', label: t('home.qaBuyHistory'), desc: t('workbench.cards.buyHistory'), route: 'fx-buy-history', color: 'purple', icon: 'Coin' },
])

// 细粒度入口可见性：根据 dashboard:nav:* 权限过滤 quick actions
const quickActionsFiltered = computed(() => {
  const items = quickActions.value
  const ok = (key) => {
    if (key === 'tx') return has('dashboard:nav:transactions')
    if (key === 'settleManage') return has('dashboard:nav:fx')
    if (key === 'settleHistory') return has('dashboard:nav:fx_history')
    if (key === 'payHistory') return has('dashboard:nav:pay_history')
    if (key === 'buyHistory') return has('dashboard:nav:buyfx_history')
    return true
  }
  return items.filter(it => ok(it.key))
})

// 待办：付款待审数量徽标 + 抽屉列表
const paymentsCount = ref(0)
const paymentsDrawer = ref(false)
const payments = ref([])
const paymentsLoading = ref(false)
// 平台列表用于审核
const platforms = ref([])
// 批量审核所需状态
const multipleSelectionRef = ref([])
const multipleSelection = computed({ get: () => multipleSelectionRef.value, set: (v) => { multipleSelectionRef.value = Array.isArray(v)? v: [] } })
const batch = ref({ platform_id: null })
const selectedPlatform = computed(() => platforms.value.find(p => p.id === batch.value.platform_id) || null)
const paymentTotalsById = ref({}) // { [id]: { USD, MYR, CNY } }

async function loadPaymentsCount(){
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 1 })
    if (res && typeof res.total === 'number') paymentsCount.value = res.total
    else if (Array.isArray(res?.items)) paymentsCount.value = res.items.length
    else if (Array.isArray(res)) paymentsCount.value = res.length
    else paymentsCount.value = 0
  } catch { paymentsCount.value = 0 }
}
async function loadPaymentsList(){
  paymentsLoading.value = true
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 50 })
    const items = Array.isArray(res) ? res : (res.items || [])
    // 默认按日期升序
    payments.value = [...items].sort((a,b) => String(a.pay_date||'').localeCompare(String(b.pay_date||'')))
  } catch (e) {
    // 后端不可用（本地未配置数据库）时，静默为空以保证 UI 可用
    payments.value = []
  } finally {
    paymentsLoading.value = false
  }
}
function openPayments(){ paymentsDrawer.value = true; loadPaymentsList() }
// 已移除“去处理”入口，保留在工作台内完成待审相关操作
// —— 审核组件：单笔审核/日志/明细 ——
const todoDrawer = ref(false)
const todoDetail = ref(null)
function fmtDate(v){ try { if (!v) return ''; if (typeof v === 'string') return v.slice(0,10); if (v.toISOString) return v.toISOString().slice(0,10); return String(v).slice(0,10) } catch { return String(v).slice(0,10) } }
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
// 参照其它列表的银行 Logo 回退策略：svg → png → jpg → public.svg
function bankImg(code) {
  const c = String(code || 'public').toLowerCase()
  return `/banks/${c}.svg`
}
function onBankImgErr(e) {
  const el = e?.target
  if (el && el.tagName === 'IMG') {
    const current = el.getAttribute('src') || ''
    if (/\.svg$/i.test(current)) el.src = current.replace(/\.svg$/i, '.png')
    else if (/\.png$/i.test(current)) el.src = current.replace(/\.png$/i, '.jpg')
    else el.src = '/banks/public.svg'
  }
}
async function openTodo(row){
  try {
    const d = await api.fx.payments.detail(row.id)
    todoDetail.value = d
    todoDrawer.value = true
  } catch {}
}
const approveDialog = ref({ visible: false, loading: false, id: null, platform_id: null })
const currentPaymentTotals = ref({ USD:0, MYR:0, CNY:0 })
async function openApprove(row){
  approveDialog.value = { visible: true, loading: false, id: row.id, platform_id: null }
  try {
    const d = await api.fx.payments.detail(row.id)
    const totals = { USD:0, MYR:0, CNY:0 }
    for (const it of (d.items||[])) {
      const cur = String(it.currency_code||'').toUpperCase()
      const amt = Math.round(Number(it.amount||0) * 100) / 100
      if (cur==='USD' || cur==='MYR' || cur==='CNY') totals[cur] = Math.round((totals[cur] + amt) * 100) / 100
    }
    currentPaymentTotals.value = totals
  } catch { currentPaymentTotals.value = { USD:0, MYR:0, CNY:0 } }
}
async function confirmApprove(){
  const { id, platform_id } = approveDialog.value
  if (!platform_id) return
  approveDialog.value.loading = true
  try {
    await api.fx.payments.approve(id, { platform_id })
    approveDialog.value.visible = false
    todoDrawer.value = false
    todoDetail.value = null
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
  } finally { approveDialog.value.loading = false }
}
async function doUnapprove(row){
  try {
    await api.fx.payments.unapprove(row.id)
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
  } catch {}
}
const auditDrawer = ref({ visible: false })
const auditRows = ref([])
async function openAudits(row){
  auditDrawer.value.visible = true
  try {
    const list = await api.fx.payments.audits(row.id)
    auditRows.value = (list.items || []).map(it => ({ ...it, deltas: typeof it.deltas === 'string' ? JSON.parse(it.deltas) : it.deltas }))
  } catch { auditRows.value = [] }
}
async function rejectPayment(row){
  try {
    await httpRequest(`/fx/payments/${row.id}`, { method: 'DELETE' })
    ElMessage.success(t('common.ok'))
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
  } catch (e) {
    ElMessage.error(e?.message || t('workbench.errors.rejectFailed'))
  }
}
// 单笔审核余额预览计算
const selectedPlatformSingle = computed(() => platforms.value.find(p => p.id === approveDialog.value.platform_id) || null)
const feePctSingle = computed(() => Number(selectedPlatformSingle.value?.fee_percent || 0))
const needSingle = computed(() => ({
  USD: Math.round((currentPaymentTotals.value.USD + Math.round((currentPaymentTotals.value.USD * feePctSingle.value / 100) * 100) / 100) * 100) / 100,
  MYR: Math.round((currentPaymentTotals.value.MYR + Math.round((currentPaymentTotals.value.MYR * feePctSingle.value / 100) * 100) / 100) * 100) / 100,
  CNY: Math.round((currentPaymentTotals.value.CNY + Math.round((currentPaymentTotals.value.CNY * feePctSingle.value / 100) * 100) / 100) * 100) / 100,
}))
const afterSingle = computed(() => ({
  USD: Math.round(((Number(selectedPlatformSingle.value?.balance_usd||0)) - needSingle.value.USD) * 100) / 100,
  MYR: Math.round(((Number(selectedPlatformSingle.value?.balance_myr||0)) - needSingle.value.MYR) * 100) / 100,
  CNY: Math.round(((Number(selectedPlatformSingle.value?.balance_cny||0)) - needSingle.value.CNY) * 100) / 100,
}))
const canApproveSingle = computed(() => {
  if (!approveDialog.value.platform_id) return false
  const anyNeed = (needSingle.value.USD>0 || needSingle.value.MYR>0 || needSingle.value.CNY>0)
  if (!anyNeed) return false
  return afterSingle.value.USD >= 0 && afterSingle.value.MYR >= 0 && afterSingle.value.CNY >= 0
})

// —— 批量审核：选择行 -> 计算合计/需求/扣后余额 ——
async function fetchPaymentTotals(id){
  if (paymentTotalsById.value[id]) return
  try {
    const d = await api.fx.payments.detail(id)
    const totals = { USD:0, MYR:0, CNY:0 }
    for (const it of (d.items||[])) {
      const cur = String(it.currency_code||'').toUpperCase()
      const amt = Math.round(Number(it.amount||0) * 100) / 100
      if (cur==='USD' || cur==='MYR' || cur==='CNY') totals[cur] = Math.round((totals[cur] + amt) * 100) / 100
    }
    paymentTotalsById.value[id] = totals
  } catch {}
}
async function onSelectionChange(rows){
  multipleSelection.value = rows
  await Promise.all(rows.map(r => fetchPaymentTotals(r.id)))
}
const selectionTotals = computed(() => {
  const totals = { USD:0, MYR:0, CNY:0 }
  for (const r of (multipleSelection.value || [])) {
    const t = paymentTotalsById.value[r.id]
    if (!t) continue
    totals.USD = Math.round((totals.USD + (t.USD||0)) * 100) / 100
    totals.MYR = Math.round((totals.MYR + (t.MYR||0)) * 100) / 100
    totals.CNY = Math.round((totals.CNY + (t.CNY||0)) * 100) / 100
  }
  return totals
})
const feePct4 = computed(() => Number((selectedPlatform.value && selectedPlatform.value.fee_percent) || 0))
const need = computed(() => ({
  USD: Math.round(((selectionTotals.value?.USD || 0) + Math.round((((selectionTotals.value?.USD || 0) * feePct4.value / 100)) * 100) / 100) * 100) / 100,
  MYR: Math.round(((selectionTotals.value?.MYR || 0) + Math.round((((selectionTotals.value?.MYR || 0) * feePct4.value / 100)) * 100) / 100) * 100) / 100,
  CNY: Math.round(((selectionTotals.value?.CNY || 0) + Math.round((((selectionTotals.value?.CNY || 0) * feePct4.value / 100)) * 100) / 100) * 100) / 100,
}))
const after = computed(() => ({
  USD: Math.round(((Number((selectedPlatform.value && selectedPlatform.value.balance_usd) || 0)) - (need.value?.USD || 0)) * 100) / 100,
  MYR: Math.round(((Number((selectedPlatform.value && selectedPlatform.value.balance_myr) || 0)) - (need.value?.MYR || 0)) * 100) / 100,
  CNY: Math.round(((Number((selectedPlatform.value && selectedPlatform.value.balance_cny) || 0)) - (need.value?.CNY || 0)) * 100) / 100,
}))
const canBatchApprove = computed(() => {
  const anyNeed = (need.value.USD>0 || need.value.MYR>0 || need.value.CNY>0)
  if (!anyNeed) return false
  return after.value.USD >= 0 && after.value.MYR >= 0 && after.value.CNY >= 0
})
async function doBatchApprove(){
  if (!batch.value.platform_id || !multipleSelection.value.length) return
  const ids = (multipleSelection.value || []).map(r => r.id)
  try {
    await api.fx.payments.batchApprove(ids, batch.value.platform_id)
    multipleSelection.value = []
    batch.value.platform_id = null
    await Promise.all([loadPaymentsList(), loadPaymentsCount()])
  } catch {}
}

async function loadPlatforms(){
  try {
    const res = await api.buyfx.listPlatforms()
    platforms.value = res.items || []
  } catch { platforms.value = [] }
}
// 6类统计：合计与明细
const stats = ref({
  totals: { cusMYR: 0, cusCNY: 0, bankMYR: 0, payCNY: 0, exchMYR: 0, pendingCNY: 0 },
  lists: { cusMYR: [], cusCNY: [], bankMYR: [], payCNY: [], exchMYR: [], pendingCNY: [] }
})
const statDrawer = ref({ visible: false, title: '', key: '', rows: [] })
function openStat(key){
  // 使用国际化标题，避免语言切换时标题未翻译
  const title = t(`workbench.kpis.${key}`)
  const rows = Array.isArray(stats.value.lists[key]) ? stats.value.lists[key] : []
  statDrawer.value = { visible: true, title, key, rows }
}

async function loadStats(){
  // 1/2 客户余额
  try {
    const data = await api.customers.list({ page: 1, pageSize: 5000, sort: 'id', order: 'asc' })
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data)? data : []
    const listMYR = items.map(r => ({ label: r.name||r.abbr||'', value: Number(r.balance_myr||0) })).filter(x => x.value !== 0)
    const listCNY = items.map(r => ({ label: r.name||r.abbr||'', value: Number(r.balance_cny||0) })).filter(x => x.value !== 0)
    stats.value.lists.cusMYR = listMYR
    stats.value.lists.cusCNY = listCNY
    stats.value.totals.cusMYR = listMYR.reduce((s, x) => s + x.value, 0)
    stats.value.totals.cusCNY = listCNY.reduce((s, x) => s + x.value, 0)
  } catch {
    stats.value.lists.cusMYR = []; stats.value.lists.cusCNY = []
    stats.value.totals.cusMYR = 0; stats.value.totals.cusCNY = 0
  }

  // 3 银行余额(MYR)：收款账户按 MYR 的余额汇总
  try {
    const data = await api.accounts.list({ page: 1, pageSize: 5000, sort: 'id', order: 'asc' })
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data)? data : []
    const list = items.filter(r => String(r.currency_code||'').toUpperCase()==='MYR')
      .map(r => ({ label: `${r.account_name||''} (${r.bank_account||''})`, value: Number(r.balance||0) }))
      .filter(x => x.value !== 0)
    stats.value.lists.bankMYR = list
    stats.value.totals.bankMYR = list.reduce((s, x) => s + x.value, 0)
  } catch {
    stats.value.lists.bankMYR = []; stats.value.totals.bankMYR = 0
  }

  // 4/5 平台余额：可付(CNY) 与 可兑(MYR)
  try {
    const res = await api.buyfx.listPlatforms()
    const items = res?.items || []
    const listPayCNY = items.map(p => ({ label: p.name, value: Number(p.balance_cny||0) })).filter(x => x.value !== 0)
    const listExchMYR = items.map(p => ({ label: p.name, value: Number(p.balance_myr||0) })).filter(x => x.value !== 0)
    stats.value.lists.payCNY = listPayCNY
    stats.value.lists.exchMYR = listExchMYR
    stats.value.totals.payCNY = listPayCNY.reduce((s, x) => s + x.value, 0)
    stats.value.totals.exchMYR = listExchMYR.reduce((s, x) => s + x.value, 0)
  } catch {
    stats.value.lists.payCNY = []; stats.value.totals.payCNY = 0
    stats.value.lists.exchMYR = []; stats.value.totals.exchMYR = 0
  }

  // 6 待付余额(CNY)：待审付款明细合计 CNY
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 500 })
    const heads = Array.isArray(res) ? res : (res?.items || [])
    const list = []
    let total = 0
    for (const h of heads) {
      try {
        const d = await api.fx.payments.detail(h.id)
        const sumCNY = (d.items||[]).filter(it => String(it.currency_code||'').toUpperCase()==='CNY')
          .reduce((s,it) => s + Number(it.amount||0), 0)
        if (sumCNY !== 0) list.push({ label: h.bill_no || ('Payment-'+h.id), value: sumCNY })
        total += sumCNY
      } catch {}
    }
    stats.value.lists.pendingCNY = list
    stats.value.totals.pendingCNY = total
  } catch {
    stats.value.lists.pendingCNY = []; stats.value.totals.pendingCNY = 0
  }
}

onMounted(() => { loadPaymentsCount(); loadPlatforms(); loadStats(); loadSummary() })

// —— 交易管理：未匹配统计（KPI） ——
const unmatchedCount = ref(0)
const matchedCount = ref(0)
const totalTx = computed(() => (unmatchedCount.value + matchedCount.value))
async function loadUnmatchedMetrics(){
  try {
    const p = await api.transactions.stats({ status: 'pending' })
    const m = await api.transactions.stats({ status: 'matched' })
    unmatchedCount.value = Number(p?.summary?.totalTransactions || 0)
    matchedCount.value = Number(m?.summary?.totalTransactions || 0)
  } catch (e) {
    // 回退：使用列表接口读取 total
    try {
      const p2 = await api.transactions.list({ status: 'pending', page: 1, pageSize: 1 })
      const m2 = await api.transactions.list({ status: 'matched', page: 1, pageSize: 1 })
      const getTotal = (r) => (r?.pagination?.total) ?? (typeof r?.total === 'number' ? r.total : (Array.isArray(r?.data) ? r.data.length : 0))
      unmatchedCount.value = Number(getTotal(p2) || 0)
      matchedCount.value = Number(getTotal(m2) || 0)
    } catch {
      unmatchedCount.value = 0
      matchedCount.value = 0
    }
  }
}
onMounted(() => { loadUnmatchedMetrics() })
function goToPendingTx(){ router.push({ name: 'transactions' }) }

// —— 付款待审：可拖拽浮动按钮 ——
const fabPos = ref({ x: 16, y: 160 })
const fabDragging = ref(false)
const fabStart = { x: 0, y: 0, mx: 0, my: 0 }
const fabStyle = computed(() => ({ left: fabPos.value.x + 'px', top: fabPos.value.y + 'px' }))
function readFab() {
  try {
    const raw = localStorage.getItem('fab.payments.pos')
    if (!raw) return
    const p = JSON.parse(raw)
    if (typeof p.x === 'number' && typeof p.y === 'number') fabPos.value = p
  } catch {}
}
function saveFab() { try { localStorage.setItem('fab.payments.pos', JSON.stringify(fabPos.value)) } catch {} }
function onFabDown(e) {
  fabDragging.value = true
  const pt = 'touches' in e ? e.touches[0] : e
  fabStart.mx = pt.clientX
  fabStart.my = pt.clientY
  fabStart.x = fabPos.value.x
  fabStart.y = fabPos.value.y
  window.addEventListener('mousemove', onFabMove)
  window.addEventListener('mouseup', onFabUp)
  window.addEventListener('touchmove', onFabMove, { passive: false })
  window.addEventListener('touchend', onFabUp)
}
function onFabMove(e) {
  if (!fabDragging.value) return
  const pt = 'touches' in e ? e.touches[0] : e
  if ('touches' in e) e.preventDefault()
  const dx = pt.clientX - fabStart.mx
  const dy = pt.clientY - fabStart.my
  const nx = Math.max(8, Math.min(window.innerWidth - 60, fabStart.x + dx))
  const ny = Math.max(80, Math.min(window.innerHeight - 60, fabStart.y + dy))
  fabPos.value = { x: nx, y: ny }
}
function onFabUp() {
  fabDragging.value = false
  window.removeEventListener('mousemove', onFabMove)
  window.removeEventListener('mouseup', onFabUp)
  window.removeEventListener('touchmove', onFabMove)
  window.removeEventListener('touchend', onFabUp)
  saveFab()
}
function onFabClick() {
  if (fabDragging.value) return
  openPayments()
}
onMounted(() => { readFab() })

// —— 快捷操作抽屉：结汇/付款/购汇 ——
const settleDrawer = ref({ visible: false })
const payDrawer = ref({ visible: false })
const buyDrawer = ref({ visible: false })
const settleRef = ref(null)
const payRef = ref(null)
const settlePrefillCustomerId = ref(null)
const payPrefillCustomerId = ref(null)
function openSettleDrawer(customerId){
  settlePrefillCustomerId.value = customerId || null
  settleDrawer.value.visible = true
  // 若组件已挂载，直接设置
  try { if (customerId && settleRef.value?.setSettleCustomerId) settleRef.value.setSettleCustomerId(customerId) } catch {}
}
function openPayDrawer(customerId){
  payPrefillCustomerId.value = customerId || null
  payDrawer.value.visible = true
  try { if (customerId && payRef.value?.setPayCustomerId) payRef.value.setPayCustomerId(customerId) } catch {}
}
function openBuyDrawer(){ buyDrawer.value.visible = true }
function onSettlementCreated(evt){
  // 创建结汇后，询问是否打开付款抽屉（并预填客户）
  const cid = evt?.customerId || null
  try {
    // 轻量提示 + 二次确认
    // 使用浏览器 confirm 简化依赖；如需更友好可换成 ElMessageBox
    const ok = window.confirm('结汇已创建，是否继续打开付款？')
    if (ok) {
      settleDrawer.value.visible = false
      openPayDrawer(cid)
    }
  } catch {
    // 回退：直接打开付款
    settleDrawer.value.visible = false
    openPayDrawer(cid)
  }
  // 刷新顶部统计
  loadStats(); loadSummary(); loadPaymentsCount()
}
function onPaymentCreated(){
  // 支付创建后刷新统计
  loadStats(); loadSummary(); loadPaymentsCount()
}
</script>

<style scoped>
.workbench { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.quick-title { display:none; }
.card--plain { background: transparent; border: none; box-shadow: none; }

/* 高频操作置顶工具栏 */
.hf-toolbar { position: sticky; top: 0; z-index: 20; padding: 6px 8px; margin: 6px 8px; background: transparent; box-shadow: none; }
.hf-row { display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }
.hf-item { display:flex; align-items:center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: var(--el-bg-color); border: 1px solid var(--el-border-color); cursor: pointer; user-select:none; transition: box-shadow .2s ease, transform .06s ease, background .2s ease; }
.hf-item:hover { box-shadow: 0 16px 28px rgba(0,0,0,.12); transform: translateY(-1px); }
.hf-item:focus { outline: 3px solid rgba(0,0,0,.12); outline-offset: 2px; }
.hf-icon { width: 36px; height: 36px; border-radius: 10px; display:flex; align-items:center; justify-content:center; font-size: 26px; }
.hf-icon :deep(svg) { width: 26px; height: 26px; }
.hf-label { font-weight: 800; letter-spacing: .2px; }
.hf-item.primary .hf-icon { background: color-mix(in oklab, var(--el-color-primary) 16%, transparent); color: var(--el-color-primary); }
.hf-item.success .hf-icon { background: color-mix(in oklab, var(--el-color-success) 16%, transparent); color: var(--el-color-success); }
.hf-item.warning .hf-icon { background: color-mix(in oklab, var(--el-color-warning) 16%, transparent); color: var(--el-color-warning); }
@media (max-width: 768px){ .hf-row { gap: 8px; } }

/* 卡片网格 */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.card-grid.single-row { grid-template-columns: repeat(5, minmax(180px, 1fr)); }
.feature-card {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr 16px;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 8px 20px rgba(0,0,0,.06);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: box-shadow .2s ease, filter .2s ease, transform .06s ease;
}
.feature-card::after { display: none; }
.feature-card:hover { box-shadow: 0 22px 46px rgba(0,0,0,.2); filter: saturate(1.06); }
.feature-card:focus { outline: 3px solid rgba(255,255,255,.5); outline-offset: 2px; }
.fc-icon { font-size: 26px; line-height: 1; text-shadow: none; display: flex; align-items: center; justify-content: center; }
.fc-icon :deep(svg) { width: 24px; height: 24px; }
.fc-texts { display: grid; gap: 4px; }
.fc-title { font-weight: 800; letter-spacing: .2px; }
.fc-desc { display: none; }
.fc-arrow { font-size: 20px; opacity: .65; color: var(--el-text-color-secondary); }

/* 主题色系 */
/* 主题占位已合并为统一白卡风格，无需额外色系 */

/* 浮动按钮样式 */
.floating-payments { position: fixed; z-index: 1000; cursor: move; user-select: none; }
.fp-btn { width: 44px; height: 44px; border-radius: 22px; background: var(--el-color-primary); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,.18); }
.fp-btn :deep(svg) { width: 20px; height: 20px; }
/* 明细/预览样式 */
.todo-head { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; }
.todo-head > div { color: var(--el-text-color-primary); font-weight: 600; }
.preview-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
.preview-card .row { display: grid; grid-template-columns: 120px repeat(3, minmax(0,1fr)); gap: 8px; align-items: center; margin: 4px 0; }
.preview-card .cell.head { color: var(--el-text-color-secondary); font-size: 12px; }
.preview-card .cell.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.preview-card .cell.warn { color: var(--el-text-color-primary); }
.preview-card .cell.danger { color: var(--el-color-danger); font-weight: 600; }

/* 图表区域 */
.charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; margin-top: 8px; }
.chart { height: 300px; border: 1px solid var(--el-border-color); border-radius: 10px; background: var(--el-bg-color); }
/* 指标网格与卡片 */
.indicator-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.kpi { border: 1px solid var(--el-border-color); border-radius: 10px; background: var(--el-bg-color); padding: 10px 12px; display: grid; gap: 4px; }
.kpi .val { font-weight: 800; font-size: 16px; letter-spacing: .2px; }
.kpi .lbl { color: var(--el-text-color-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 6 指标卡布局 */
.kpi6-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 8px; }
.kpi-card { position: relative; border: 1px solid var(--el-border-color); border-radius: 12px; background: var(--el-bg-color); padding: 14px 16px; box-shadow: 0 6px 16px rgba(0,0,0,.06); cursor: pointer; user-select: none; }
.kpi-card:hover { box-shadow: 0 14px 30px rgba(0,0,0,.12); }
.kpi-title { color: var(--el-text-color-secondary); font-size: 12px; margin-bottom: 6px; }
.kpi-value { font-size: 22px; font-weight: 800; letter-spacing: .3px; }
.kpi-count { position: absolute; right: 10px; top: 8px; font-size: 12px; border-radius: 10px; padding: 2px 6px; background: var(--el-fill-color-lighter); color: var(--el-text-color-secondary); }
.kpi-card.theme-primary .kpi-value { color: var(--el-color-primary); }
.kpi-card.theme-success .kpi-value { color: var(--el-color-success); }
.kpi-card.theme-warning .kpi-value { color: var(--el-color-warning); }
.kpi-card.theme-info .kpi-value { color: var(--el-color-info); }
.kpi-card.theme-danger .kpi-value { color: var(--el-color-danger); }
.mini-bars { display:flex; gap:4px; align-items:flex-end; height: 30px; margin-top:8px; }
.mini-bars span { display:inline-block; width:6px; background: color-mix(in oklab, var(--el-color-primary) 70%, #fff); border-radius:3px; }
.filters { display:flex; gap:10px; align-items:center; margin: 12px 8px; flex-wrap: wrap; }
.monitor-bar { display:flex; align-items:center; gap:10px; margin-left:auto; padding: 6px 10px; border: 1px solid var(--el-border-color); border-radius: 10px; background: var(--el-bg-color); box-shadow: 0 2px 8px rgba(0,0,0,.04); cursor: pointer; }
.mb-item { display:grid; grid-template-columns: 34px 120px; align-items:center; gap:6px; }
.mb-label { color: var(--el-text-color-secondary); font-size: 12px; }

/* 日期选择的小弹窗样式 */
:deep(.wb-date-popover) { padding: 8px 8px 10px; }
.date-pop-content { display: grid; gap: 8px; }
.date-pop-ops { display: flex; justify-content: flex-end; gap: 8px; }

/* 迷你图表：未匹配交易 */
.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
.chart-card { border: 1px solid var(--el-border-color); border-radius: 12px; padding: 12px; background: var(--el-bg-color); }
.chart-title { font-weight: 700; color: var(--el-text-color-primary); margin-bottom: 8px; }
.chart-body { display: grid; grid-template-columns: 84px 1fr; align-items: center; gap: 12px; }
.kpi-sub { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
.chart-meta .big { font-size: 22px; font-weight: 800; line-height: 1.1; }
.chart-meta .sub { color: var(--el-text-color-secondary); font-size: 12px; }
.chart-meta .ops { margin-top: 6px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* 抽屉内表格：移除外框与背景，保留行分隔线以保证可读性 */
:deep(.el-drawer .el-table) { background: transparent; }
:deep(.el-drawer .el-table__inner-wrapper)::before { display: none; }
:deep(.el-drawer .el-table--border) { border: none; }
:deep(.el-drawer .el-table--border::after),
:deep(.el-drawer .el-table--border::before) { display: none; }
:deep(.el-drawer .el-table th),
:deep(.el-drawer .el-table td) { background: transparent; }
</style>
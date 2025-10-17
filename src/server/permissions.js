import { query } from './db.js'

// 基于菜单的权限树（清晰分组，仅保留当前系统实际使用/校验的权限码）
export const PERMISSION_TREE = [
  // 工作台（查看 + 展示/操作粒度）
  { module: 'workbench', name: '工作台', items: [
    { code: 'view_dashboard', name: '查看' },
    // 展示：小组件/板块
    { code: 'dashboard:pending_pay_approval', name: '付款待审（展示）' },
    { code: 'dashboard:quick_actions', name: '快捷操作区（展示）' },
    { code: 'dashboard:navigation', name: '功能入口（展示）' },
    { code: 'dashboard:kpi:customer_balance_myr', name: '客户余额(MYR)' },
    { code: 'dashboard:kpi:customer_balance_cny', name: '客户余额(CNY)' },
    { code: 'dashboard:kpi:bank_balance_myr', name: '银行余额(MYR)' },
    { code: 'dashboard:kpi:payable_cny', name: '可付余额(CNY)' },
    { code: 'dashboard:kpi:exchangeable_myr', name: '可兑余额(MYR)' },
    { code: 'dashboard:kpi:paying_cny', name: '待付余额(CNY)' },
    { code: 'dashboard:kpi:unmatched_txn', name: '未匹配交易' },
    { code: 'dashboard:total:transactions_debit', name: '交易合计（借）' },
    { code: 'dashboard:total:transactions_credit', name: '交易合计（贷）' },
    { code: 'dashboard:total:settlements', name: '结汇合计' },
    { code: 'dashboard:total:buyfx', name: '购汇合计' },
    { code: 'dashboard:total:payments', name: '付款合计' },
    { code: 'dashboard:total:expenses', name: '费用合计' },
    { code: 'dashboard:server_monitor', name: '服务器监控（展示）' },
    // 操作：快捷操作按钮
    { code: 'dashboard:action:match', name: '匹配（操作）' },
    { code: 'dashboard:action:settle', name: '结汇（操作）' },
    { code: 'dashboard:action:pay', name: '付款（操作）' },
    { code: 'dashboard:action:buyfx', name: '购汇（操作）' },
    // 导航卡片可见性（展示）
    { code: 'dashboard:nav:transactions', name: '交易管理（入口）' },
    { code: 'dashboard:nav:fx', name: '结汇管理（入口）' },
    { code: 'dashboard:nav:fx_history', name: '结汇历史（入口）' },
    { code: 'dashboard:nav:pay_history', name: '付款历史（入口）' },
    { code: 'dashboard:nav:buyfx_history', name: '购汇历史（入口）' },
  ]},

  // 客户管理
  { module: 'customers', name: '客户管理', items: [
    { code: 'view_customers', name: '查看' },
    { code: 'customers:import', name: '导入' },
    { code: 'customers:export', name: '导出' },
    { code: 'customers:template', name: '模板' },
    { code: 'customers:create', name: '新增' },
    { code: 'customers:update', name: '编辑' },
    { code: 'customers:delete', name: '删除' },
  ]},

  // 银行列表
  { module: 'banks', name: '银行列表', items: [
    { code: 'view_banks', name: '查看' },
    { code: 'banks:create', name: '新增' },
    { code: 'banks:update', name: '编辑' },
    { code: 'banks:delete', name: '删除' },
  ]},

  // 收款账户
  { module: 'accounts', name: '收款账户', items: [
    { code: 'view_accounts', name: '查看' },
    { code: 'currencies:manage', name: '币种设置' },
    { code: 'accounts:create', name: '新增' },
    { code: 'accounts:update', name: '编辑' },
    { code: 'accounts:delete', name: '删除' },
  ]},

  // 交易管理
  { module: 'transactions', name: '交易管理', items: [
    { code: 'view_transactions', name: '查看' },
    { code: 'view_transactions_stats', name: '图表/统计' },
    { code: 'transactions:create', name: '新增交易' },
    { code: 'transactions:import', name: '导入交易' },
    { code: 'transactions:export', name: '导出交易' },
    { code: 'transactions:advanced_filter', name: '高级筛选' },
    { code: 'transactions:batch_delete', name: '批量删除' },
    { code: 'transactions:match_list', name: '匹配列表' },
    { code: 'transactions:match', name: '匹配' },
    { code: 'transactions:delete', name: '删除' },
  ]},

  // 结汇管理
  { module: 'fx', name: '结汇管理', items: [
    { code: 'view_fx', name: '查看' },
    // 结汇区
    { code: 'fx:settlement:view', name: '结汇区（查看单据）' },
    { code: 'fx:settlement:create', name: '生成结汇单' },
    { code: 'fx:export', name: '导出' },
    { code: 'delete_fx', name: '删除' },
    // 付款区
    { code: 'fx:payment:view', name: '付款区（查看单据）' },
    { code: 'fx:payment:create', name: '生成付款单' },
    { code: 'fx:pdf', name: 'PDF' },
    { code: 'fx:revoke', name: '撤销' },
    { code: 'manage_fx', name: '审批/变更' },
  ]},

  // 购汇管理
  { module: 'buyfx', name: '购汇管理', items: [
    // 仍沿用 FX 查看权限；后续如拆分接口可替换为 buyfx:view
    { code: 'view_fx', name: '查看' },
    { code: 'buyfx:platforms:create', name: '新增平台商' },
    { code: 'buyfx:platforms:update', name: '编辑平台商' },
    { code: 'buyfx:platforms:delete', name: '删除平台商' },
    { code: 'buyfx:platforms:ledger', name: '借贷记录' },
    { code: 'buyfx:operate', name: '购汇管理（操作表）' },
  ]},

  // 费用管理
  { module: 'expenses', name: '费用管理', items: [
    { code: 'expenses:list', name: '查看' },
    { code: 'expenses:create', name: '新增' },
    { code: 'expenses:update', name: '编辑' },
    { code: 'expenses:delete', name: '删除' },
    { code: 'expenses:export', name: '导出报表' },
  ]},

  // 用户与权限
  { module: 'users', name: '用户管理', items: [
    { code: 'manage_users', name: '管理用户与权限' },
  ]},
]

export function flattenPermissionCodes(tree = PERMISSION_TREE) {
  const out = []
  for (const mod of tree) {
    for (const it of (mod.items || [])) out.push({ code: it.code, name: `${mod.name}-${it.name}` })
  }
  return out
}

// 计算每个模块的“查看”主权限编码
export function getModuleViewCode(module) {
  if (module === 'workbench') return 'view_dashboard'
  if (module === 'expenses') return 'expenses:list'
  if (module === 'buyfx') return 'view_fx'
  if (module === 'users') return 'manage_users'
  return `view_${module}`
}

export function buildPermissionIndex(tree = PERMISSION_TREE) {
  const modToCodes = new Map()
  const codeToModule = new Map()
  for (const m of tree) {
    const codes = (m.items || []).map(i => i.code)
    modToCodes.set(m.module, codes)
    for (const c of codes) codeToModule.set(c, m.module)
  }
  return { modToCodes, codeToModule }
}

export async function reseedPermissions({ reset = false } = {}) {
  const newPerms = flattenPermissionCodes(PERMISSION_TREE)
  const codes = newPerms.map(p => p.code)
  for (const p of newPerms) {
    await query(
      `insert into permissions(code, name) values($1,$2)
       on conflict(code) do update set name=excluded.name`,
      [p.code, p.name]
    )
  }
  let removed = 0
  if (reset) {
    const del = await query(
      `delete from permissions where code <> all($1::text[])`,
      [codes]
    )
    removed = del.rowCount || 0
  }
  const count = (await query('select count(*) from permissions')).rows?.[0]?.count || 0
  return { total: Number(count), insertedOrUpdated: newPerms.length, removed }
}

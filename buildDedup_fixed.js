function buildDedup(rows){
  // 临时移除去重逻辑，允许所有数据导入进行测试
  console.log('buildDedup called with', rows.length, 'rows')
  
  try {
    const out = rows.map(r => ({
      accountNumber: r.accountNumber,
      transactionDate: r.transactionDate,
      chequeRefNo: r.chequeRefNo,
      description: r.description,
      debitAmount: r.debitAmount,
      creditAmount: r.creditAmount,
      referenceText: String(r.referenceText || '').trim(),
      amountValue: Math.round((Number(r.creditAmount||0) - Number(r.debitAmount||0)) * 100) / 100,
      status: 'normal',
      include: true
    }))
    
    importRows.value = out
    console.log('importRows.value set to', out.length, 'items')
    
    // 自动导入：直接导入所有数据
    const toImport = importRows.value.filter(r => r.include)
    ElMessage.info(`准备导入 ${toImport.length} 条记录（已禁用去重检测）`) 
    // 延迟一个tick，确保状态更新后再提交
    setTimeout(() => {
      submitImport()
    }, 0)
  } catch (e) {
    console.error('buildDedup处理失败:', e)
    ElMessage.error('数据处理失败: ' + e.message)
  }
}
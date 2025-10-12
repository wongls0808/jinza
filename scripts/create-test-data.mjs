// 创建测试数据的脚本
import { query } from '../src/server/db.js';

async function createTestData() {
  try {
    console.log('开始创建测试数据...');
    
    // 首先检查表是否存在
    try {
      await query("SELECT to_regclass('public.transactions')");
    } catch (err) {
      console.error('transactions表不存在，请先运行迁移脚本:', err);
      return;
    }
    
    // 插入测试数据
    await query(`
      INSERT INTO transactions 
        (account_number, transaction_date, cheque_ref_no, description, debit_amount, credit_amount, balance, category, reference_1, reference_2)
      VALUES 
        ('6226123456789001', '2025-10-01', 'REF1001', '工资收入', 0, 10000, 10000, '收入', '月度工资', '公司ABC'),
        ('6226123456789001', '2025-10-03', 'REF1002', '超市购物', 500, 0, 9500, '支出', '日常开销', '家乐福'),
        ('6226123456789001', '2025-10-05', 'REF1003', '服装购买', 1200, 0, 8300, '支出', '服装', 'ZARA'),
        ('6226123456789001', '2025-10-10', 'REF1004', '餐饮消费', 300, 0, 8000, '支出', '午餐', '陈记餐厅'),
        ('6226123456789001', '2025-10-15', 'REF1005', '兼职收入', 0, 2000, 10000, '收入', '兼职项目', '客户XYZ')
    `);
    
    console.log('测试数据创建成功！');
  } catch (error) {
    console.error('创建测试数据失败:', error);
  }
}

createTestData().catch(console.error);
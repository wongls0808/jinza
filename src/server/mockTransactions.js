// 模拟交易数据，用于开发和演示环境
export const mockTransactions = [
  {
    id: 1,
    account_number: '000123456789',
    transaction_date: '2025-10-01',
    cheque_ref_no: 'CHK20251001',
    description: '工资收入',
    debit_amount: 0,
    credit_amount: 8500.00,
    balance: 8500.00,
    category: '收入'
  },
  {
    id: 2,
    account_number: '000123456789',
    transaction_date: '2025-10-02',
    cheque_ref_no: null,
    description: '超市购物',
    debit_amount: 245.50,
    credit_amount: 0,
    balance: 8254.50,
    category: '购物'
  },
  {
    id: 3,
    account_number: '000123456789',
    transaction_date: '2025-10-03',
    cheque_ref_no: null,
    description: '餐厅消费',
    debit_amount: 120.00,
    credit_amount: 0,
    balance: 8134.50,
    category: '餐饮'
  },
  {
    id: 4,
    account_number: '000123456789',
    transaction_date: '2025-10-05',
    cheque_ref_no: null,
    description: '水电费支付',
    debit_amount: 350.75,
    credit_amount: 0,
    balance: 7783.75,
    category: '公共事业'
  },
  {
    id: 5,
    account_number: '000123456789',
    transaction_date: '2025-10-10',
    cheque_ref_no: null,
    description: '投资收益',
    debit_amount: 0,
    credit_amount: 1200.00,
    balance: 8983.75,
    category: '投资'
  }
];

// 获取模拟的交易数据
export function getMockTransactions(params = {}) {
  const { 
    page = 1, 
    pageSize = 20, 
    sort = 'transaction_date', 
    order = 'desc', 
    search = '',
    startDate = null,
    endDate = null,
    category = null
  } = params;
  
  // 过滤数据
  let filteredData = [...mockTransactions];
  
  // 搜索
  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(tx => 
      tx.description.toLowerCase().includes(searchLower) ||
      tx.account_number.includes(search) ||
      (tx.cheque_ref_no && tx.cheque_ref_no.toLowerCase().includes(searchLower))
    );
  }
  
  // 日期过滤
  if (startDate) {
    filteredData = filteredData.filter(tx => new Date(tx.transaction_date) >= new Date(startDate));
  }
  if (endDate) {
    filteredData = filteredData.filter(tx => new Date(tx.transactionDate) <= new Date(endDate));
  }
  
  // 分类过滤
  if (category) {
    filteredData = filteredData.filter(tx => tx.category === category);
  }
  
  // 计算总数
  const total = filteredData.length;
  
  // 排序
  filteredData.sort((a, b) => {
    let valueA = a[sort];
    let valueB = b[sort];
    
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    if (order === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
  
  // 分页
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      pages: Math.ceil(total / Number(pageSize))
    }
  };
}

// 获取模拟的交易统计数据
export function getMockTransactionStats() {
  // 计算总收入和支出
  let totalCredit = 0;
  let totalDebit = 0;
  
  mockTransactions.forEach(tx => {
    totalCredit += Number(tx.credit_amount);
    totalDebit += Number(tx.debit_amount);
  });
  
  // 按类别统计
  const categories = {};
  mockTransactions.forEach(tx => {
    const cat = tx.category;
    if (!categories[cat]) {
      categories[cat] = {
        count: 0,
        debit: 0,
        credit: 0
      };
    }
    categories[cat].count++;
    categories[cat].debit += Number(tx.debit_amount);
    categories[cat].credit += Number(tx.credit_amount);
  });
  
  // 按月统计
  const byMonth = {};
  mockTransactions.forEach(tx => {
    const month = tx.transaction_date.substring(0, 7); // YYYY-MM
    if (!byMonth[month]) {
      byMonth[month] = {
        debit: 0,
        credit: 0
      };
    }
    byMonth[month].debit += Number(tx.debit_amount);
    byMonth[month].credit += Number(tx.credit_amount);
  });
  
  return {
    summary: {
      totalTransactions: mockTransactions.length,
      totalCredit,
      totalDebit,
      netBalance: totalCredit - totalDebit
    },
    byCategory: Object.keys(categories).map(key => ({
      name: key,
      count: categories[key].count,
      debit: categories[key].debit,
      credit: categories[key].credit,
      net: categories[key].credit - categories[key].debit
    })),
    byMonth: Object.keys(byMonth).map(key => ({
      month: key,
      debit: byMonth[key].debit,
      credit: byMonth[key].credit,
      net: byMonth[key].credit - byMonth[key].debit
    }))
  };
}
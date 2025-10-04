// test-api-curl.js - 使用curl测试API
const { execSync } = require('child_process');

try {
  console.log('正在测试API...');
  const result = execSync('curl -s -v http://localhost:3000/api/invoices').toString();
  console.log('curl结果:\n', result);
} catch (error) {
  console.error('执行curl失败:', error.message);
}
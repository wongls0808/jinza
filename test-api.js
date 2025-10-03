import fetch from 'node-fetch';

async function testApiEndpoint() {
  try {
    console.log('测试 /api/invoices 端点...');
    const response = await fetch('http://localhost:3000/api/invoices');
    
    console.log('响应状态:', response.status, response.statusText);
    console.log('响应头:', response.headers.raw());
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    const responseText = await response.text();
    console.log('响应内容前500个字符:');
    console.log(responseText.slice(0, 500));
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        console.log('成功解析JSON响应');
        console.log('数据:', data);
      } catch (error) {
        console.error('无法将响应解析为JSON:', error);
      }
    }
  } catch (error) {
    console.error('API测试失败:', error);
  }
}

// 执行测试
testApiEndpoint();
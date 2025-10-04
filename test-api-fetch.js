// 使用fetch API测试接口
import fetch from 'node-fetch';

async function testApi() {
  try {
    console.log('正在测试API...');
    const response = await fetch('http://localhost:3000/api/invoices');
    console.log('状态码:', response.status);
    
    const contentType = response.headers.get('content-type');
    console.log('内容类型:', contentType);
    
    const text = await response.text();
    console.log('响应内容 (前200字符):', text.substring(0, 200));
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        console.log('JSON解析成功:', json);
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
      }
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

testApi();
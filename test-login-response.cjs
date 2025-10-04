// 这是一个简单的测试脚本，用于检查用户登录时的响应数据
// 它会帮助我们验证/api/me接口是否返回了账套信息

const fetch = require('node-fetch');

async function checkLoginResponse() {
  try {
    // 先登录获取cookie
    const loginResponse = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123' // 请替换为正确的密码
    })
  });

  if (!loginResponse.ok) {
    console.error('登录失败:', await loginResponse.text());
    return;
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('登录成功，获取到cookies');

  // 使用获取到的cookie查询用户信息
  // 使用try-catch防止请求错误导致整个脚本崩溃
  let meResponse;
  try {
    meResponse = await fetch('http://localhost:3000/api/me', {
      headers: {
        'Cookie': cookies
      }
    });
  } catch (error) {
    console.error('请求/api/me时发生网络错误:', error.message);
    return;
  }

  if (!meResponse.ok) {
    console.error('/api/me请求失败:', await meResponse.text());
    return;
  }

  const data = await meResponse.json();
  console.log('用户数据:');
  console.log(JSON.stringify(data, null, 2));
  
  // 特别检查账套数据
  console.log('\n账套数据检查:');
  console.log('是否返回了accountSets:', !!data.accountSets);
  if (data.accountSets) {
    console.log('账套数量:', data.accountSets.length);
    console.log('账套数据:', data.accountSets);
  }
  
  console.log('是否返回了defaultAccountSet:', !!data.defaultAccountSet);
  if (data.defaultAccountSet) {
    console.log('默认账套:', data.defaultAccountSet);
  }
  } catch (error) {
    console.error('整体执行过程中发生错误:', error);
  }
}

checkLoginResponse();
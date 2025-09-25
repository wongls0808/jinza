import { defineStore } from 'pinia';

interface UserState {
  token: string | null;
  userInfo: {
    username: string;
    avatar?: string;
    role?: string;
  } | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    getUserInfo: (state) => state.userInfo
  },
  
  actions: {
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
    },
    
    setUserInfo(userInfo: UserState['userInfo']) {
      this.userInfo = userInfo;
    },
    
    async login(username: string, password: string) {
      try {
        // 这里应该是实际的API请求
        // 模拟登录请求
        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            if (username === 'admin' && password === '123456') {
              this.setToken('demo-token');
              this.setUserInfo({
                username,
                avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
                role: 'admin'
              });
              resolve(true);
            } else {
              resolve(false);
            }
          }, 1000);
        });
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    
    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    async fetchUserInfo() {
      try {
        // 这里应该是实际的API请求
        // 模拟获取用户信息
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // 假设从本地存储获取用户信息
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const userData = JSON.parse(userStr);
              this.setUserInfo({
                username: userData.username,
                avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
                role: 'admin'
              });
            }
            resolve();
          }, 500);
        });
      } catch (error) {
        console.error('Fetch user info error:', error);
      }
    }
  }
});
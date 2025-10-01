// 简单的路由工具函数
export function useRouter() {
  return {
    currentRoute: ref('/'),
    navigate: (path) => {
      // 简单的导航函数
      window.history.pushState({}, '', path);
    }
  };
}
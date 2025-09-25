/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @param format 格式化模板，默认为 YYYY-MM-DD HH:mm:ss
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | number | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date);
  
  const formatObj: Record<string, number> = {
    YYYY: d.getFullYear(),
    MM: d.getMonth() + 1,
    DD: d.getDate(),
    HH: d.getHours(),
    mm: d.getMinutes(),
    ss: d.getSeconds(),
    SSS: d.getMilliseconds()
  };
  
  return format.replace(/(YYYY|MM|DD|HH|mm|ss|SSS)/g, (match) => {
    const matchValue = formatObj[match];
    if (matchValue === undefined) {
      return match;
    }
    
    let value = matchValue.toString();
    
    // 补零处理
    if (match !== 'YYYY' && match !== 'SSS') {
      value = value.padStart(2, '0');
    }
    
    return value;
  });
}

/**
 * 存储数据到localStorage
 * @param key 键名
 * @param value 数据
 */
export function setStorage(key: string, value: any): void {
  if (typeof value === 'object') {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.setItem(key, value);
  }
}

/**
 * 从localStorage获取数据
 * @param key 键名
 * @param defaultValue 默认值
 * @returns 获取的数据或默认值
 */
export function getStorage<T>(key: string, defaultValue: T | null = null): T | null {
  const data = localStorage.getItem(key);
  
  if (data === null) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(data);
  } catch (err) {
    return data as unknown as T;
  }
}

/**
 * 从localStorage移除数据
 * @param key 键名
 */
export function removeStorage(key: string): void {
  localStorage.removeItem(key);
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间，单位毫秒
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timer) {
      window.clearTimeout(timer);
    }
    
    timer = window.setTimeout(() => {
      fn.apply(context, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param interval 间隔时间，单位毫秒
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, interval: number): (...args: Parameters<T>) => void {
  let lastTime = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    const currentTime = Date.now();
    
    if (currentTime - lastTime >= interval) {
      fn.apply(context, args);
      lastTime = currentTime;
    }
  };
}
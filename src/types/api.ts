// 通用API响应类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 分页响应类型
export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 分页查询参数
export interface PageParams {
  pageNum?: number;
  pageSize?: number;
  [key: string]: any;
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  role?: string;
  status: number;
  lastLoginTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 登录请求参数
export interface LoginParams {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResult {
  token: string;
  user: User;
}

// 分类类型
export interface Category {
  id: number;
  name: string;
  parentId: number;
  sort: number;
  status: number;
  description?: string;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

// 内容类型
export interface Content {
  id: number;
  title: string;
  categoryId: number;
  categoryName?: string;
  content: string;
  summary?: string;
  thumbnail?: string;
  author?: string;
  viewCount: number;
  status: number;
  publishTime?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

// 系统设置类型
export interface SystemSetting {
  id: number;
  siteTitle: string;
  siteLogo?: string;
  siteDesc?: string;
  siteKeywords?: string;
  recordNumber?: string; // 备案号
  contactInfo?: string;
  enableRegistration: number; // 0-关闭，1-开启
  createdAt?: string;
  updatedAt?: string;
}
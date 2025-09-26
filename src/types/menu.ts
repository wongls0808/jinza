export interface MenuItem {
  id: string;
  title: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  description?: string;
  badge?: number | string;
  badgeType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  externalLink?: boolean;
  permissions?: string[];
}

export interface MenuState {
  menuItems: MenuItem[];
}
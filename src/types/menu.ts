export interface MenuItem {
  id: string;
  title: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
}

export interface MenuState {
  menuItems: MenuItem[];
}
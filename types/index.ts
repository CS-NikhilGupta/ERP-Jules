export type UserRole = 'admin' | 'sales' | 'warehouse';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type ProductFinish = 'Gold' | 'Chrome' | 'Black' | 'Brass' | 'Nickel';

export interface Product {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  category: string;
  finish: ProductFinish;
  price_retail: number;
  price_dealer: number;
  stock_warehouse: number;
  stock_showroom: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

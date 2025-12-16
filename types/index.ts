export type UserRole = 'admin' | 'sales' | 'warehouse';

export interface Store {
    id: string;
    name: string;
    address: string;
    logo_url: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  store_id?: string;
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
  // Stock is now derived from Inventory join
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

export interface CartItem extends Product {
  quantity: number;
  discount: number; // Percentage
}

export interface QuoteDetails {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  laborCharges: number;
}

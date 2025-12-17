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
  price_retail: number; // This is now MRP (List Price)
  price_dealer: number;
  stock_warehouse: number;
  stock_showroom: number;
  // New Fields
  hsn_code?: string;
  gst_rate: number; // 0, 5, 12, 18, 28
  cost_price?: number;
  income_account_id?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_spent: number;
  store_id?: string;
}

export interface CartItem extends Product {
  quantity: number;
  discount: number; // Percentage
}

export interface QuoteDetails {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerId?: string; // Link to real customer
  laborCharges: number;
}

export type OrderStatus = 'quote' | 'completed';

export interface Order {
    id: string;
    order_number: number;
    created_at: string;
    total: number;
    customer_info: QuoteDetails; // Snapshot
    customer_id?: string;
    store_id: string;
    status: OrderStatus;
    items?: OrderItem[]; // Optional for detail view
    salesperson_id?: string;
}

export interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price: number; // Net Rate (after discount)
    discount: number;
    tax_rate?: number; // Snapshot of GST rate
    tax_amount?: number;
    product?: Product; // Joined data
}

// Accounting Interfaces
export interface Account {
    id: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
    store_id: string;
}

export interface JournalEntry {
    id: string;
    date: string;
    reference: string; // e.g., Order #1001
    description: string;
    store_id: string;
    lines?: JournalLine[];
}

export interface JournalLine {
    id: string;
    journal_entry_id: string;
    account_id: string;
    description: string;
    debit: number;
    credit: number;
    account?: Account;
}

import { create } from 'zustand';
import { User, Product, CartItem, QuoteDetails } from '@/types';

interface AppState {
  currentUser: User;
  products: Product[];
  cart: CartItem[];
  quoteDetails: QuoteDetails;

  receiveStock: (productId: string, amount: number, location: 'warehouse' | 'showroom') => void;
  setUserRole: (role: User['role']) => void;

  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setQuoteDetails: (details: Partial<QuoteDetails>) => void;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'LGT-001',
    name: 'Crystal Chandelier',
    imageUrl: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=2515&auto=format&fit=crop',
    category: 'Chandelier',
    finish: 'Gold',
    price_retail: 1200.00,
    price_dealer: 600.00,
    stock_warehouse: 15,
    stock_showroom: 2,
  },
  {
    id: '2',
    sku: 'LGT-002',
    name: 'Vintage Wall Sconce',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=2670&auto=format&fit=crop',
    category: 'Sconce',
    finish: 'Brass',
    price_retail: 250.00,
    price_dealer: 125.00,
    stock_warehouse: 45,
    stock_showroom: 5,
  },
  {
    id: '3',
    sku: 'LGT-003',
    name: 'Modern Pendant Light',
    imageUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=2535&auto=format&fit=crop',
    category: 'Pendant',
    finish: 'Black',
    price_retail: 350.00,
    price_dealer: 175.00,
    stock_warehouse: 30,
    stock_showroom: 4,
  },
  {
    id: '4',
    sku: 'LGT-004',
    name: 'Industrial Floor Lamp',
    imageUrl: 'https://images.unsplash.com/photo-1513506003013-0806a55a304d?q=80&w=2670&auto=format&fit=crop',
    category: 'Floor Lamp',
    finish: 'Nickel',
    price_retail: 450.00,
    price_dealer: 225.00,
    stock_warehouse: 10,
    stock_showroom: 1,
  },
  {
    id: '5',
    sku: 'LGT-005',
    name: 'Art Deco Table Lamp',
    imageUrl: 'https://images.unsplash.com/photo-1534349762913-961123f206f3?q=80&w=2538&auto=format&fit=crop',
    category: 'Table Lamp',
    finish: 'Chrome',
    price_retail: 180.00,
    price_dealer: 90.00,
    stock_warehouse: 20,
    stock_showroom: 3,
  },
];

export const useStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'u1',
    name: 'Demo User',
    role: 'admin', // Default role
  },
  products: INITIAL_PRODUCTS,
  cart: [],
  quoteDetails: {
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    laborCharges: 0,
  },

  receiveStock: (productId, amount, location) => set((state) => ({
    products: state.products.map((p) => {
      if (p.id !== productId) return p;
      return {
        ...p,
        stock_warehouse: location === 'warehouse' ? p.stock_warehouse + amount : p.stock_warehouse,
        stock_showroom: location === 'showroom' ? p.stock_showroom + amount : p.stock_showroom,
      };
    }),
  })),

  setUserRole: (role) => set((state) => ({
    currentUser: { ...state.currentUser, role }
  })),

  addToCart: (product, quantity = 1) => {
    const { cart } = get();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        cart: [...cart, { ...product, quantity, discount: 0 }],
      });
    }
  },

  updateCartItem: (productId, updates) => set((state) => ({
    cart: state.cart.map((item) =>
      item.id === productId ? { ...item, ...updates } : item
    ),
  })),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== productId),
  })),

  clearCart: () => set({ cart: [] }),

  setQuoteDetails: (details) => set((state) => ({
    quoteDetails: { ...state.quoteDetails, ...details }
  })),
}));

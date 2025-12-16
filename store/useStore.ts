import { create } from 'zustand';
import { User, Product, CartItem, QuoteDetails, Store } from '@/types';
import { supabase } from '@/lib/supabaseClient';

interface AppState {
  currentUser: User | null;
  currentStore: Store | null;
  products: Product[];
  cart: CartItem[];
  quoteDetails: QuoteDetails;

  isLoading: boolean;

  fetchUserSession: () => Promise<void>;
  fetchInventory: () => Promise<void>;

  receiveStock: (productId: string, amount: number, location: 'warehouse' | 'showroom') => Promise<void>;

  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setQuoteDetails: (details: Partial<QuoteDetails>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentStore: null,
  products: [],
  cart: [],
  quoteDetails: {
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    laborCharges: 0,
  },
  isLoading: false,

  fetchUserSession: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          set({ currentUser: null, currentStore: null });
          return;
      }

      // Fetch Profile to get Role and Store ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
          set({
              currentUser: {
                  id: session.user.id,
                  email: session.user.email!,
                  role: profile.role as any,
                  store_id: profile.store_id
              }
          });

          if (profile.store_id) {
              // Fetch Store Details
              const { data: store } = await supabase.from('stores').select('*').eq('id', profile.store_id).single();
              if (store) {
                  set({ currentStore: store });
              }
          }
      }
  },

  fetchInventory: async () => {
      const { currentUser } = get();
      if (!currentUser?.store_id) return;

      set({ isLoading: true });

      // 1. Fetch Master Products
      const { data: products, error: prodError } = await supabase.from('products').select('*');
      if (prodError) {
          console.error("Error fetching products", prodError);
          set({ isLoading: false });
          return;
      }

      // 2. Fetch Inventory for this Store
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('store_id', currentUser.store_id);

      if (invError) {
          console.error("Error fetching inventory", invError);
          set({ isLoading: false });
          return;
      }

      // 3. Merge Data
      const mergedProducts: Product[] = products.map((p: any) => {
          const invItem = inventory?.find((i: any) => i.product_id === p.id);
          return {
              id: p.id,
              sku: p.sku,
              name: p.name,
              imageUrl: p.image_url,
              category: p.category,
              finish: p.finish,
              price_retail: p.price_retail,
              price_dealer: p.price_dealer,
              stock_warehouse: invItem ? invItem.stock_warehouse : 0,
              stock_showroom: invItem ? invItem.stock_showroom : 0,
          }
      });

      set({ products: mergedProducts, isLoading: false });
  },

  receiveStock: async (productId, amount, location) => {
    const { currentUser, products } = get();
    if (!currentUser?.store_id) return;

    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    // Calculate new total
    const newWarehouse = location === 'warehouse' ? currentProduct.stock_warehouse + amount : currentProduct.stock_warehouse;
    const newShowroom = location === 'showroom' ? currentProduct.stock_showroom + amount : currentProduct.stock_showroom;

    // Optimistic Update
    set((state) => ({
        products: state.products.map((p) => {
            if (p.id !== productId) return p;
            return {
                ...p,
                stock_warehouse: newWarehouse,
                stock_showroom: newShowroom
            }
        })
    }));

    // DB Update
    // Check if inventory record exists
    const { data: existingInv } = await supabase
        .from('inventory')
        .select('id')
        .eq('store_id', currentUser.store_id)
        .eq('product_id', productId)
        .single();

    if (existingInv) {
        await supabase.from('inventory').update({
            stock_warehouse: newWarehouse,
            stock_showroom: newShowroom
        }).eq('id', existingInv.id);
    } else {
        await supabase.from('inventory').insert({
            store_id: currentUser.store_id,
            product_id: productId,
            stock_warehouse: newWarehouse,
            stock_showroom: newShowroom
        });
    }
  },

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

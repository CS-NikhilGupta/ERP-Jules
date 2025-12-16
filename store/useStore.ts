import { create } from 'zustand';
import { User, Product, CartItem, QuoteDetails, Store, ProductFinish } from '@/types';
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

  // Add Product
  addProduct: (
      productData: {
          sku: string;
          name: string;
          category: string;
          price_retail: number;
          imageUrl: string;
          finish?: string; // Optional input, defaults in logic
      },
      initialStock: number
  ) => Promise<void>;

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

      const { data: products, error: prodError } = await supabase.from('products').select('*');
      if (prodError) {
          console.error("Error fetching products", prodError);
          set({ isLoading: false });
          return;
      }

      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('store_id', currentUser.store_id);

      if (invError) {
          console.error("Error fetching inventory", invError);
          set({ isLoading: false });
          return;
      }

      const mergedProducts: Product[] = products.map((p: any) => {
          const invItem = inventory?.find((i: any) => i.product_id === p.id);
          return {
              id: p.id,
              sku: p.sku,
              name: p.name,
              imageUrl: p.image_url,
              category: p.category,
              finish: p.finish as ProductFinish,
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

    const newWarehouse = location === 'warehouse' ? currentProduct.stock_warehouse + amount : currentProduct.stock_warehouse;
    const newShowroom = location === 'showroom' ? currentProduct.stock_showroom + amount : currentProduct.stock_showroom;

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

  addProduct: async (productData, initialStock) => {
      const { currentUser, fetchInventory } = get();
      if (!currentUser?.store_id) throw new Error("No store context");

      // 1. Insert into Products
      const { data: newProduct, error: prodError } = await supabase
          .from('products')
          .insert({
              sku: productData.sku,
              name: productData.name,
              category: productData.category,
              image_url: productData.imageUrl,
              price_retail: productData.price_retail,
              price_dealer: productData.price_retail * 0.5, // Default logic
              finish: productData.finish || 'Standard'
          })
          .select()
          .single();

      if (prodError) throw prodError;
      if (!newProduct) throw new Error("Failed to create product");

      // 2. Insert into Inventory for current Store
      // Assuming initial stock goes to Warehouse for now, or split?
      // User said "Initial Stock". We'll put it in Warehouse.
      const { error: invError } = await supabase
          .from('inventory')
          .insert({
              store_id: currentUser.store_id,
              product_id: newProduct.id,
              stock_warehouse: initialStock,
              stock_showroom: 0
          });

      if (invError) throw invError;

      // 3. Refresh
      await fetchInventory();
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

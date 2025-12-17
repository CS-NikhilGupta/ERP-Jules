import { create } from 'zustand';
import { User, Product, CartItem, QuoteDetails, Store, ProductFinish } from '@/types';
import { supabase } from '@/lib/supabaseClient';

export interface Order {
    id: string;
    created_at: string;
    total: number;
    customer_info: QuoteDetails;
    store_id: string;
}

interface Analytics {
    revenue: number;
    ordersCount: number;
    lowStockCount: number;
    recentOrders: Order[];
}

interface AppState {
  currentUser: User | null;
  currentStore: Store | null;
  products: Product[];
  cart: CartItem[];
  quoteDetails: QuoteDetails;
  orders: Order[]; // For history
  analytics: Analytics;

  isLoading: boolean;

  fetchUserSession: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;

  receiveStock: (productId: string, amount: number, location: 'warehouse' | 'showroom') => Promise<void>;

  // Product Management
  addProduct: (productData: any, initialStock: number) => Promise<void>;
  updateProduct: (productId: string, productData: any) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;

  // Order Management
  createOrder: () => Promise<void>;

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
  orders: [],
  quoteDetails: {
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    laborCharges: 0,
  },
  analytics: {
      revenue: 0,
      ordersCount: 0,
      lowStockCount: 0,
      recentOrders: []
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

      const { data: products, error: prodError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
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

  fetchOrders: async () => {
      const { currentUser } = get();
      if (!currentUser?.store_id) return;

      const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', currentUser.store_id)
          .order('created_at', { ascending: false });

      if (!error && orders) {
          set({ orders: orders as any });
      }
  },

  fetchAnalytics: async () => {
      const { currentUser } = get();
      if (!currentUser?.store_id) return;

      // 1. Fetch Orders for this store
      const { data: orders } = await supabase
          .from('orders')
          .select('total, created_at')
          .eq('store_id', currentUser.store_id);

      const revenue = orders?.reduce((acc: number, order: { total: number | null }) => acc + (order.total || 0), 0) || 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      const ordersThisMonth = orders?.filter((o: { created_at: string }) => new Date(o.created_at).getTime() >= startOfMonth.getTime()).length || 0;

      // 2. Low Stock (Local inventory check)
      // We need fresh inventory data, so let's use the 'products' state if populated, or fetch logic
      // Ideally we run a count query on DB, but for now we iterate fetched products
      // We will assume fetchInventory has run or we run it lightly.
      // Let's rely on what we have in memory for efficiency or run a quick count.
      const { data: lowStockItems } = await supabase
          .from('inventory')
          .select('id')
          .eq('store_id', currentUser.store_id)
          .lt('stock_warehouse', 5); // Example threshold

      const lowStockCount = lowStockItems?.length || 0;

      // 3. Recent Orders
      const { data: recentOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', currentUser.store_id)
          .order('created_at', { ascending: false })
          .limit(5);

      set({
          analytics: {
              revenue,
              ordersCount: ordersThisMonth,
              lowStockCount,
              recentOrders: (recentOrders as any) || []
          }
      });
  },

  receiveStock: async (productId, amount, location) => {
    const { currentUser, products } = get();
    if (!currentUser?.store_id) return;

    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

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
              price_dealer: productData.price_retail * 0.5,
              finish: productData.finish || 'Standard'
          })
          .select()
          .single();

      if (prodError) throw prodError;
      if (!newProduct) throw new Error("Failed to create product");

      // 2. Insert into Inventory
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

  updateProduct: async (productId, productData) => {
      const { fetchInventory } = get();

      const { error } = await supabase
          .from('products')
          .update({
              sku: productData.sku,
              name: productData.name,
              category: productData.category,
              image_url: productData.imageUrl,
              price_retail: productData.price_retail,
              finish: productData.finish
          })
          .eq('id', productId);

      if (error) throw error;
      await fetchInventory();
  },

  deleteProduct: async (productId) => {
      const { fetchInventory } = get();

      // Cascade delete handles inventory/order_items if set up in SQL (ON DELETE CASCADE)
      // My SQL script added ON DELETE CASCADE for inventory.
      const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

      if (error) throw error;
      await fetchInventory();
  },

  createOrder: async () => {
      const { currentUser, cart, quoteDetails, clearCart } = get();
      if (!currentUser?.store_id) throw new Error("No store context");
      if (cart.length === 0) throw new Error("Cart is empty");

      // Calculate Total
      const subtotal = cart.reduce((sum, item) => {
        const itemTotal = (item.price_retail * item.quantity) * ((100 - item.discount) / 100);
        return sum + itemTotal;
      }, 0);
      const gst = (subtotal + (quoteDetails.laborCharges || 0)) * 0.18;
      const grandTotal = subtotal + (quoteDetails.laborCharges || 0) + gst;

      // 1. Insert Order
      const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
              store_id: currentUser.store_id,
              customer_info: quoteDetails,
              total: grandTotal
          })
          .select()
          .single();

      if (orderError) throw orderError;

      // 2. Insert Items & Decrement Stock
      for (const item of cart) {
          // Insert Item
          await supabase.from('order_items').insert({
              order_id: order.id,
              product_id: item.id,
              quantity: item.quantity,
              price: item.price_retail,
              discount: item.discount
          });

          // Decrement Stock (Prefer RPC for atomic, but read-update-write ok for MVP)
          // We assume 'Showroom' stock is sold first? Or Warehouse?
          // Let's assume Showroom for retail sales.

          // Get current stock logic
          // Ideally we call an RPC function `decrement_stock(product_id, store_id, qty)`
          // For now, client side logic:

          const { data: inv } = await supabase
            .from('inventory')
            .select('*')
            .eq('store_id', currentUser.store_id)
            .eq('product_id', item.id)
            .single();

          if (inv) {
              // Simple logic: reduce showroom, then warehouse if needed?
              // Or just reduce warehouse. User didn't specify.
              // Let's reduce Warehouse as default "Stock".
              const newStock = Math.max(0, inv.stock_warehouse - item.quantity);
              await supabase.from('inventory').update({ stock_warehouse: newStock }).eq('id', inv.id);
          }
      }

      // 3. Clear Cart (UI will then print)
      // Note: We might want to keep the data visible for the print dialog even after "Create Order".
      // But typically "Save" happens -> Clear -> Redirect or Show Success.
      // For "Save & Print", we probably shouldn't clear immediately or we lose the print view.
      // We will handle clearing in the Component after Print is triggered.
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

import { create } from 'zustand';
import { User, Product, CartItem, QuoteDetails, Store, ProductFinish, Order, Customer, OrderStatus, Account, JournalEntry } from '@/types';
import { supabase } from '@/lib/supabaseClient';

interface Analytics {
    revenue: number;
    ordersCount: number;
    lowStockCount: number;
    recentOrders: Order[];
    salesByPerson: { name: string, total: number }[];
}

interface AppState {
  currentUser: User | null;
  currentStore: Store | null;
  products: Product[];
  cart: CartItem[];
  customers: Customer[];
  orders: Order[];
  quotes: Order[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  analytics: Analytics;
  quoteDetails: QuoteDetails;

  isLoading: boolean;

  fetchUserSession: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchJournalEntries: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;

  receiveStock: (productId: string, amount: number, location: 'warehouse' | 'showroom') => Promise<void>;

  // Product Management
  addProduct: (productData: any, initialStock: number) => Promise<void>;
  updateProduct: (productId: string, productData: any) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;

  // Customer Management
  createCustomer: (customerData: Partial<Customer>) => Promise<Customer>;
  searchCustomerByPhone: (phone: string) => Promise<Customer | null>;

  // Order/Quote Management
  createOrder: (status: OrderStatus) => Promise<void>;
  convertQuoteToSale: (orderId: string) => Promise<void>;
  fetchOrderDetails: (orderId: string) => Promise<void>;

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
  customers: [],
  orders: [],
  quotes: [],
  accounts: [],
  journalEntries: [],
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
      recentOrders: [],
      salesByPerson: []
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
              // New Fields
              hsn_code: p.hsn_code,
              gst_rate: p.gst_rate || 0,
              cost_price: p.cost_price,
              income_account_id: p.income_account_id
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
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

      if (!error && orders) {
          set({ orders: orders as any });
      }
  },

  fetchQuotes: async () => {
      const { currentUser } = get();
      if (!currentUser?.store_id) return;

      const { data: quotes, error } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', currentUser.store_id)
          .eq('status', 'quote')
          .order('created_at', { ascending: false });

      if (!error && quotes) {
          set({ quotes: quotes as any });
      }
  },

  fetchCustomers: async () => {
      const { currentUser } = get();
      if (!currentUser?.store_id) return;

      const { data: customers, error } = await supabase
          .from('customers')
          .select('*')
          .order('name', { ascending: true });

      if (!error && customers) {
          set({ customers: customers as any });
      }
  },

  fetchAccounts: async () => {
    const { currentUser } = get();
    if (!currentUser?.store_id) return;

    const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('store_id', currentUser.store_id);

    if (!error && accounts) {
        set({ accounts: accounts as any });
    }
  },

  fetchJournalEntries: async () => {
      const { currentUser } = get();
      if (!currentUser?.store_id) return;

      const { data: entries, error } = await supabase
          .from('journal_entries')
          .select('*, lines:journal_lines(*, account:accounts(*))')
          .eq('store_id', currentUser.store_id)
          .order('date', { ascending: false });

      if (!error && entries) {
          set({ journalEntries: entries as any });
      }
  },

  createCustomer: async (customerData) => {
      const { currentUser } = get();
      if (!currentUser?.store_id) throw new Error("No store context");

      const { data, error } = await supabase
          .from('customers')
          .insert({
              ...customerData,
              store_id: currentUser.store_id
          })
          .select()
          .single();

      if (error) throw error;
      return data;
  },

  searchCustomerByPhone: async (phone) => {
      const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', phone)
          .single();

      if (error && error.code !== 'PGRST116') {
          console.error("Search error", error);
      }
      return data;
  },

  fetchAnalytics: async () => {
      const { currentUser } = get();
      if (!currentUser?.store_id) return;

      const { data: orders } = await supabase
          .from('orders')
          .select('total, created_at, status, salesperson_id')
          .eq('store_id', currentUser.store_id)
          .eq('status', 'completed');

      const revenue = orders?.reduce((acc: number, order: { total: number | null }) => acc + (order.total || 0), 0) || 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      const ordersThisMonth = orders?.filter((o: { created_at: string }) => new Date(o.created_at).getTime() >= startOfMonth.getTime()).length || 0;

      // Calculate Sales by Person
      const salesMap = new Map<string, number>();
      orders?.forEach((o: any) => {
          if (o.salesperson_id) {
              const current = salesMap.get(o.salesperson_id) || 0;
              salesMap.set(o.salesperson_id, current + (o.total || 0));
          }
      });

      const salesByPerson: { name: string, total: number }[] = [];
      if (salesMap.size > 0) {
          const ids = Array.from(salesMap.keys());
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', ids);

          profiles?.forEach((p: any) => {
              salesByPerson.push({
                  name: p.email,
                  total: salesMap.get(p.id) || 0
              });
          });
      }

      const { data: lowStockItems } = await supabase
          .from('inventory')
          .select('id')
          .eq('store_id', currentUser.store_id)
          .lt('stock_showroom', 5);

      const lowStockCount = lowStockItems?.length || 0;

      const { data: recentOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', currentUser.store_id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);

      set({
          analytics: {
              revenue,
              ordersCount: ordersThisMonth,
              lowStockCount,
              recentOrders: (recentOrders as any) || [],
              salesByPerson
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

      const { data: newProduct, error: prodError } = await supabase
          .from('products')
          .insert({
              sku: productData.sku,
              name: productData.name,
              category: productData.category,
              image_url: productData.imageUrl,
              price_retail: productData.price_retail,
              price_dealer: productData.price_dealer,
              finish: productData.finish || 'Standard',
              hsn_code: productData.hsn_code,
              gst_rate: productData.gst_rate,
              cost_price: productData.cost_price,
              income_account_id: productData.income_account_id
          })
          .select()
          .single();

      if (prodError) throw prodError;
      if (!newProduct) throw new Error("Failed to create product");

      const { error: invError } = await supabase
          .from('inventory')
          .insert({
              store_id: currentUser.store_id,
              product_id: newProduct.id,
              stock_warehouse: initialStock,
              stock_showroom: 0
          });

      if (invError) throw invError;
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
              finish: productData.finish,
              hsn_code: productData.hsn_code,
              gst_rate: productData.gst_rate,
              cost_price: productData.cost_price,
              income_account_id: productData.income_account_id
          })
          .eq('id', productId);

      if (error) throw error;
      await fetchInventory();
  },

  deleteProduct: async (productId) => {
      const { fetchInventory } = get();
      const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

      if (error) throw error;
      await fetchInventory();
  },

  createOrder: async (status: OrderStatus) => {
      const { currentUser, cart, quoteDetails, accounts } = get();
      if (!currentUser?.store_id) throw new Error("No store context");
      if (cart.length === 0) throw new Error("Cart is empty");

      // Calculate totals based on New Formula
      let subtotalNet = 0;
      let totalTax = 0;

      const orderItems = cart.map(item => {
          const netRate = item.price_retail * (1 - item.discount / 100);
          const taxAmount = netRate * (item.gst_rate / 100);

          subtotalNet += netRate * item.quantity;
          totalTax += taxAmount * item.quantity;

          return {
            product_id: item.id,
            quantity: item.quantity,
            price: netRate,
            discount: item.discount,
            tax_rate: item.gst_rate,
            tax_amount: taxAmount
          };
      });

      const grandTotal = subtotalNet + totalTax + (quoteDetails.laborCharges || 0);

      // 1. Insert Order
      const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
              store_id: currentUser.store_id,
              customer_id: quoteDetails.customerId,
              customer_info: quoteDetails,
              total: grandTotal,
              status: status,
              salesperson_id: currentUser.id
          })
          .select()
          .single();

      if (orderError) throw orderError;

      // 2. Insert Items
      const { error: itemsError } = await supabase.from('order_items').insert(
          orderItems.map(i => ({ ...i, order_id: order.id }))
      );
      if (itemsError) throw itemsError;

      // 3. Decrement Stock & Create Journal (Completed Only)
      if (status === 'completed') {
          // A. Stock
          for (const item of cart) {
              const { data: inv } = await supabase
                .from('inventory')
                .select('*')
                .eq('store_id', currentUser.store_id)
                .eq('product_id', item.id)
                .single();

              if (inv) {
                  const newStock = Math.max(0, inv.stock_showroom - item.quantity);
                  await supabase.from('inventory').update({ stock_showroom: newStock }).eq('id', inv.id);
              }
          }

          // B. Accounting
          const arAccount = accounts.find(a => a.name === 'Accounts Receivable' || a.type === 'asset');
          const gstAccount = accounts.find(a => a.name === 'GST Payable' || a.type === 'liability');

          const revenueByAccount: Record<string, number> = {};
          cart.forEach(item => {
              const accountId = item.income_account_id || accounts.find(a => a.type === 'income')?.id;
              if (accountId) {
                  const netVal = (item.price_retail * (1 - item.discount / 100)) * item.quantity;
                  revenueByAccount[accountId] = (revenueByAccount[accountId] || 0) + netVal;
              }
          });

          if (arAccount && gstAccount) {
              const { data: entry, error: journalError } = await supabase
                  .from('journal_entries')
                  .insert({
                      date: new Date().toISOString(),
                      reference: `Order #${order.order_number || order.id.slice(0, 8)}`,
                      description: `Sales Invoice for ${quoteDetails.customerName}`,
                      store_id: currentUser.store_id
                  })
                  .select()
                  .single();

              if (!journalError && entry) {
                  const lines = [];

                  // Debit AR
                  lines.push({
                      journal_entry_id: entry.id,
                      account_id: arAccount.id,
                      description: 'Accounts Receivable',
                      debit: grandTotal,
                      credit: 0
                  });

                  // Credit GST
                  if (totalTax > 0) {
                    lines.push({
                        journal_entry_id: entry.id,
                        account_id: gstAccount.id,
                        description: 'GST Output Tax',
                        debit: 0,
                        credit: totalTax
                    });
                  }

                  // Credit Revenue
                  for (const [accId, amount] of Object.entries(revenueByAccount)) {
                      lines.push({
                          journal_entry_id: entry.id,
                          account_id: accId,
                          description: 'Product Sales Revenue',
                          debit: 0,
                          credit: amount
                      });
                  }

                  // Credit Labor Revenue
                  const laborAmount = quoteDetails.laborCharges || 0;
                  if (laborAmount > 0) {
                      const serviceAccount = accounts.find(a => a.name.includes('Service') || a.name.includes('Labor')) || accounts.find(a => a.type === 'income');
                      if (serviceAccount) {
                          lines.push({
                              journal_entry_id: entry.id,
                              account_id: serviceAccount.id,
                              description: 'Service Revenue',
                              debit: 0,
                              credit: laborAmount
                          });
                      }
                  }

                  await supabase.from('journal_lines').insert(lines);
              }
          }
      }
  },

  convertQuoteToSale: async (orderId) => {
      const { currentUser, accounts, orders } = get();
      if (!currentUser?.store_id) throw new Error("No store context");

      // 1. Fetch Order Items
      const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('*, product:products(*)')
        .eq('order_id', orderId);

      if (itemsErr || !items) throw new Error("Failed to fetch items for conversion");

      // 2. Update Status
      const { data: order, error } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', orderId)
          .select()
          .single();

      if (error) throw error;

      // 3. Decrement Stock
      for (const item of items) {
          const { data: inv } = await supabase
            .from('inventory')
            .select('*')
            .eq('store_id', currentUser.store_id)
            .eq('product_id', item.product_id)
            .single();

          if (inv) {
              const newStock = Math.max(0, inv.stock_showroom - item.quantity);
              await supabase.from('inventory').update({ stock_showroom: newStock }).eq('id', inv.id);
          }
      }

      // 4. Create Journal Entry
      const arAccount = accounts.find(a => a.name === 'Accounts Receivable' || a.type === 'asset');
      const gstAccount = accounts.find(a => a.name === 'GST Payable' || a.type === 'liability');

      let totalTax = 0;
      const revenueByAccount: Record<string, number> = {};

      items.forEach((item: any) => {
          const netTotal = item.price * item.quantity;
          totalTax += (item.tax_amount || 0) * item.quantity;

          const accId = item.product?.income_account_id || accounts.find(a => a.type === 'income')?.id;
          if (accId) {
              revenueByAccount[accId] = (revenueByAccount[accId] || 0) + netTotal;
          }
      });

      if (arAccount && gstAccount && order) {
          const { data: entry } = await supabase
              .from('journal_entries')
              .insert({
                  date: new Date().toISOString(),
                  reference: `Order #${order.order_number || order.id.slice(0, 8)}`,
                  description: `Sales Invoice for ${order.customer_info?.customerName}`,
                  store_id: currentUser.store_id
              })
              .select()
              .single();

          if (entry) {
              const lines = [];
               // Debit AR
               lines.push({
                  journal_entry_id: entry.id,
                  account_id: arAccount.id,
                  description: 'Accounts Receivable',
                  debit: order.total,
                  credit: 0
              });

               // Credit GST
               if (totalTax > 0) {
                    lines.push({
                        journal_entry_id: entry.id,
                        account_id: gstAccount.id,
                        description: 'GST Output Tax',
                        debit: 0,
                        credit: totalTax
                    });
                }

                // Credit Revenue
                for (const [accId, amount] of Object.entries(revenueByAccount)) {
                    lines.push({
                        journal_entry_id: entry.id,
                        account_id: accId,
                        description: 'Product Sales Revenue',
                        debit: 0,
                        credit: amount
                    });
                }

                // Credit Labor Revenue (assuming order.total includes labor, which it does from createOrder)
                // We need to calculate labor part from order.total - productTotals?
                // Or just use quoteDetails if available?
                // Order object has customer_info which is QuoteDetails.
                const laborAmount = order.customer_info?.laborCharges || 0;

                if (laborAmount > 0) {
                    const serviceAccount = accounts.find(a => a.name.includes('Service') || a.name.includes('Labor')) || accounts.find(a => a.type === 'income');
                    if (serviceAccount) {
                        lines.push({
                            journal_entry_id: entry.id,
                            account_id: serviceAccount.id,
                            description: 'Service Revenue',
                            debit: 0,
                            credit: laborAmount
                        });
                    }
                }

                await supabase.from('journal_lines').insert(lines);
          }
      }
  },

  fetchOrderDetails: async (orderId) => {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*, product:products(*)')
        .eq('order_id', orderId);

      if (error) {
          console.error("Error fetching order details", error);
          return;
      }

      set((state) => ({
          orders: state.orders.map(o => o.id === orderId ? { ...o, items: items as any } : o),
          quotes: state.quotes.map(q => q.id === orderId ? { ...q, items: items as any } : q)
      }));
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '../types';
import { supabase } from '../lib/supabase';

interface CartState {
  items: CartItem[];
  sessionId: string;
  addItem: (product: Product, quantity: number) => Promise<void>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  loadCartFromDatabase: (userId: string) => Promise<void>;
  syncCartToDatabase: (userId: string) => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: crypto.randomUUID(),
      
      addItem: async (product, quantity) => {
        const items = get().items;
        const existingItem = items.find(item => item.product_id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product_id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          const newItem: CartItem = {
            id: crypto.randomUUID(),
            product_id: product.id,
            quantity,
            shop_id: product.shop_id,
            session_id: get().sessionId,
            created_at: new Date().toISOString(),
            product
          };
          
          set({
            items: [...items, newItem]
          });
        }

        // Sync to database if user is authenticated
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await get().syncCartToDatabase(user.id);
          }
        } catch (error) {
          console.error('Error syncing cart to database:', error);
        }
      },
      
      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.product_id !== productId)
        });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.product_id === productId
              ? { ...item, quantity }
              : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => {
          return total + (item.product?.price || 0) * item.quantity;
        }, 0);
      },

      loadCartFromDatabase: async (userId: string) => {
        try {
          const { data: cartItems, error } = await supabase
            .from('cart_items')
            .select(`
              *,
              product:products(
                *,
                shop:shops(*)
              )
            `)
            .eq('customer_id', userId);

          if (error) throw error;

          if (cartItems) {
            set({ items: cartItems });
          }
        } catch (error) {
          console.error('Error loading cart from database:', error);
        }
      },

      syncCartToDatabase: async (userId: string) => {
        try {
          const items = get().items;
          
          // Delete existing cart items for this user
          await supabase
            .from('cart_items')
            .delete()
            .eq('customer_id', userId);

          // Insert current cart items
          if (items.length > 0) {
            const cartItemsToInsert = items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              shop_id: item.shop_id,
              customer_id: userId,
              session_id: item.session_id
            }));

            await supabase
              .from('cart_items')
              .insert(cartItemsToInsert);
          }
        } catch (error) {
          console.error('Error syncing cart to database:', error);
        }
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);
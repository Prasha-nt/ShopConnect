import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  sessionId: string;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: crypto.randomUUID(), // Unique session for each user/device

      addItem: (product, quantity) => {
        const existingItem = get().items.find(item => item.product_id === product.id);

        if (existingItem) {
          set({
            items: get().items.map(item =>
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
            items: [...get().items, newItem]
          });
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
      }
    }),
    {
      name: 'cart-storage' // LocalStorage key
    }
  )
);

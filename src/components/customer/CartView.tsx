import React from 'react';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface CartViewProps {
  onClose: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onClose }) => {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();

  const handleCheckout = async () => {
    try {
      const customer_id = supabase.auth.getUser()?.user?.id;
      const session_id = uuidv4();
      const shop_id = items[0]?.shop_id;
      const total_amount = getTotal();

      if (!customer_id) {
        toast.error("You must be logged in to checkout.");
        return;
      }

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: "Guest", // Replace with actual name from form
          customer_email: "guest@example.com", // Replace with real user
          customer_phone: "0000000000",
          status: "pending",
          total_amount,
          shop_id,
          session_id
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert into order_items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price ?? 0,
      }));

      const { error: itemError } = await supabase.from('order_items').insert(orderItems);
      if (itemError) throw itemError;

      toast.success("Order placed successfully!");

      clearCart();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong during checkout.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-600 mb-4">Add some products to get started</p>
        <Button onClick={onClose}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-4">
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <img
              src={item.product?.image_url || 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg'}
              alt={item.product?.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{item.product?.title}</h4>
              <p className="text-sm text-gray-600">{formatPrice(item.product?.price || 0)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.product_id)}
              className="p-2 hover:bg-red-100 rounded text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-xl font-bold text-green-600">
            {formatPrice(getTotal())}
          </span>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={clearCart} className="flex-1">
            Clear Cart
          </Button>
          <Button onClick={handleCheckout} className="flex-1">
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

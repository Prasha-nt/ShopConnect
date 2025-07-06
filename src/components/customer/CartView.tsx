import React, { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, User, Phone, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

interface CartViewProps {
  onClose: () => void;
}

interface CheckoutFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export const CartView: React.FC<CartViewProps> = ({ onClose }) => {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { user } = useAuthStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CheckoutFormData>({
    defaultValues: {
      customer_name: '',
      customer_email: user?.email || '',
      customer_phone: ''
    }
  });

  // Group items by shop
  const itemsByShop = items.reduce((acc, item) => {
    const shopId = item.shop_id;
    if (!acc[shopId]) {
      acc[shopId] = [];
    }
    acc[shopId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      updateQuantity(productId, newQuantity);
      
      // Update in database if user is authenticated
      if (user) {
        const item = items.find(i => i.product_id === productId);
        if (item) {
          if (newQuantity === 0) {
            await supabase
              .from('cart_items')
              .delete()
              .eq('product_id', productId)
              .eq('customer_id', user.id);
          } else {
            await supabase
              .from('cart_items')
              .upsert({
                product_id: productId,
                quantity: newQuantity,
                shop_id: item.shop_id,
                customer_id: user.id,
                session_id: item.session_id
              });
          }
        }
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      removeItem(productId);
      
      // Remove from database if user is authenticated
      if (user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('product_id', productId)
          .eq('customer_id', user.id);
      }
      
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowCheckoutForm(true);
  };

  const onSubmitOrder = async (formData: CheckoutFormData) => {
    setIsLoading(true);
    try {
      console.log('Starting checkout process...');
      console.log('Form data:', formData);
      console.log('Cart items:', items);

      // Create orders for each shop (since items can be from different shops)
      for (const [shopId, shopItems] of Object.entries(itemsByShop)) {
        console.log(`Processing order for shop ${shopId}:`, shopItems);

        // Calculate total for this shop
        const shopTotal = shopItems.reduce((total, item) => {
          return total + (item.product?.price || 0) * item.quantity;
        }, 0);

        console.log(`Shop ${shopId} total:`, shopTotal);

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            total_amount: shopTotal,
            shop_id: shopId,
            customer_id: user?.id,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }

        console.log('Order created:', orderData);

        // Create order items
        const orderItems = shopItems.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product?.price || 0
        }));

        console.log('Creating order items:', orderItems);

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) {
          console.error('Error creating order items:', orderItemsError);
          throw orderItemsError;
        }

        console.log('Order items created successfully');

        // Update product stock
        for (const item of shopItems) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ 
              stock: Math.max(0, (item.product?.stock || 0) - item.quantity)
            })
            .eq('id', item.product_id);

          if (stockError) {
            console.error('Error updating stock:', stockError);
            // Don't throw here, just log the error
          }
        }
      }

      // Clear cart from database if user is authenticated
      if (user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('customer_id', user.id);
      }

      // Clear local cart
      clearCart();
      
      toast.success('Order placed successfully! You will receive a confirmation email shortly.');
      setShowCheckoutForm(false);
      onClose();
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
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

  if (showCheckoutForm) {
    return (
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Summary</h3>
          <div className="space-y-2">
            {Object.entries(itemsByShop).map(([shopId, shopItems]) => {
              const shopTotal = shopItems.reduce((total, item) => {
                return total + (item.product?.price || 0) * item.quantity;
              }, 0);
              
              return (
                <div key={shopId} className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">
                    {shopItems[0]?.product?.shop?.name || 'Shop'}
                  </p>
                  <div className="space-y-1">
                    {shopItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product?.title} × {item.quantity}</span>
                        <span>{formatPrice((item.product?.price || 0) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                    <span>Shop Total:</span>
                    <span>{formatPrice(shopTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Grand Total:</span>
              <span className="text-green-600">{formatPrice(getTotal())}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitOrder)} className="space-y-4">
          <div>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              {...register('customer_name', { required: 'Name is required' })}
              error={errors.customer_name?.message}
              icon={<User className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              {...register('customer_email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.customer_email?.message}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              {...register('customer_phone', { required: 'Phone number is required' })}
              error={errors.customer_phone?.message}
              icon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCheckoutForm(false)}
              className="flex-1"
            >
              Back to Cart
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Place Order
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-4">
        {Object.entries(itemsByShop).map(([shopId, shopItems]) => (
          <div key={shopId} className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">
              {shopItems[0]?.product?.shop?.name || 'Shop'}
            </h4>
            <div className="space-y-3">
              {shopItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.product?.image_url || 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'}
                    alt={item.product?.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.product?.title}</h4>
                    <p className="text-sm text-gray-600">{formatPrice(item.product?.price || 0)}</p>
                    <p className="text-xs text-gray-500">Stock: {item.product?.stock}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={item.quantity >= (item.product?.stock || 0)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
                    </p>
                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
          <Button
            variant="outline"
            onClick={() => {
              clearCart();
              if (user) {
                supabase.from('cart_items').delete().eq('customer_id', user.id);
              }
              toast.success('Cart cleared');
            }}
            className="flex-1"
          >
            Clear Cart
          </Button>
          <Button
            onClick={handleCheckout}
            className="flex-1"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};
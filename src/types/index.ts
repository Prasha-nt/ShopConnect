export interface User {
  id: string;
  email: string;
  role: 'admin' | 'shopkeeper' | 'customer';
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  image_url?: string;
  qr_code_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  shopkeeper_id: string;
  created_at: string;
  updated_at: string;
  shopkeeper?: User;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  stock: number;
  shop_id: string;
  created_at: string;
  updated_at: string;
  shop?: Shop;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  shop_id: string;
  customer_id?: string;
  session_id: string;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  shop_id: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface ShopAnalytics {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  recent_orders: Order[];
  popular_products: Product[];
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth helpers
export const signUp = async (email: string, password: string, role: 'admin' | 'shopkeeper' | 'customer') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }
    }
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Database helpers
export const getShops = async (status?: string) => {
  let query = supabase
    .from('shops')
    .select(`
      *,
      shopkeeper:users!shops_shopkeeper_id_fkey(*)
    `);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getShopById = async (id: string) => {
  const { data, error } = await supabase
    .from('shops')
    .select(`
      *,
      shopkeeper:users!shops_shopkeeper_id_fkey(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const getProductsByShop = async (shopId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId);
  
  if (error) throw error;
  return data;
};

export const getCartItems = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('session_id', sessionId);
  
  if (error) throw error;
  return data;
};
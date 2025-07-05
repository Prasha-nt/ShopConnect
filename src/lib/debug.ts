// Debug utilities for troubleshooting shop visibility issues
import { supabase } from './supabase';

export const debugShopVisibility = async () => {
  console.log('=== DEBUGGING SHOP VISIBILITY ===');
  
  try {
    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('1. Current authenticated user:', user?.id, user?.email);
    
    if (userError) {
      console.error('User auth error:', userError);
      return;
    }

    // 2. Check if user exists in users table
    const { data: userData, error: userTableError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id);
    
    console.log('2. User in users table:', userData);
    if (userTableError) console.error('Users table error:', userTableError);

    // 3. Check all shops in database (raw query)
    const { data: allShops, error: allShopsError } = await supabase
      .from('shops')
      .select('*');
    
    console.log('3. All shops in database:', allShops);
    if (allShopsError) console.error('All shops error:', allShopsError);

    // 4. Check shops with shopkeeper info
    const { data: shopsWithOwners, error: shopsWithOwnersError } = await supabase
      .from('shops')
      .select(`
        *,
        shopkeeper:users!shops_shopkeeper_id_fkey(*)
      `);
    
    console.log('4. Shops with owner info:', shopsWithOwners);
    if (shopsWithOwnersError) console.error('Shops with owners error:', shopsWithOwnersError);

    // 5. RLS policies check removed - not available from client side
    console.log('5. RLS policies check skipped (not available from client)');

    // 6. Test direct shop creation
    console.log('6. Testing shop creation permissions...');
    const testShop = {
      name: 'Test Shop Debug',
      description: 'Test description',
      category: 'Electronics',
      address: 'Test address',
      phone: '1234567890',
      email: 'test@example.com',
      shopkeeper_id: user?.id
    };

    const { data: createTest, error: createError } = await supabase
      .from('shops')
      .insert([testShop])
      .select();

    if (createError) {
      console.error('6. Shop creation test failed:', createError);
    } else {
      console.log('6. Shop creation test successful:', createTest);
      
      // Clean up test shop
      await supabase
        .from('shops')
        .delete()
        .eq('name', 'Test Shop Debug');
    }

    // 7. Check real-time subscriptions
    console.log('7. Testing real-time subscription...');
    const channel = supabase
      .channel('debug_shops')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shops' }, 
        (payload) => console.log('Real-time event:', payload)
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Clean up after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('Debug subscription cleaned up');
    }, 5000);

  } catch (error) {
    console.error('Debug error:', error);
  }
};

export const testAdminAccess = async () => {
  console.log('=== TESTING ADMIN ACCESS ===');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);

    // Check user role
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id)
      .single();

    console.log('User role:', userRole);
    if (roleError) console.error('Role check error:', roleError);

    // Test admin shop access
    const { data: adminShops, error: adminError } = await supabase
      .from('shops')
      .select('*');

    console.log('Admin shops access:', adminShops?.length, 'shops found');
    if (adminError) console.error('Admin access error:', adminError);

  } catch (error) {
    console.error('Admin test error:', error);
  }
};
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  ShoppingBag, 
  MapPin, 
  Search, 
  Filter,
  Star,
  Clock,
  Eye,
  Heart,
  TrendingUp,
  Package,
  User,
  History
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { supabase } from '../../lib/supabase';
import { Shop, Order, Product } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { items } = useCartStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favoriteShops, setFavoriteShops] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'orders' | 'favorites' | 'profile'>('discover');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteShops: 0,
    recentOrders: 0
  });

  useEffect(() => {
    fetchShops();
    if (user) {
      fetchOrders();
      fetchFavorites();
    }
  }, [user]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          products(count)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          ),
          shop:shops(*)
        `)
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      // Calculate stats
      const totalOrders = data?.length || 0;
      const totalSpent = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const recentOrders = data?.filter(order => {
        const orderDate = new Date(order.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate > thirtyDaysAgo;
      }).length || 0;

      setStats(prev => ({
        ...prev,
        totalOrders,
        totalSpent,
        recentOrders
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchFavorites = async () => {
    // For now, we'll use localStorage for favorites
    // In a real app, you'd store this in the database
    const favorites = JSON.parse(localStorage.getItem('favoriteShops') || '[]');
    setFavoriteShops(favorites);
    setStats(prev => ({ ...prev, favoriteShops: favorites.length }));
  };

  const toggleFavorite = (shopId: string) => {
    const newFavorites = favoriteShops.includes(shopId)
      ? favoriteShops.filter(id => id !== shopId)
      : [...favoriteShops, shopId];
    
    setFavoriteShops(newFavorites);
    localStorage.setItem('favoriteShops', JSON.stringify(newFavorites));
    setStats(prev => ({ ...prev, favoriteShops: newFavorites.length }));
    
    toast.success(
      favoriteShops.includes(shopId) 
        ? 'Removed from favorites' 
        : 'Added to favorites'
    );
  };

  const categories = ['all', ...new Set(shops.map(shop => shop.category))];
  
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shop.category === selectedCategory;
    const matchesFavorites = activeTab !== 'favorites' || favoriteShops.includes(shop.id);
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  const ShopCard = ({ shop }: { shop: Shop }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative">
        <img
          src={shop.image_url || 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1'}
          alt={shop.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          onClick={() => toggleFavorite(shop.id)}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            favoriteShops.includes(shop.id)
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${favoriteShops.includes(shop.id) ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{shop.name}</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {shop.category}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{shop.description}</p>
        
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{shop.address}</span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">4.0</span>
          </div>
          <span className="text-sm text-gray-500">
            {Math.floor(Math.random() * 50) + 10} products
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setSelectedShop(shop);
              setIsShopModalOpen(true);
            }}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            onClick={() => window.open(`/shop/${shop.id}`, '_blank')}
            className="flex-1"
            size="sm"
          >
            <ShoppingBag className="w-4 h-4 mr-1" />
            Shop
          </Button>
        </div>
      </div>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h4>
          <p className="text-sm text-gray-600">{order.shop?.name}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-green-600">{formatPrice(order.total_amount)}</p>
          <span className={`text-xs px-2 py-1 rounded-full ${
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {order.status}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{formatDate(order.created_at)}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedOrder(order);
            setIsOrderModalOpen(true);
          }}
        >
          View Details
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back{user ? `, ${user.email?.split('@')[0]}` : ''}!
              </h1>
              <p className="text-gray-600">Discover local shops and manage your orders</p>
            </div>
            {cartItemCount > 0 && (
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                <ShoppingBag className="w-4 h-4 inline mr-2" />
                {cartItemCount} items in cart
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={Package}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Spent"
              value={formatPrice(stats.totalSpent)}
              icon={TrendingUp}
              color="bg-green-500"
            />
            <StatCard
              title="Favorite Shops"
              value={stats.favoriteShops}
              icon={Heart}
              color="bg-red-500"
            />
            <StatCard
              title="Recent Orders"
              value={stats.recentOrders}
              subtitle="Last 30 days"
              icon={Clock}
              color="bg-purple-500"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 overflow-x-auto">
          {[
            { id: 'discover', label: 'Discover Shops', icon: Store },
            { id: 'orders', label: 'My Orders', icon: Package },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'profile', label: 'Profile', icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'discover' && (
          <div>
            {/* Search and Filters */}
            <Card className="p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search shops, products, or categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category === 'all' ? 'All Categories' : category}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Shops Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ShopCard shop={shop} />
                </motion.div>
              ))}
            </div>

            {filteredShops.length === 0 && (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shops found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {user ? (
              orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                  <Button onClick={() => setActiveTab('discover')}>
                    Discover Shops
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to view orders</h3>
                <p className="text-gray-600">Create an account to track your orders and save favorites</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            {favoriteShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop) => (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShopCard shop={shop} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorite shops yet</h3>
                <p className="text-gray-600 mb-4">Add shops to your favorites to see them here</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Shops
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            {user ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(user.created_at || new Date().toISOString())}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">Customer</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Sign in to view your profile</p>
              </div>
            )}
          </Card>
        )}

        {/* Shop Details Modal */}
        <Modal
          isOpen={isShopModalOpen}
          onClose={() => setIsShopModalOpen(false)}
          title="Shop Details"
        >
          {selectedShop && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={selectedShop.image_url || 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'}
                  alt={selectedShop.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
                  <p className="text-gray-600">{selectedShop.category}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.phone}</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.email}</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    window.open(`/shop/${selectedShop.id}`, '_blank');
                    setIsShopModalOpen(false);
                  }}
                  className="flex-1"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Visit Shop
                </Button>
                <Button
                  onClick={() => toggleFavorite(selectedShop.id)}
                  variant="outline"
                  className="flex-1"
                >
                  <Heart className={`w-4 h-4 mr-2 ${favoriteShops.includes(selectedShop.id) ? 'fill-current text-red-500' : ''}`} />
                  {favoriteShops.includes(selectedShop.id) ? 'Remove Favorite' : 'Add Favorite'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Order Details Modal */}
        <Modal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          title="Order Details"
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{selectedOrder.id.slice(0, 8)}</h3>
                  <p className="text-gray-600">{selectedOrder.shop?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Details</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer_email}</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.product?.title}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, QrCode, Edit, Trash2, Package, TrendingUp, Users, DollarSign, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProductForm } from './ProductForm';
import { ShopProfile } from './ShopProfile';
import { QRCodeGenerator } from './QRCodeGenerator';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Shop, Product, Order } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export const ShopkeeperDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    if (user) {
      console.log('User found, fetching shop for user ID:', user.id);
      fetchShop();
    } else {
      console.log('No user found');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (shop) {
      console.log('Shop found, fetching products, orders and stats');
      fetchProducts();
      fetchOrders();
      fetchStats();
    }
  }, [shop]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching shop for user:', user?.id);
      
      // First, let's check if the user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) {
        console.error('User not found in users table:', userError);
        setError('User profile not found. Please try logging out and back in.');
        setLoading(false);
        return;
      }

      console.log('User data found:', userData);

      // Now fetch the shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('shopkeeper_id', user?.id);

      if (shopError) {
        console.error('Error fetching shop:', shopError);
        setError('Failed to fetch shop data: ' + shopError.message);
        setLoading(false);
        return;
      }
      
      console.log('Shop query result:', shopData);
      
      if (shopData && shopData.length > 0) {
        console.log('Shop found:', shopData[0]);
        setShop(shopData[0]);
      } else {
        console.log('No shop found for user');
        setShop(null);
      }
    } catch (error: any) {
      console.error('Error in fetchShop:', error);
      setError('An unexpected error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!shop) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchOrders = async () => {
    if (!shop) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    }
  };

  const fetchStats = async () => {
    if (!shop) return;

    try {
      const [productsData, ordersData] = await Promise.all([
        supabase.from('products').select('id').eq('shop_id', shop.id),
        supabase.from('orders').select('total_amount, status').eq('shop_id', shop.id)
      ]);

      const totalProducts = productsData.data?.length || 0;
      const totalOrders = ordersData.data?.length || 0;
      const totalRevenue = ordersData.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const pendingOrders = ordersData.data?.filter(order => order.status === 'pending').length || 0;

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product deleted successfully');
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order ${status} successfully`);
      fetchOrders();
      fetchStats();
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleCreateShop = () => {
    console.log('Create shop button clicked - opening modal');
    setIsProfileModalOpen(true);
  };

  const handleShopSuccess = () => {
    console.log('Shop created/updated successfully');
    setIsProfileModalOpen(false);
    fetchShop(); // Refresh shop data
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={fetchShop} className="w-full">
              Try Again
            </Button>
            <Button 
              onClick={handleCreateShop}
              variant="outline"
              className="w-full"
            >
              Create New Shop
            </Button>
          </div>
        </Card>

        {/* Modal for creating shop */}
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title="Create Shop Profile"
        >
          <ShopProfile
            shop={null}
            onSuccess={handleShopSuccess}
          />
        </Modal>
      </div>
    );
  }

  // No shop created yet
  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Shop</h2>
          <p className="text-gray-600 mb-6">
            Start by creating your shop profile to begin selling your products online.
          </p>
          <Button 
            onClick={handleCreateShop}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Shop
          </Button>
        </Card>

        {/* Modal for creating shop */}
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title="Create Shop Profile"
        >
          <ShopProfile
            shop={null}
            onSuccess={handleShopSuccess}
          />
        </Modal>
      </div>
    );
  }

  // Shop pending approval
  if (shop.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your shop "{shop.name}" is under review by our admin team. You'll be notified once it's approved and you can start adding products.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => setIsProfileModalOpen(true)}
              variant="outline"
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Shop Details
            </Button>
            <Button 
              onClick={fetchShop}
              variant="outline"
              className="w-full"
            >
              Check Status
            </Button>
          </div>
        </Card>

        {/* Modal for editing shop */}
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title="Edit Shop Profile"
        >
          <ShopProfile
            shop={shop}
            onSuccess={handleShopSuccess}
          />
        </Modal>
      </div>
    );
  }

  // Shop rejected
  if (shop.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Rejected</h2>
          <p className="text-gray-600 mb-6">
            Unfortunately, your shop application was rejected. Please contact support for more information or update your shop details and resubmit.
          </p>
          <Button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Shop Details
          </Button>
        </Card>

        {/* Modal for editing shop */}
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title="Edit Shop Profile"
        >
          <ShopProfile
            shop={shop}
            onSuccess={handleShopSuccess}
          />
        </Modal>
      </div>
    );
  }

  // Approved shop - main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h1>
              <p className="text-gray-600">Manage your shop and products</p>
              <p className="text-sm text-gray-500">Status: {shop.status}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsQRModalOpen(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Shop
              </Button>
              <Button onClick={() => setIsProductModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Package}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={Users}
            color="bg-green-500"
          />
          <StatCard
            title="Revenue"
            value={formatPrice(stats.totalRevenue)}
            icon={DollarSign}
            color="bg-purple-500"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={Clock}
            color="bg-orange-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Products ({stats.totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders ({stats.totalOrders})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={product.image_url || 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1'}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(product.price)}
                        </span>
                        <span className={`text-sm ${product.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsProductModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding your first product</p>
                  <Button onClick={() => setIsProductModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'orders' && (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customer Orders</h2>
            </div>
            <div className="overflow-x-auto">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600">Orders will appear here when customers place them</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsOrderModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}

        {/* Modals */}
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setSelectedProduct(null);
          }}
          title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        >
          <ProductForm
            product={selectedProduct}
            shopId={shop.id}
            onSuccess={() => {
              setIsProductModalOpen(false);
              setSelectedProduct(null);
              fetchProducts();
              fetchStats();
            }}
          />
        </Modal>

        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title="Edit Shop Profile"
        >
          <ShopProfile
            shop={shop}
            onSuccess={handleShopSuccess}
          />
        </Modal>

        <Modal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          title="QR Code"
        >
          <QRCodeGenerator shop={shop} />
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
                  <p className="text-gray-600">{formatDate(selectedOrder.created_at)}</p>
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

              {selectedOrder.status === 'pending' && (
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Order
                  </Button>
                  <Button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                    variant="secondary"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                </div>
              )}

              {selectedOrder.status === 'confirmed' && (
                <Button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
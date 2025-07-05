import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, QrCode, Edit, Trash2, Package, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProductForm } from './ProductForm';
import { ShopProfile } from './ShopProfile';
import { QRCodeGenerator } from './QRCodeGenerator';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Shop, Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

export const ShopkeeperDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    shopViews: 0
  });

  useEffect(() => {
    if (user) {
      fetchShop();
    }
  }, [user]);

  useEffect(() => {
    if (shop) {
      fetchProducts();
      fetchStats();
    }
  }, [shop]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      console.log('Fetching shop for user:', user?.id);
      
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('shopkeeper_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching shop:', error);
        throw error;
      }
      
      console.log('Shop data:', data);
      setShop(data);
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast.error('Failed to fetch shop data');
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
        .eq('shop_id', shop.id);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
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

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        shopViews: Math.floor(Math.random() * 1000) + 100 // Mock data
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
            <Package className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your shop is under review by our admin team. You'll be notified once it's approved and you can start adding products.
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
            <Trash2 className="w-8 h-8 text-red-600" />
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
            title="Shop Views"
            value={stats.shopViews}
            icon={TrendingUp}
            color="bg-orange-500"
          />
        </div>

        {/* Products Grid */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols- md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="flex space-x-2 mt-4">
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
      </div>
    </div>
  );
};
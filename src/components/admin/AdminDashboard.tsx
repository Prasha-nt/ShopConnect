import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Eye,
  Clock,
  RefreshCw,
  Bug
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { getShops, supabase } from '../../lib/supabase';
import { debugShopVisibility, testAdminAccess } from '../../lib/Debug';
import { Shop } from '../../types';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [stats, setStats] = useState({
    totalShops: 0,
    pendingApprovals: 0,
    approvedShops: 0,
    totalProducts: 0
  });

  useEffect(() => {
    fetchShops();
    fetchStats();

    // Set up real-time subscription for shops
    const shopsSubscription = supabase
      .channel('shops_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'shops' 
        }, 
        (payload) => {
          console.log('Shop change detected:', payload);
          // Refresh data when shops table changes
          fetchShops();
          fetchStats();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(shopsSubscription);
    };
  }, []);

  const fetchShops = async () => {
    try {
      console.log('Admin: Fetching shops...');
      setLoading(true);
      
      // Try multiple approaches to fetch shops
      console.log('Approach 1: Using getShops helper');
      const shopsData = await getShops();
      console.log('getShops result:', shopsData);
      
      // Approach 2: Direct query
      console.log('Approach 2: Direct query');
      const { data: directShops, error: directError } = await supabase
        .from('shops')
        .select(`
          *,
          shopkeeper:users!shops_shopkeeper_id_fkey(*)
        `);
      
      console.log('Direct query result:', directShops);
      if (directError) console.error('Direct query error:', directError);
      
      // Approach 3: Simple query without joins
      console.log('Approach 3: Simple query');
      const { data: simpleShops, error: simpleError } = await supabase
        .from('shops')
        .select('*');
      
      console.log('Simple query result:', simpleShops);
      if (simpleError) console.error('Simple query error:', simpleError);
      
      // Use the best available data
      const finalShops = shopsData || directShops || simpleShops || [];
      console.log('Final shops to display:', finalShops);
      
      setShops(finalShops);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...');
      const [shopsData, productsData] = await Promise.all([
        supabase.from('shops').select('status'),
        supabase.from('products').select('id')
      ]);

      console.log('Stats - shops data:', shopsData.data);
      console.log('Stats - products data:', productsData.data);

      const totalShops = shopsData.data?.length || 0;
      const pendingApprovals = shopsData.data?.filter(shop => shop.status === 'pending').length || 0;
      const approvedShops = shopsData.data?.filter(shop => shop.status === 'approved').length || 0;
      const totalProducts = productsData.data?.length || 0;

      const newStats = {
        totalShops,
        pendingApprovals,
        approvedShops,
        totalProducts
      };

      console.log('Calculated stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchShops(), fetchStats()]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDebug = async () => {
    setDebugMode(true);
    console.log('Starting debug mode...');
    await debugShopVisibility();
    await testAdminAccess();
    toast.success('Debug information logged to console');
    setDebugMode(false);
  };

  const handleApproveShop = async (shopId: string) => {
    try {
      console.log('Approving shop:', shopId);
      const { error } = await supabase
        .from('shops')
        .update({ status: 'approved' })
        .eq('id', shopId);

      if (error) throw error;

      toast.success('Shop approved successfully!');
      fetchShops();
      fetchStats();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error approving shop:', error);
      toast.error('Failed to approve shop');
    }
  };

  const handleRejectShop = async (shopId: string) => {
    try {
      console.log('Rejecting shop:', shopId);
      const { error } = await supabase
        .from('shops')
        .update({ status: 'rejected' })
        .eq('id', shopId);

      if (error) throw error;

      toast.success('Shop rejected');
      fetchShops();
      fetchStats();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error rejecting shop:', error);
      toast.error('Failed to reject shop');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage shopkeepers and monitor platform activity</p>
            </div>
            <div className="flex space-x-3">
              {/* <Button
                onClick={handleDebug}
                variant="outline"
                disabled={debugMode}
                className="flex items-center"
              >
                <Bug className={`w-4 h-4 mr-2 ${debugMode ? 'animate-spin' : ''}`} />
                Debug
              </Button> */}
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
                className="flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Debug Info */}
        {debugMode && (
          <Card className="mb-6 p-4 bg-yellow-50 border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Mode Active</h3>
            <p className="text-sm text-yellow-700">
              Check the browser console for detailed debugging information.
            </p>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Shops"
            value={stats.totalShops}
            icon={Store}
            color="bg-blue-500"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCard
            title="Approved Shops"
            value={stats.approvedShops}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={ShoppingBag}
            color="bg-purple-500"
          />
        </div>

        {/* Shops Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Shop Applications</h2>
              <p className="text-sm text-gray-500">
                {shops.length} {shops.length === 1 ? 'shop' : 'shops'} total
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {shops.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shops yet</h3>
                <p className="text-gray-600 mb-4">Shop applications will appear here once shopkeepers create them</p>
                {/* <Button onClick={handleDebug} variant="outline">
                  <Bug className="w-4 h-4 mr-2" />
                  Run Diagnostics
                </Button> */}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={shop.image_url || 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'}
                              alt={shop.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shop.shopkeeper?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shop.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          shop.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : shop.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(shop.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedShop(shop);
                            setIsModalOpen(true);
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

        {/* Shop Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedShop.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedShop.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedShop.status === 'pending' && (
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => handleApproveShop(selectedShop.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRejectShop(selectedShop.id)}
                    variant="secondary"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
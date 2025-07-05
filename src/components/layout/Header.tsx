import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Store } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { signOut } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const { user, role, setUser, setRole } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setRole(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (!user) return null;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-sm border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Store className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">ShopConnect</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{user.email}</span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                {role}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
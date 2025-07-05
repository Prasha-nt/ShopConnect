import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, ShoppingCart } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Button } from '../ui/Button';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left side - Hero */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 bg-gradient-to-br from-blue-600 to-indigo-700">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <div className="flex items-center space-x-3 mb-8">
              <Store className="w-12 h-12" />
              <h1 className="text-4xl font-bold">ShopConnect</h1>
            </div>
            
            <h2 className="text-3xl font-bold mb-6">
              Connect Local Businesses with Digital Commerce
            </h2>
            
            <p className="text-xl mb-8 text-blue-100">
              Empower local shopkeepers with digital presence and help customers discover local products through QR codes.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">For Shopkeepers</h3>
                  <p className="text-blue-100">Create digital storefronts and manage products</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">For Customers</h3>
                  <p className="text-blue-100">Discover and shop from local businesses</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 lg:px-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4 lg:hidden">
                <Store className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">ShopConnect</h1>
              </div>
              
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isLogin
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isLogin
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {isLogin ? (
              <LoginForm onSuccess={() => {}} />
            ) : (
              <RegisterForm onSuccess={() => setIsLogin(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
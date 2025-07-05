import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { signUp } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'shopkeeper' | 'customer';
}

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    trigger,
    clearErrors
  } = useForm<RegisterFormData>({
    mode: 'onChange'
  });
  
  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.role);
      toast.success('Registration successful! Please check your email to verify your account.');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && errors.email) {
      clearErrors('email');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>
        <p className="text-gray-600">Join our platform today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
            onChange={(e) => {
              register('email').onChange(e);
              handleEmailChange(e);
            }}
            onBlur={() => trigger('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I want to join as
          </label>
          <select
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.role ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('role', { required: 'Please select your role' })}
          >
            <option value="">Select your role</option>
            <option value="customer">Customer - Browse and shop from local stores</option>
            <option value="shopkeeper">Shopkeeper - Create and manage my shop</option>
            <option value="admin">Admin - Platform administrator</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </motion.div>
  );
};
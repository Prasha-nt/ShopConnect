import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Store } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Shop } from '../../types';
import toast from 'react-hot-toast';

interface ShopProfileData {
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
}

interface ShopProfileProps {
  shop?: Shop | null;
  onSuccess: () => void;
}

const categories = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Books',
  'Home & Garden',
  'Sports',
  'Beauty',
  'Toys',
  'Other'
];

export const ShopProfile: React.FC<ShopProfileProps> = ({ shop, onSuccess }) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(shop?.image_url || null);

  const { register, handleSubmit, formState: { errors } } = useForm<ShopProfileData>({
    defaultValues: shop ? {
      name: shop.name,
      description: shop.description,
      category: shop.category,
      address: shop.address,
      phone: shop.phone,
      email: shop.email
    } : undefined
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `shops/${fileName}`;

    console.log("Uploading image to:", filePath);

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log("Public URL returned:", data.publicUrl);

    return data.publicUrl;
  };

  const onSubmit = async (data: ShopProfileData) => {
    setIsLoading(true);
    try {
      console.log('=== SHOP CREATION/UPDATE DEBUG ===');
      console.log('User ID:', user?.id);
      console.log('Form data:', data);
      console.log('Is update?', !!shop);

      // Verify user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) {
        console.error('User verification failed:', userError);
        throw new Error('User profile not found. Please log in again.');
      }

      let imageUrl: string | undefined = undefined;

      if (imageFile) {
        console.log('Uploading image...');
        imageUrl = await uploadImage(imageFile);
        console.log('Image uploaded. URL:', imageUrl);
      } else if (shop?.image_url) {
        imageUrl = shop.image_url; // Keep existing image
      }

      // Optional check
      // if (!imageUrl && !shop) throw new Error("Shop image is required");

      const shopData = {
        ...data,
        image_url: imageUrl,
        shopkeeper_id: user?.id,
        status: shop ? shop.status : 'pending'
      };

      console.log('Final shop data:', shopData);

      if (shop) {
        const { error } = await supabase
          .from('shops')
          .update(shopData)
          .eq('id', shop.id);

        if (error) throw error;

        toast.success('Shop updated successfully!');
      } else {
        const { error } = await supabase
          .from('shops')
          .insert([shopData]);

        if (error) throw error;

        toast.success('Shop created successfully! Waiting for admin approval.');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Shop save error:', error);
      toast.error(error.message || 'Failed to save shop');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Shop Name"
        placeholder="Enter shop name"
        {...register('name', { required: 'Shop name is required' })}
        error={errors.name?.message}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          rows={4}
          placeholder="Tell customers about your shop"
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          {...register('category', { required: 'Category is required' })}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          rows={3}
          placeholder="Enter shop address"
          {...register('address', { required: 'Address is required' })}
        />
        {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone"
          type="tel"
          placeholder="Enter phone number"
          {...register('phone', { required: 'Phone number is required' })}
          error={errors.phone?.message}
        />
        <Input
          label="Email"
          type="email"
          placeholder="Enter email address"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          error={errors.email?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shop Image</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
          <div className="space-y-1 text-center">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mx-auto h-32 w-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="shop-image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="shop-image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        <Store className="w-4 h-4 mr-2" />
        {shop ? 'Update Shop' : 'Create Shop'}
      </Button>
    </form>
  );
};

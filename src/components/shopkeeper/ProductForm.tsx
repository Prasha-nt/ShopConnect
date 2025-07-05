import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import toast from 'react-hot-toast';

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
}

interface ProductFormProps {
  product?: Product | null;
  shopId: string;
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

export const ProductForm: React.FC<ProductFormProps> = ({ product, shopId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: product ? {
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image_url: product.image_url
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
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = data.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        ...data,
        image_url: imageUrl,
        shop_id: shopId
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Product updated successfully!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success('Product added successfully!');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Input
          label="Product Title"
          placeholder="Enter product title"
          {...register('title', { required: 'Title is required' })}
          error={errors.title?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          rows={4}
          placeholder="Enter product description"
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Price"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('price', { 
              required: 'Price is required',
              min: { value: 0, message: 'Price must be positive' }
            })}
            error={errors.price?.message}
          />
        </div>
        <div>
          <Input
            label="Stock"
            type="number"
            placeholder="0"
            {...register('stock', { 
              required: 'Stock is required',
              min: { value: 0, message: 'Stock cannot be negative' }
            })}
            error={errors.stock?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          {...register('category', { required: 'Category is required' })}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Image
        </label>
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
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image-upload"
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

      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
      >
        <Package className="w-4 h-4 mr-2" />
        {product ? 'Update Product' : 'Add Product'}
      </Button>
    </form>
  );
};
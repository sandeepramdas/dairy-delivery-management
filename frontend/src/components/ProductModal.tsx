import React, { useEffect, useState } from 'react';
import { X, Package, DollarSign, Info } from 'lucide-react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  product_name: string;
  product_code: string;
  unit: string;
  price_per_unit: number;
  description?: string;
  is_active: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
  mode: 'create' | 'edit';
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    unit: '',
    price_per_unit: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && product) {
        setFormData({
          product_name: product.product_name || '',
          product_code: product.product_code || '',
          unit: product.unit || '',
          price_per_unit: product.price_per_unit?.toString() || '',
          description: product.description || '',
          is_active: product.is_active !== undefined ? product.is_active : true,
        });
      } else {
        resetForm();
        if (mode === 'create') {
          generateProductCode();
        }
      }
    }
  }, [isOpen, mode, product]);

  const resetForm = () => {
    setFormData({
      product_name: '',
      product_code: '',
      unit: '',
      price_per_unit: '',
      description: '',
      is_active: true,
    });
  };

  const generateProductCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    setFormData((prev) => ({ ...prev, product_code: `PRD${timestamp}${randomPart}` }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.product_name.trim() || formData.product_name.trim().length < 2) {
      toast.error('Product name must be at least 2 characters');
      return;
    }
    if (!formData.product_code.trim()) {
      toast.error('Product code is required');
      return;
    }
    if (!formData.unit.trim()) {
      toast.error('Unit of measurement is required');
      return;
    }
    const price = parseFloat(formData.price_per_unit);
    if (isNaN(price) || price < 0) {
      toast.error('Price must be a positive number');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        product_name: formData.product_name.trim(),
        product_code: formData.product_code.trim(),
        unit: formData.unit.trim(),
        price_per_unit: price,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      };

      if (mode === 'create') {
        await productsAPI.create(payload);
        toast.success('Product created successfully');
      } else {
        await productsAPI.update(product!.id, payload);
        toast.success('Product updated successfully');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save product';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-fresh-green to-fresh-lime p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {mode === 'create' ? 'Add New Product' : 'Edit Product'}
              </h2>
              <p className="text-white/80 text-sm">
                {mode === 'create'
                  ? 'Enter product details below'
                  : 'Update product information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="space-y-6">
            {/* Product Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-fresh-green" />
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Full Cream Milk"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="product_code"
                    value={formData.product_code}
                    onChange={handleChange}
                    className="input bg-gray-50"
                    placeholder="Auto-generated"
                    readOnly={mode === 'edit'}
                    required
                  />
                  {mode === 'edit' && (
                    <p className="text-xs text-dairy-600 mt-1">Code cannot be changed</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit of Measurement <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">Select unit</option>
                    <option value="L">Liter (L)</option>
                    <option value="mL">Milliliter (mL)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="pieces">Pieces</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-fresh-green" />
                Pricing
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Unit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dairy-600 font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price_per_unit"
                      value={formData.price_per_unit}
                      onChange={handleChange}
                      className="input pl-8"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-fresh-green" />
                Description (Optional)
              </h3>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input resize-none"
                rows={3}
                placeholder="Add product description, notes, or details..."
              />
            </div>

            {/* Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === true}
                    onChange={() => handleRadioChange(true)}
                    className="w-5 h-5 text-fresh-green focus:ring-fresh-green"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Active</span>
                    <p className="text-xs text-dairy-600">Product is available for use</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === false}
                    onChange={() => handleRadioChange(false)}
                    className="w-5 h-5 text-gray-600 focus:ring-gray-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Inactive</span>
                    <p className="text-xs text-dairy-600">Product is not available</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-dairy-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </span>
              ) : (
                <span>{mode === 'create' ? 'Create Product' : 'Update Product'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;

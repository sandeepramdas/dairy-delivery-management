import React, { useEffect, useState } from 'react';
import { X, MapPin, Info } from 'lucide-react';
import { areasAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Area {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  area?: Area | null;
  mode: 'create' | 'edit';
}

const AreaModal: React.FC<AreaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  area,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && area) {
        setFormData({
          name: area.name || '',
          code: area.code || '',
          description: area.description || '',
          is_active: area.is_active !== undefined ? area.is_active : true,
        });
      } else {
        resetForm();
        if (mode === 'create') {
          generateAreaCode();
        }
      }
    }
  }, [isOpen, mode, area]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
    });
  };

  const generateAreaCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    setFormData((prev) => ({ ...prev, code: `AREA${timestamp}${randomPart}` }));
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
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('Area name must be at least 2 characters');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Area code is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      };

      if (mode === 'create') {
        await areasAPI.create(payload);
        toast.success('Area created successfully');
      } else {
        await areasAPI.update(area!.id, payload);
        toast.success('Area updated successfully');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save area';
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
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {mode === 'create' ? 'Add New Area' : 'Edit Area'}
              </h2>
              <p className="text-white/80 text-sm">
                {mode === 'create'
                  ? 'Enter area details below'
                  : 'Update area information'}
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
            {/* Area Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-fresh-green" />
                Area Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., North Zone, Downtown Area"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
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
                placeholder="Add area description, landmarks, or delivery notes..."
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
                    <p className="text-xs text-dairy-600">Area is available for deliveries</p>
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
                    <p className="text-xs text-dairy-600">Area is not available</p>
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
                <span>{mode === 'create' ? 'Create Area' : 'Update Area'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AreaModal;

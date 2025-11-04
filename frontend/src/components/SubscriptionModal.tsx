import React, { useEffect, useState } from 'react';
import { X, Package, Calendar, Clock, Users } from 'lucide-react';
import { subscriptionsAPI, customersAPI, productsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
}

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  unit: string;
  price_per_unit: number;
}

interface WeeklySchedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription?: any;
  mode: 'create' | 'edit';
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subscription,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    plan_name: '',
    plan_type: 'daily' as 'daily' | 'weekly' | 'custom',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    indefinite: true,
  });
  const [dailyQuantity, setDailyQuantity] = useState('2.0');
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: '2.0',
    tuesday: '2.0',
    wednesday: '1.5',
    thursday: '2.0',
    friday: '2.0',
    saturday: '1.0',
    sunday: '0.0',
  });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadProducts();
      if (mode === 'edit' && subscription) {
        // Populate form for edit mode
        setFormData({
          customer_id: subscription.customer_id || '',
          product_id: subscription.product_id || '',
          plan_name: subscription.plan_name || '',
          plan_type: subscription.plan_type || 'daily',
          start_date: subscription.start_date?.split('T')[0] || '',
          end_date: subscription.end_date?.split('T')[0] || '',
          indefinite: !subscription.end_date,
        });

        // Load schedule if weekly
        if (subscription.plan_type === 'weekly' && subscription.schedule) {
          const scheduleMap: any = {};
          subscription.schedule.forEach((item: any) => {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[item.day_of_week];
            scheduleMap[dayName] = item.quantity.toString();
          });
          setWeeklySchedule(scheduleMap);
        } else if (subscription.plan_type === 'daily' && subscription.schedule?.[0]) {
          setDailyQuantity(subscription.schedule[0].quantity.toString());
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, subscription]);

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ status: 'active', limit: 200 });
      setCustomers(response.data.data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll({ is_active: true, limit: 100 });
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      product_id: '',
      plan_name: '',
      plan_type: 'daily',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      indefinite: true,
    });
    setDailyQuantity('2.0');
    setWeeklySchedule({
      monday: '2.0',
      tuesday: '2.0',
      wednesday: '1.5',
      thursday: '2.0',
      friday: '2.0',
      saturday: '1.0',
      sunday: '0.0',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      if (name === 'indefinite' && checked) {
        setFormData((prev) => ({ ...prev, end_date: '' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWeeklyScheduleChange = (day: keyof WeeklySchedule, value: string) => {
    setWeeklySchedule((prev) => ({ ...prev, [day]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.product_id) {
      toast.error('Please select a product');
      return;
    }
    if (!formData.plan_name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (!formData.start_date) {
      toast.error('Start date is required');
      return;
    }
    if (!formData.indefinite && !formData.end_date) {
      toast.error('Please provide an end date or mark as indefinite');
      return;
    }

    // Validate quantities
    if (formData.plan_type === 'daily') {
      const qty = parseFloat(dailyQuantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }
    } else if (formData.plan_type === 'weekly') {
      const hasValidQty = Object.values(weeklySchedule).some(
        (qty) => parseFloat(qty) > 0
      );
      if (!hasValidQty) {
        toast.error('At least one day must have a quantity greater than 0');
        return;
      }
    }

    setLoading(true);

    try {
      // Build schedule array
      let schedule: any[] = [];

      if (formData.plan_type === 'daily') {
        // Daily plan - create schedule for all 7 days with same quantity
        for (let i = 0; i < 7; i++) {
          schedule.push({
            day_of_week: i,
            quantity: parseFloat(dailyQuantity),
          });
        }
      } else if (formData.plan_type === 'weekly') {
        // Weekly plan - create schedule based on weeklySchedule
        const dayMap: Record<keyof WeeklySchedule, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };

        Object.entries(weeklySchedule).forEach(([day, qty]) => {
          schedule.push({
            day_of_week: dayMap[day as keyof WeeklySchedule],
            quantity: parseFloat(qty),
          });
        });
      }

      const payload = {
        customer_id: formData.customer_id,
        product_id: formData.product_id,
        plan_name: formData.plan_name,
        plan_type: formData.plan_type,
        start_date: formData.start_date,
        end_date: formData.indefinite ? null : formData.end_date,
        schedule: schedule,
      };

      if (mode === 'create') {
        await subscriptionsAPI.create(payload);
        toast.success('Subscription created successfully');
      } else {
        await subscriptionsAPI.update(subscription.id, payload);
        toast.success('Subscription updated successfully');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save subscription';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-fresh-green to-fresh-lime p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {mode === 'create' ? 'Create Subscription' : 'Edit Subscription'}
              </h2>
              <p className="text-white/80 text-sm">
                {mode === 'create'
                  ? 'Set up a new subscription plan'
                  : 'Update subscription details'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Customer & Product Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-fresh-green" />
              Customer & Product Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="input"
                  required
                  disabled={mode === 'edit'}
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} ({customer.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  className="input"
                  required
                  disabled={mode === 'edit'}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name} ({product.product_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="plan_name"
                  value={formData.plan_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Morning Milk Delivery"
                  required
                />
              </div>
            </div>
          </div>

          {/* Plan Type & Schedule */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-fresh-green" />
              Plan Type & Schedule
            </h3>

            {/* Plan Type Radio Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="plan_type"
                  value="daily"
                  checked={formData.plan_type === 'daily'}
                  onChange={handleChange}
                  className="w-4 h-4 text-fresh-green"
                />
                <span className="font-medium text-gray-700">Daily (Same quantity every day)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="plan_type"
                  value="weekly"
                  checked={formData.plan_type === 'weekly'}
                  onChange={handleChange}
                  className="w-4 h-4 text-fresh-green"
                />
                <span className="font-medium text-gray-700">Weekly (Different quantities per day)</span>
              </label>
            </div>

            {/* Daily Plan Interface */}
            {formData.plan_type === 'daily' && (
              <div className="bg-gradient-to-br from-dairy-50 to-white p-6 rounded-xl border-2 border-dairy-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Daily Quantity <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={dailyQuantity}
                    onChange={(e) => setDailyQuantity(e.target.value)}
                    className="input max-w-[200px]"
                    placeholder="2.0"
                    required
                  />
                  <span className="text-gray-600 font-medium">
                    {selectedProduct?.unit || 'litres'} per day
                  </span>
                </div>
                <p className="text-sm text-dairy-600 mt-2">
                  This quantity will be delivered every day
                </p>
              </div>
            )}

            {/* Weekly Plan Interface */}
            {formData.plan_type === 'weekly' && (
              <div className="bg-gradient-to-br from-dairy-50 to-white p-6 rounded-xl border-2 border-dairy-200">
                <p className="text-sm text-dairy-600 mb-4">
                  Set different quantities for each day of the week
                </p>
                <div className="space-y-3">
                  {Object.entries(weeklySchedule).map(([day, quantity]) => (
                    <div
                      key={day}
                      className="flex items-center gap-4 bg-white p-4 rounded-lg border border-dairy-200"
                    >
                      <label className="w-28 font-medium text-gray-700 capitalize">
                        {day}:
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={quantity}
                        onChange={(e) =>
                          handleWeeklyScheduleChange(day as keyof WeeklySchedule, e.target.value)
                        }
                        className="input flex-1 max-w-[150px]"
                        placeholder="0.0"
                      />
                      <span className="text-gray-600 text-sm">
                        {selectedProduct?.unit || 'litres'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-fresh-green" />
              Subscription Period
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input"
                  disabled={formData.indefinite}
                  min={formData.start_date}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="indefinite"
                    checked={formData.indefinite}
                    onChange={handleChange}
                    className="w-4 h-4 text-fresh-green rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Indefinite (No end date)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          {formData.customer_id && formData.product_id && (
            <div className="bg-gradient-to-r from-fresh-green/10 to-fresh-lime/10 p-4 rounded-xl border border-fresh-green/20">
              <h4 className="font-semibold text-gray-800 mb-2">Subscription Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Customer:</span>{' '}
                  {customers.find((c) => c.id === formData.customer_id)?.full_name}
                </p>
                <p>
                  <span className="font-medium">Product:</span>{' '}
                  {selectedProduct?.product_name}
                </p>
                <p>
                  <span className="font-medium">Type:</span>{' '}
                  <span className="capitalize">{formData.plan_type}</span>
                </p>
                {formData.plan_type === 'daily' && (
                  <p>
                    <span className="font-medium">Daily Quantity:</span> {dailyQuantity}{' '}
                    {selectedProduct?.unit}
                  </p>
                )}
                {formData.plan_type === 'weekly' && (
                  <p>
                    <span className="font-medium">Weekly Total:</span>{' '}
                    {Object.values(weeklySchedule)
                      .reduce((sum, qty) => sum + parseFloat(qty || '0'), 0)
                      .toFixed(1)}{' '}
                    {selectedProduct?.unit}/week
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-dairy-200">
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
                <span>{mode === 'create' ? 'Create Subscription' : 'Update Subscription'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionModal;

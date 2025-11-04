import React, { useEffect, useState } from 'react';
import { X, DollarSign, User, Calendar, CreditCard, FileText } from 'lucide-react';
import { paymentsAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    payment_method: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    auto_allocate: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      resetForm();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll({
        status: 'active',
        limit: 100,
        search: searchCustomer || undefined
      });
      setCustomers(response.data.data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  useEffect(() => {
    if (searchCustomer && isOpen) {
      const timer = setTimeout(() => {
        loadCustomers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchCustomer]);

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      payment_method: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: '',
      auto_allocate: true,
    });
    setSearchCustomer('');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.full_name,
    }));
    setSearchCustomer(customer.full_name);
    setShowCustomerDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.payment_date) {
      toast.error('Please select a payment date');
      return;
    }

    // Validate reference number for certain payment methods
    if (['upi', 'bank_transfer', 'cheque'].includes(formData.payment_method) && !formData.reference_number.trim()) {
      toast.error(`Reference number is required for ${formData.payment_method.replace('_', ' ')}`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_id: formData.customer_id,
        payment_method: formData.payment_method,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
        auto_allocate: formData.auto_allocate,
      };

      await paymentsAPI.create(payload);
      toast.success('Payment recorded successfully');
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to record payment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCustomers = customers.filter((customer) =>
    customer.full_name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.customer_code.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-fresh-green to-fresh-lime p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Record Payment
              </h2>
              <p className="text-white/80 text-sm">
                Enter payment details below
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
            {/* Customer Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-fresh-green" />
                Customer Information
              </h3>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400 z-10" />
                  <input
                    type="text"
                    value={searchCustomer}
                    onChange={(e) => {
                      setSearchCustomer(e.target.value);
                      setShowCustomerDropdown(true);
                      if (!e.target.value) {
                        setFormData((prev) => ({ ...prev, customer_id: '', customer_name: '' }));
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="input pl-10"
                    placeholder="Search customer by name or code..."
                    required
                  />
                </div>
                {showCustomerDropdown && searchCustomer && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-dairy-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full text-left px-4 py-3 hover:bg-dairy-50 transition border-b border-dairy-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">{customer.full_name}</div>
                          <div className="text-sm text-dairy-600">{customer.customer_code}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-dairy-600">
                        No customers found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-fresh-green" />
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400 z-10" />
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleChange}
                      className="input pl-10"
                      required
                    >
                      <option value="">Select payment method</option>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dairy-600 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="input pl-8"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400 z-10" />
                    <input
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleChange}
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                    {['upi', 'bank_transfer', 'cheque'].includes(formData.payment_method) && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400 z-10" />
                    <input
                      type="text"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Transaction ID / Cheque No."
                      required={['upi', 'bank_transfer', 'cheque'].includes(formData.payment_method)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input resize-none"
                    rows={3}
                    placeholder="Any additional notes about this payment..."
                  />
                </div>
              </div>
            </div>

            {/* Auto-Allocate Option */}
            <div className="bg-dairy-50 border border-dairy-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="auto_allocate"
                  checked={formData.auto_allocate}
                  onChange={handleChange}
                  className="w-5 h-5 text-fresh-green rounded focus:ring-2 focus:ring-fresh-green"
                />
                <div>
                  <div className="font-medium text-gray-900">Auto-allocate to invoices</div>
                  <div className="text-sm text-dairy-600">
                    Automatically allocate this payment to outstanding invoices
                  </div>
                </div>
              </label>
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
                  Recording...
                </span>
              ) : (
                <span>Record Payment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;

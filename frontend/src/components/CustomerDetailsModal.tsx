import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Navigation,
  Package,
  DollarSign,
  Edit,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { customersAPI, subscriptionsAPI, paymentsAPI } from '../services/api';
import type { Customer } from '../types';
import toast from 'react-hot-toast';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  customerId: string | null;
}

interface Subscription {
  id: string;
  product_name: string;
  quantity: number;
  delivery_frequency: string;
  status: string;
  start_date: string;
  end_date: string | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
}

interface Outstanding {
  total_outstanding: number;
  current_amount: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  customerId,
}) => {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outstanding, setOutstanding] = useState<Outstanding | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      loadCustomerDetails();
    }
  }, [isOpen, customerId]);

  const loadCustomerDetails = async () => {
    if (!customerId) return;

    setLoading(true);
    try {
      const [customerRes, subsRes, paymentsRes, outstandingRes] = await Promise.all([
        customersAPI.getById(customerId),
        subscriptionsAPI.getAll({ customer_id: customerId, limit: 5 }),
        paymentsAPI.getAll({ customer_id: customerId, limit: 5 }),
        customersAPI.getOutstanding(customerId),
      ]);

      setCustomer(customerRes.data.data);
      setSubscriptions(subsRes.data.data || []);
      setPayments(paymentsRes.data.data || []);
      setOutstanding(outstandingRes.data.data);
    } catch (error: any) {
      toast.error('Failed to load customer details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-fresh-green to-fresh-lime p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Customer Details
              </h2>
              <p className="text-white/80 text-sm">Complete customer information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              disabled={loading}
            >
              <Edit className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-dairy-600">Loading customer details...</p>
              </div>
            </div>
          ) : customer ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{customer.full_name}</h3>
                    <p className="text-dairy-600">{customer.customer_code}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      customer.status === 'active'
                        ? 'bg-fresh-mint text-fresh-green'
                        : customer.status === 'inactive'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {customer.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-fresh-mint rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-fresh-green" />
                    </div>
                    <div>
                      <p className="text-xs text-dairy-600">Phone</p>
                      <p className="font-semibold text-gray-900">{customer.phone}</p>
                    </div>
                  </div>

                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-fresh-mint rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-fresh-green" />
                      </div>
                      <div>
                        <p className="text-xs text-dairy-600">Email</p>
                        <p className="font-semibold text-gray-900 truncate">{customer.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="w-10 h-10 bg-fresh-mint rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-fresh-green" />
                    </div>
                    <div>
                      <p className="text-xs text-dairy-600">Address</p>
                      <p className="font-semibold text-gray-900">
                        {customer.address_line1}
                        {customer.address_line2 && `, ${customer.address_line2}`}
                      </p>
                      <p className="text-sm text-dairy-600">
                        {customer.city} - {customer.pincode}
                      </p>
                      {customer.area_name && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-dairy-100 rounded-lg text-xs font-medium text-dairy-700 mt-1">
                          {customer.area_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {(customer.latitude || customer.longitude) && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="w-10 h-10 bg-fresh-mint rounded-lg flex items-center justify-center">
                        <Navigation className="w-5 h-5 text-fresh-green" />
                      </div>
                      <div>
                        <p className="text-xs text-dairy-600">Coordinates</p>
                        <p className="font-medium text-gray-900">
                          {customer.latitude}, {customer.longitude}
                        </p>
                      </div>
                    </div>
                  )}

                  {customer.location_notes && (
                    <div className="md:col-span-2 bg-dairy-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-dairy-700 mb-1">
                        Location Notes
                      </p>
                      <p className="text-sm text-gray-700">{customer.location_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Outstanding Balance */}
              {outstanding && (
                <div className="card bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Outstanding Balance</h3>
                      <p className="text-sm text-dairy-600">Total amount due</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-4">
                    {formatCurrency(outstanding.total_outstanding)}
                  </div>
                  {outstanding.total_outstanding > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs text-dairy-600">Current</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(outstanding.current_amount)}
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs text-dairy-600">1-30 Days</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(outstanding.days_1_30)}
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs text-dairy-600">31-60 Days</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(outstanding.days_31_60)}
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs text-dairy-600">60+ Days</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(outstanding.days_61_90 + outstanding.days_90_plus)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subscriptions */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-fresh-mint rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-fresh-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Active Subscriptions</h3>
                    <p className="text-sm text-dairy-600">
                      {subscriptions.length} subscription(s)
                    </p>
                  </div>
                </div>

                {subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-dairy-50 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{sub.product_name}</p>
                          <p className="text-sm text-dairy-600">
                            Quantity: {sub.quantity} | {sub.delivery_frequency}
                          </p>
                          <p className="text-xs text-dairy-500 mt-1">
                            Started: {formatDate(sub.start_date)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            sub.status === 'active'
                              ? 'bg-fresh-mint text-fresh-green'
                              : sub.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-dairy-50 rounded-lg">
                    <Package className="w-12 h-12 text-dairy-300 mx-auto mb-2" />
                    <p className="text-dairy-600">No active subscriptions</p>
                  </div>
                )}
              </div>

              {/* Recent Payments */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-fresh-mint rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-fresh-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
                    <p className="text-sm text-dairy-600">Last {payments.length} payment(s)</p>
                  </div>
                </div>

                {payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-dairy-50 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-sm text-dairy-600">
                            {payment.payment_method} | {formatDate(payment.payment_date)}
                          </p>
                          {payment.reference_number && (
                            <p className="text-xs text-dairy-500 mt-1">
                              Ref: {payment.reference_number}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-dairy-50 rounded-lg">
                    <CreditCard className="w-12 h-12 text-dairy-300 mx-auto mb-2" />
                    <p className="text-dairy-600">No payment history</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
              <p className="text-dairy-600">Customer not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;

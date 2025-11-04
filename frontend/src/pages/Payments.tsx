import React, { useEffect, useState } from 'react';
import { DollarSign, Search, CheckCircle, CreditCard, Plus, Banknote, Smartphone, Building, Receipt, Eye } from 'lucide-react';
import { paymentsAPI } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import PaymentAllocationModal from '../components/PaymentAllocationModal';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  payment_code: string;
  customer_name: string;
  customer_code: string;
  amount: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque';
  payment_date: string;
  reference_number?: string;
  allocated_amount?: number;
  allocated_invoices_count?: number;
  notes?: string;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [currentPage, search, startDate, endDate, paymentMethodFilter]);

  const loadPayments = async () => {
    try {
      const response = await paymentsAPI.getAll({
        page: currentPage,
        limit: 10,
        search: search || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        payment_method: paymentMethodFilter === 'all' ? undefined : paymentMethodFilter,
      });
      setPayments(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllocation = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setIsAllocationModalOpen(true);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'upi':
        return <Smartphone className="w-4 h-4" />;
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building className="w-4 h-4" />;
      case 'cheque':
        return <Receipt className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-100 text-green-700';
      case 'upi':
        return 'bg-purple-100 text-purple-700';
      case 'bank_transfer':
        return 'bg-blue-100 text-blue-700';
      case 'card':
        return 'bg-orange-100 text-orange-700';
      case 'cheque':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const paymentMethods = [
    { value: 'all', label: 'All Methods' },
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building },
    { value: 'cheque', label: 'Cheque', icon: Receipt },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
            Payments
          </h1>
          <p className="text-dairy-600">Track and manage customer payments</p>
        </div>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-12"
                placeholder="Search by customer or reference..."
              />
            </div>
          </div>

          <div className="card">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>

          <div className="card">
            <label className="block text-xs font-semibold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Payment Method Filter */}
        <div className="card">
          <label className="block text-xs font-semibold text-gray-700 mb-3">Payment Method</label>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethodFilter(method.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    paymentMethodFilter === method.value
                      ? 'bg-fresh-green text-white shadow-lg'
                      : 'bg-dairy-100 text-dairy-700 hover:bg-dairy-200'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {payments.map((payment) => (
          <div key={payment.id} className="card hover:shadow-xl transform transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-fresh-green to-fresh-lime rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {payment.customer_name}
                    </h3>
                    <p className="text-sm text-dairy-600">{payment.payment_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-fresh-green">
                      ₹{payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-dairy-600">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 ${getPaymentMethodColor(payment.payment_method)} text-xs font-semibold rounded-full capitalize`}>
                      {getPaymentMethodIcon(payment.payment_method)}
                      {payment.payment_method.replace('_', ' ')}
                    </span>
                    {payment.reference_number && (
                      <span className="text-xs text-dairy-600">
                        Ref: {payment.reference_number}
                      </span>
                    )}
                  </div>

                  {payment.allocated_invoices_count && payment.allocated_invoices_count > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {payment.allocated_invoices_count} invoice{payment.allocated_invoices_count > 1 ? 's' : ''}
                      </span>
                      {payment.allocated_amount && (
                        <span className="text-dairy-600">
                          ₹{payment.allocated_amount.toLocaleString()} allocated
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            {payment.allocated_invoices_count && payment.allocated_invoices_count > 0 && (
              <div className="pt-3 border-t border-dairy-200">
                <button
                  onClick={() => handleViewAllocation(payment.id)}
                  className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Allocation
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {payments.length === 0 && (
        <div className="card text-center py-12">
          <DollarSign className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No payments found</h3>
          <p className="text-dairy-600 mb-4">
            {search || paymentMethodFilter !== 'all' ? 'Try adjusting your filters' : 'No payments recorded yet'}
          </p>
          {!search && paymentMethodFilter === 'all' && (
            <button onClick={() => setIsPaymentModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Record Your First Payment
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-dairy-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          loadPayments();
          setIsPaymentModalOpen(false);
        }}
      />

      {/* Payment Allocation Modal */}
      {selectedPaymentId && (
        <PaymentAllocationModal
          isOpen={isAllocationModalOpen}
          onClose={() => {
            setIsAllocationModalOpen(false);
            setSelectedPaymentId(null);
          }}
          paymentId={selectedPaymentId}
        />
      )}
    </div>
  );
};

export default Payments;

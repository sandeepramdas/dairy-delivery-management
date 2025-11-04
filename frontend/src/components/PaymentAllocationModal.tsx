import React, { useEffect, useState } from 'react';
import { X, FileText, Calendar, DollarSign, CreditCard, Info } from 'lucide-react';
import { paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  allocated_amount: number;
}

interface PaymentAllocation {
  id: string;
  payment_code: string;
  customer_name: string;
  customer_code: string;
  payment_method: string;
  amount: number;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  allocated_amount: number;
  unallocated_amount: number;
  invoices: Invoice[];
}

interface PaymentAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
}

const PaymentAllocationModal: React.FC<PaymentAllocationModalProps> = ({
  isOpen,
  onClose,
  paymentId,
}) => {
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<PaymentAllocation | null>(null);

  useEffect(() => {
    if (isOpen && paymentId) {
      loadAllocation();
    }
  }, [isOpen, paymentId]);

  const loadAllocation = async () => {
    setLoading(true);
    try {
      const response = await paymentsAPI.getById(paymentId);
      setAllocation(response.data.data);
    } catch (error) {
      toast.error('Failed to load payment allocation details');
      onClose();
    } finally {
      setLoading(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-fresh-green to-fresh-lime p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Payment Allocation
              </h2>
              <p className="text-white/80 text-sm">
                View invoice allocation details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-dairy-600">Loading allocation details...</p>
              </div>
            </div>
          ) : allocation ? (
            <div className="space-y-6">
              {/* Payment Details */}
              <div className="bg-dairy-50 border border-dairy-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-fresh-green" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-dairy-600 uppercase">Payment Code</label>
                    <p className="text-gray-900 font-medium">{allocation.payment_code}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dairy-600 uppercase">Customer</label>
                    <p className="text-gray-900 font-medium">{allocation.customer_name}</p>
                    <p className="text-sm text-dairy-600">{allocation.customer_code}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dairy-600 uppercase">Payment Method</label>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 ${getPaymentMethodColor(allocation.payment_method)} text-xs font-semibold rounded-full capitalize mt-1`}>
                      <CreditCard className="w-3 h-3" />
                      {allocation.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dairy-600 uppercase">Payment Date</label>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-dairy-500" />
                      {new Date(allocation.payment_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dairy-600 uppercase">Total Amount</label>
                    <p className="text-2xl font-bold text-fresh-green">
                      ₹{allocation.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dairy-600 uppercase">Allocated Amount</label>
                    <p className="text-xl font-semibold text-blue-600">
                      ₹{allocation.allocated_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {allocation.unallocated_amount > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-dairy-600 uppercase">Unallocated Amount</label>
                      <p className="text-xl font-semibold text-orange-600">
                        ₹{allocation.unallocated_amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                  {allocation.reference_number && (
                    <div>
                      <label className="text-xs font-semibold text-dairy-600 uppercase">Reference Number</label>
                      <p className="text-gray-900 font-medium">{allocation.reference_number}</p>
                    </div>
                  )}
                </div>
                {allocation.notes && (
                  <div className="mt-4 pt-4 border-t border-dairy-200">
                    <label className="text-xs font-semibold text-dairy-600 uppercase flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Notes
                    </label>
                    <p className="text-gray-700 mt-1">{allocation.notes}</p>
                  </div>
                )}
              </div>

              {/* Allocated Invoices */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-fresh-green" />
                  Allocated Invoices
                  <span className="text-sm font-normal text-dairy-600">
                    ({allocation.invoices?.length || 0} invoice{(allocation.invoices?.length || 0) !== 1 ? 's' : ''})
                  </span>
                </h3>

                {allocation.invoices && allocation.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {allocation.invoices.map((invoice) => (
                      <div key={invoice.id} className="card bg-white border border-dairy-200 hover:shadow-md transition">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-dairy-500" />
                              <h4 className="font-semibold text-gray-900">{invoice.invoice_number}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-dairy-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span>Invoice Amount: ₹{invoice.total_amount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <label className="text-xs font-semibold text-dairy-600 uppercase block mb-1">
                              Allocated
                            </label>
                            <p className="text-xl font-bold text-blue-600">
                              ₹{invoice.allocated_amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card text-center py-8 bg-dairy-50">
                    <FileText className="w-12 h-12 text-dairy-300 mx-auto mb-3" />
                    <p className="text-dairy-600">No invoices allocated to this payment</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {allocation.invoices && allocation.invoices.length > 0 && (
                <div className="bg-gradient-to-r from-fresh-green/10 to-fresh-lime/10 border border-fresh-green/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs font-semibold text-dairy-600 uppercase mb-1">Total Invoices</p>
                      <p className="text-2xl font-bold text-gray-900">{allocation.invoices.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-dairy-600 uppercase mb-1">Total Allocated</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{allocation.allocated_amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-dairy-600 uppercase mb-1">Payment Amount</p>
                      <p className="text-2xl font-bold text-fresh-green">
                        ₹{allocation.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    {allocation.unallocated_amount > 0 && (
                      <div className="text-center">
                        <p className="text-xs font-semibold text-dairy-600 uppercase mb-1">Unallocated</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{allocation.unallocated_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-dairy-600">No allocation details found</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-dairy-200">
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAllocationModal;

import React from 'react';
import { X, User, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgingCustomer {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  outstanding_amount: number;
  days_overdue: number;
}

interface AgingDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  customers: AgingCustomer[];
  bucketColor: string;
}

const AgingDrilldownModal: React.FC<AgingDrilldownModalProps> = ({
  isOpen,
  onClose,
  title,
  customers,
  bucketColor,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getColorClasses = () => {
    switch (bucketColor) {
      case 'green':
        return {
          gradient: 'from-green-500 to-green-600',
          bg: 'bg-green-50',
          text: 'text-green-700',
        };
      case 'yellow':
        return {
          gradient: 'from-yellow-500 to-yellow-600',
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
        };
      case 'orange':
        return {
          gradient: 'from-orange-500 to-orange-600',
          bg: 'bg-orange-50',
          text: 'text-orange-700',
        };
      case 'red':
        return {
          gradient: 'from-red-500 to-red-600',
          bg: 'bg-red-50',
          text: 'text-red-700',
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
        };
    }
  };

  const colors = getColorClasses();
  const totalAmount = customers.reduce((sum, c) => sum + c.outstanding_amount, 0);

  const handleViewCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.gradient} p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {title}
              </h2>
              <p className="text-white/80 text-sm">
                {customers.length} customer{customers.length !== 1 ? 's' : ''} - Total: ₹{totalAmount.toLocaleString()}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-112px)]">
          {customers.length === 0 ? (
            <div className={`${colors.bg} rounded-xl p-8 text-center`}>
              <Calendar className={`w-16 h-16 ${colors.text} mx-auto mb-4 opacity-50`} />
              <p className={`${colors.text} font-medium`}>
                No customers in this aging bucket
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div
                  key={customer.customer_id}
                  className={`${colors.bg} border-2 border-transparent hover:border-gray-300 rounded-xl p-4 transition-all`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <User className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">
                            {customer.customer_name}
                          </h3>
                          <p className="text-sm text-gray-600">{customer.customer_code}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-13">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Outstanding: <span className="font-bold text-gray-900">₹{customer.outstanding_amount.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Days Overdue: <span className={`font-bold ${colors.text}`}>{customer.days_overdue}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewCustomer(customer.customer_id)}
                      className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
                    >
                      <span className="flex items-center gap-2">
                        View Details
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total {customers.length} customer{customers.length !== 1 ? 's' : ''} in this bucket
            </div>
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgingDrilldownModal;

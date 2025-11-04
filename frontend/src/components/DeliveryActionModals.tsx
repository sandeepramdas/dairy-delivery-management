import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Delivery {
  id: string;
  delivery_code: string;
  customer_name: string;
  product_name: string;
  scheduled_quantity: number;
  delivery_status: string;
}

interface MarkDeliveredModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onConfirm: (deliveryId: string, data: { delivered_quantity: number; delivery_notes: string }) => Promise<void>;
}

interface MarkMissedModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onConfirm: (deliveryId: string, data: { delivery_notes: string }) => Promise<void>;
}

interface ReportExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onConfirm: (deliveryId: string, data: { exception_type: string; exception_notes: string }) => Promise<void>;
}

export const MarkDeliveredModal: React.FC<MarkDeliveredModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onConfirm,
}) => {
  const [deliveredQuantity, setDeliveredQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (delivery) {
      setDeliveredQuantity(delivery.scheduled_quantity.toString());
      setNotes('');
    }
  }, [delivery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    setLoading(true);
    try {
      await onConfirm(delivery.id, {
        delivered_quantity: parseFloat(deliveredQuantity),
        delivery_notes: notes,
      });
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !delivery) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Mark as Delivered</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Customer</p>
            <p className="font-semibold text-gray-900">{delivery.customer_name}</p>
            <p className="text-xs text-gray-500 mt-1">{delivery.delivery_code}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivered Quantity *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={deliveredQuantity}
                    onChange={(e) => setDeliveredQuantity(e.target.value)}
                    className="input pr-12"
                    placeholder="Enter quantity"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    Liters
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Scheduled: {delivery.scheduled_quantity}L
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Add any notes about the delivery..."
                  rows={3}
                />
              </div>

              <p className="text-xs text-gray-500">
                Time will be captured automatically
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Saving...' : 'Confirm Delivery'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const MarkMissedModal: React.FC<MarkMissedModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const missedReasons = [
    'Customer not available',
    'Wrong address',
    'Payment issue',
    'Customer requested skip',
    'Weather conditions',
    'Vehicle breakdown',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    setLoading(true);
    try {
      const combinedNotes = reason === 'Other' ? notes : `${reason}${notes ? ': ' + notes : ''}`;
      await onConfirm(delivery.id, {
        delivery_notes: combinedNotes,
      });
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !delivery) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Mark as Missed</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Customer</p>
            <p className="font-semibold text-gray-900">{delivery.customer_name}</p>
            <p className="text-xs text-gray-500 mt-1">{delivery.delivery_code}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Missing *
                </label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                >
                  <option value="">Select a reason</option>
                  {missedReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes {reason === 'Other' ? '*' : '(Optional)'}
                </label>
                <textarea
                  required={reason === 'Other'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Provide more details..."
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Confirm Missed'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const ReportExceptionModal: React.FC<ReportExceptionModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onConfirm,
}) => {
  const [exceptionType, setExceptionType] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const exceptionTypes = [
    'Product quality issue',
    'Quantity mismatch',
    'Damaged packaging',
    'Delivery time issue',
    'Customer complaint',
    'Payment dispute',
    'Address issue',
    'Vehicle issue',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    setLoading(true);
    try {
      await onConfirm(delivery.id, {
        exception_type: exceptionType,
        exception_notes: notes,
      });
      onClose();
      setExceptionType('');
      setNotes('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !delivery) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Report Exception</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Customer</p>
            <p className="font-semibold text-gray-900">{delivery.customer_name}</p>
            <p className="text-xs text-gray-500 mt-1">{delivery.delivery_code}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exception Type *
                </label>
                <select
                  required
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value)}
                  className="input"
                >
                  <option value="">Select exception type</option>
                  {exceptionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exception Details *
                </label>
                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Describe the exception in detail..."
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  This exception will be logged and can be reviewed later. The delivery status will remain unchanged.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Reporting...' : 'Report Exception'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

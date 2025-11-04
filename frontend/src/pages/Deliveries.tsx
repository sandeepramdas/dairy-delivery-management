import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, XCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { deliveriesAPI } from '../services/api';
import toast from 'react-hot-toast';
import DeliveryCalendar from '../components/DeliveryCalendar';
import { MarkDeliveredModal, MarkMissedModal, ReportExceptionModal } from '../components/DeliveryActionModals';

interface Delivery {
  id: string;
  delivery_code: string;
  customer_name: string;
  customer_code?: string;
  area_name: string;
  address_line1?: string;
  product_name: string;
  scheduled_quantity: number;
  delivered_quantity?: number;
  delivery_status: 'scheduled' | 'out_for_delivery' | 'delivered' | 'missed' | 'cancelled';
  scheduled_date: string;
  delivered_at?: string;
}

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<string>('all');

  // Modal states
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, [selectedDate, filter]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getByDate(selectedDate, {
        delivery_status: filter === 'all' ? undefined : filter,
      });
      setDeliveries(response.data.data);
    } catch (error) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (deliveryId: string, data: { delivered_quantity: number; delivery_notes: string }) => {
    try {
      await deliveriesAPI.complete(deliveryId, data);
      toast.success('Delivery marked as completed');
      loadDeliveries();
    } catch (error) {
      toast.error('Failed to mark delivery as completed');
      throw error;
    }
  };

  const handleMarkMissed = async (deliveryId: string, data: { delivery_notes: string }) => {
    try {
      await deliveriesAPI.markMissed(deliveryId, data);
      toast.success('Delivery marked as missed');
      loadDeliveries();
    } catch (error) {
      toast.error('Failed to mark delivery as missed');
      throw error;
    }
  };

  const handleReportException = async (deliveryId: string, data: { exception_type: string; exception_notes: string }) => {
    try {
      await deliveriesAPI.reportException(deliveryId, data);
      toast.success('Exception reported successfully');
      loadDeliveries();
    } catch (error) {
      toast.error('Failed to report exception');
      throw error;
    }
  };

  const openDeliveredModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveredModal(true);
  };

  const openMissedModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowMissedModal(true);
  };

  const openExceptionModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowExceptionModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-gray-100 text-gray-700';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-700';
      case 'missed':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'missed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'out_for_delivery':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
          Delivery Calendar
        </h1>
        <p className="text-dairy-600">Manage and track all deliveries</p>
      </div>

      {/* Calendar View */}
      <DeliveryCalendar
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />

      {/* Filters */}
      <div className="card">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Filter by Status
        </label>
        <div className="flex flex-wrap gap-2">
          {['all', 'scheduled', 'out_for_delivery', 'delivered', 'missed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                filter === status
                  ? 'bg-fresh-green text-white shadow-lg'
                  : 'bg-dairy-100 text-dairy-700 hover:bg-dairy-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Deliveries for {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="card hover:shadow-lg transition-all">
              <div className="flex flex-col lg:flex-row items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-fresh-green to-fresh-lime rounded-xl flex items-center justify-center flex-shrink-0">
                  {getStatusIcon(delivery.delivery_status)}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {delivery.customer_name}
                      </h3>
                      <p className="text-sm text-dairy-600">{delivery.delivery_code}</p>
                      {delivery.customer_code && (
                        <p className="text-xs text-gray-500">Code: {delivery.customer_code}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 ${getStatusColor(delivery.delivery_status)} text-xs font-semibold rounded-full capitalize whitespace-nowrap`}>
                      {delivery.delivery_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-dairy-600">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span>{delivery.product_name} - {delivery.scheduled_quantity}L</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-dairy-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{delivery.area_name}</span>
                    </div>
                  </div>

                  {delivery.address_line1 && (
                    <p className="text-sm text-gray-600 mb-3">{delivery.address_line1}</p>
                  )}

                  {delivery.delivered_at && (
                    <p className="text-xs text-green-600 mb-3">
                      ✓ Delivered at {new Date(delivery.delivered_at).toLocaleTimeString()}
                      {delivery.delivered_quantity && ` - ${delivery.delivered_quantity}L`}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {delivery.delivery_status !== 'delivered' && delivery.delivery_status !== 'cancelled' && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => openDeliveredModal(delivery)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Delivered
                      </button>
                      <button
                        onClick={() => openMissedModal(delivery)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Mark Missed
                      </button>
                      <button
                        onClick={() => openExceptionModal(delivery)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm hover:bg-orange-700 transition-colors flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Report Exception
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {deliveries.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No deliveries found</h3>
          <p className="text-dairy-600">
            No deliveries scheduled for this date with the selected filter.
          </p>
        </div>
      )}

      {/* Modals */}
      <MarkDeliveredModal
        isOpen={showDeliveredModal}
        onClose={() => setShowDeliveredModal(false)}
        delivery={selectedDelivery}
        onConfirm={handleMarkDelivered}
      />
      <MarkMissedModal
        isOpen={showMissedModal}
        onClose={() => setShowMissedModal(false)}
        delivery={selectedDelivery}
        onConfirm={handleMarkMissed}
      />
      <ReportExceptionModal
        isOpen={showExceptionModal}
        onClose={() => setShowExceptionModal(false)}
        delivery={selectedDelivery}
        onConfirm={handleReportException}
      />
    </div>
  );
};

export default Deliveries;

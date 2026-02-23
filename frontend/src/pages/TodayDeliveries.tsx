import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, XCircle, Clock, MapPin, AlertTriangle, Truck, RefreshCw, Trash2 } from 'lucide-react';
import { deliveriesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MarkDeliveredModal, MarkMissedModal } from '../components/DeliveryActionModals';

interface Delivery {
  id: string;
  delivery_code: string;
  customer_name: string;
  customer_code?: string;
  customer_phone?: string;
  area_name: string;
  area_code?: string;
  address_line1?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  location_notes?: string;
  product_name: string;
  scheduled_quantity: number;
  delivered_quantity?: number;
  delivery_status: 'scheduled' | 'out_for_delivery' | 'delivered' | 'missed' | 'cancelled';
  scheduled_date: string;
  delivered_at?: string;
  amount: number;
  unit?: string;
}

interface DeliveryGroup {
  area_name: string;
  area_code: string;
  deliveries: Delivery[];
  totalQuantity: number;
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
  missedCount: number;
}

const TodayDeliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedDeliveries, setSelectedDeliveries] = useState<Set<string>>(new Set());
  const [groupedByArea, setGroupedByArea] = useState<DeliveryGroup[]>([]);

  // Modal states
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    loadTodayDeliveries();
    const interval = setInterval(loadTodayDeliveries, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [filter]);

  useEffect(() => {
    // Group deliveries by area
    const groups = deliveries.reduce((acc, delivery) => {
      const areaName = delivery.area_name || 'Unknown Area';
      const areaCode = delivery.area_code || '';

      if (!acc[areaName]) {
        acc[areaName] = {
          area_name: areaName,
          area_code: areaCode,
          deliveries: [],
          totalQuantity: 0,
          totalAmount: 0,
          completedCount: 0,
          pendingCount: 0,
          missedCount: 0,
        };
      }

      acc[areaName].deliveries.push(delivery);
      acc[areaName].totalQuantity += parseFloat(delivery.scheduled_quantity.toString());
      acc[areaName].totalAmount += parseFloat(delivery.amount.toString());

      if (delivery.delivery_status === 'delivered') acc[areaName].completedCount++;
      else if (delivery.delivery_status === 'missed') acc[areaName].missedCount++;
      else acc[areaName].pendingCount++;

      return acc;
    }, {} as Record<string, DeliveryGroup>);

    setGroupedByArea(Object.values(groups));
  }, [deliveries]);

  const loadTodayDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getTodayDeliveries({
        delivery_status: filter === 'all' ? undefined : filter,
      });
      setDeliveries(response.data.data);
    } catch (error) {
      toast.error('Failed to load today\'s deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (deliveryId: string, data: { delivered_quantity: number; delivery_notes: string }) => {
    try {
      await deliveriesAPI.complete(deliveryId, data);
      toast.success('Delivery marked as completed');
      loadTodayDeliveries();
      setSelectedDeliveries(new Set());
    } catch (error) {
      toast.error('Failed to mark delivery as completed');
      throw error;
    }
  };

  const handleMarkMissed = async (deliveryId: string, data: { delivery_notes: string }) => {
    try {
      await deliveriesAPI.markMissed(deliveryId, data);
      toast.success('Delivery marked as missed');
      loadTodayDeliveries();
      setSelectedDeliveries(new Set());
    } catch (error) {
      toast.error('Failed to mark delivery as missed');
      throw error;
    }
  };

  const handleBulkMarkDelivered = async () => {
    if (selectedDeliveries.size === 0) {
      toast.error('Please select deliveries to mark as completed');
      return;
    }

    try {
      const promises = Array.from(selectedDeliveries).map(id => {
        const delivery = deliveries.find(d => d.id === id);
        if (!delivery) return Promise.resolve();
        return deliveriesAPI.complete(id, {
          delivered_quantity: delivery.scheduled_quantity,
          delivery_notes: 'Bulk completed'
        });
      });

      await Promise.all(promises);
      toast.success(`${selectedDeliveries.size} deliveries marked as completed`);
      setSelectedDeliveries(new Set());
      loadTodayDeliveries();
    } catch (error) {
      toast.error('Failed to complete bulk action');
    }
  };

  const handleBulkMarkMissed = async () => {
    if (selectedDeliveries.size === 0) {
      toast.error('Please select deliveries to mark as missed');
      return;
    }

    try {
      const promises = Array.from(selectedDeliveries).map(id =>
        deliveriesAPI.markMissed(id, { delivery_notes: 'Bulk marked missed' })
      );

      await Promise.all(promises);
      toast.success(`${selectedDeliveries.size} deliveries marked as missed`);
      setSelectedDeliveries(new Set());
      loadTodayDeliveries();
    } catch (error) {
      toast.error('Failed to complete bulk action');
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery? This action cannot be undone.')) {
      return;
    }

    try {
      await deliveriesAPI.delete(id);
      toast.success('Delivery deleted successfully');
      loadTodayDeliveries();
    } catch (error) {
      toast.error('Failed to delete delivery');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeliveries.size === 0) {
      toast.error('Please select deliveries to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedDeliveries.size} deliveries? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = Array.from(selectedDeliveries).map(id =>
        deliveriesAPI.delete(id)
      );

      await Promise.all(promises);
      toast.success(`${selectedDeliveries.size} deliveries deleted successfully`);
      setSelectedDeliveries(new Set());
      loadTodayDeliveries();
    } catch (error) {
      toast.error('Failed to delete deliveries');
    }
  };

  const toggleSelectDelivery = (id: string) => {
    const newSet = new Set(selectedDeliveries);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDeliveries(newSet);
  };

  const toggleSelectArea = (areaDeliveries: Delivery[]) => {
    const newSet = new Set(selectedDeliveries);
    const areaIds = areaDeliveries.map(d => d.id);
    const allSelected = areaIds.every(id => newSet.has(id));

    if (allSelected) {
      areaIds.forEach(id => newSet.delete(id));
    } else {
      areaIds.forEach(id => newSet.add(id));
    }
    setSelectedDeliveries(newSet);
  };

  const openDeliveredModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveredModal(true);
  };

  const openMissedModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowMissedModal(true);
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
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: deliveries.length,
    completed: deliveries.filter(d => d.delivery_status === 'delivered').length,
    pending: deliveries.filter(d => d.delivery_status === 'scheduled' || d.delivery_status === 'out_for_delivery').length,
    missed: deliveries.filter(d => d.delivery_status === 'missed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading today's deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Truck className="w-8 h-8 text-fresh-green" />
            Today's Deliveries
          </h1>
          <p className="text-dairy-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <button
          onClick={loadTodayDeliveries}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Deliveries</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Missed</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.missed}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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

          {selectedDeliveries.size > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm">
                {selectedDeliveries.size} selected
              </span>
              <button
                onClick={handleBulkMarkDelivered}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Delivered
              </button>
              <button
                onClick={handleBulkMarkMissed}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Mark Missed
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deliveries Grouped by Area */}
      <div className="space-y-6">
        {groupedByArea.map((group) => (
          <div key={group.area_name} className="card">
            {/* Area Header */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={group.deliveries.every(d => selectedDeliveries.has(d.id))}
                    onChange={() => toggleSelectArea(group.deliveries)}
                    className="w-5 h-5 rounded border-gray-300 text-fresh-green focus:ring-fresh-green"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-fresh-green" />
                      {group.area_name}
                      {group.area_code && (
                        <span className="text-sm font-normal text-dairy-600">({group.area_code})</span>
                      )}
                    </h3>
                    <p className="text-sm text-dairy-600 mt-1">
                      {group.deliveries.length} deliveries • {group.totalQuantity}L total • ₹{group.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {group.completedCount} done
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                    {group.pendingCount} pending
                  </span>
                  {group.missedCount > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      {group.missedCount} missed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Deliveries in Area */}
            <div className="space-y-3">
              {group.deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    selectedDeliveries.has(delivery.id)
                      ? 'border-fresh-green bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDeliveries.has(delivery.id)}
                      onChange={() => toggleSelectDelivery(delivery.id)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-fresh-green focus:ring-fresh-green"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {delivery.customer_name}
                          </h4>
                          {delivery.customer_phone && (
                            <p className="text-sm text-dairy-600">📞 {delivery.customer_phone}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 ${getStatusColor(delivery.delivery_status)} text-xs font-semibold rounded-full capitalize whitespace-nowrap`}>
                          {delivery.delivery_status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center gap-2 text-sm text-dairy-600">
                          <Package className="w-4 h-4 flex-shrink-0" />
                          <span>{delivery.product_name} - {delivery.scheduled_quantity}{delivery.unit || 'L'}</span>
                        </div>
                        <div className="text-sm text-dairy-600">
                          Amount: ₹{parseFloat(delivery.amount.toString()).toFixed(2)}
                        </div>
                      </div>

                      {delivery.address_line1 && (
                        <p className="text-sm text-gray-600 mb-2">📍 {delivery.address_line1}{delivery.city ? `, ${delivery.city}` : ''}</p>
                      )}

                      {delivery.location_notes && (
                        <p className="text-xs text-blue-600 mb-2">ℹ️ {delivery.location_notes}</p>
                      )}

                      {delivery.delivered_at && (
                        <p className="text-xs text-green-600 mb-2">
                          ✓ Delivered at {new Date(delivery.delivered_at).toLocaleTimeString()}
                          {delivery.delivered_quantity && ` - ${delivery.delivered_quantity}${delivery.unit || 'L'}`}
                        </p>
                      )}

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {delivery.delivery_status !== 'delivered' && delivery.delivery_status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => openDeliveredModal(delivery)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Delivered
                            </button>
                            <button
                              onClick={() => openMissedModal(delivery)}
                              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg font-medium text-xs hover:bg-orange-700 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Missed
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteDelivery(delivery.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-medium text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {deliveries.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Truck className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No deliveries for today</h3>
          <p className="text-dairy-600">
            {filter === 'all'
              ? 'There are no deliveries scheduled for today.'
              : `No ${filter.replace('_', ' ')} deliveries found.`}
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
    </div>
  );
};

export default TodayDeliveries;

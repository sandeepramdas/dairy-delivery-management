import React, { useEffect, useState } from 'react';
import { Package, Search, Calendar, Clock, Plus, Play, Pause, XCircle, Edit2, AlertCircle } from 'lucide-react';
import { subscriptionsAPI } from '../services/api';
import SubscriptionModal from '../components/SubscriptionModal';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  customer_name: string;
  customer_code: string;
  product_name: string;
  product_code: string;
  unit: string;
  plan_name: string;
  plan_type: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'paused' | 'cancelled';
  schedule?: any[];
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'pause' | 'resume' | 'cancel' | null;
  subscriptionId: string | null;
}

const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | 'all'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    type: null,
    subscriptionId: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, [search, statusFilter]);

  const loadSubscriptions = async () => {
    try {
      const response = await subscriptionsAPI.getAll({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setSubscriptions(response.data.data);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = () => {
    setModalMode('create');
    setSelectedSubscription(null);
    setModalOpen(true);
  };

  const handleEditSubscription = async (subscription: Subscription) => {
    try {
      // Fetch full subscription details with schedule
      const response = await subscriptionsAPI.getById(subscription.id);
      setSelectedSubscription(response.data.data);
      setModalMode('edit');
      setModalOpen(true);
    } catch (error) {
      toast.error('Failed to load subscription details');
    }
  };

  const openConfirmDialog = (
    type: 'pause' | 'resume' | 'cancel',
    subscriptionId: string,
    customerName: string
  ) => {
    const dialogs = {
      pause: {
        title: 'Pause Subscription',
        message: `Are you sure you want to pause the subscription for ${customerName}? Deliveries will be temporarily stopped.`,
      },
      resume: {
        title: 'Resume Subscription',
        message: `Are you sure you want to resume the subscription for ${customerName}? Deliveries will restart.`,
      },
      cancel: {
        title: 'Cancel Subscription',
        message: `Are you sure you want to cancel the subscription for ${customerName}? This action will end the subscription permanently.`,
      },
    };

    setConfirmDialog({
      isOpen: true,
      title: dialogs[type].title,
      message: dialogs[type].message,
      type,
      subscriptionId,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type || !confirmDialog.subscriptionId) return;

    setActionLoading(confirmDialog.subscriptionId);
    try {
      switch (confirmDialog.type) {
        case 'pause':
          await subscriptionsAPI.pause(confirmDialog.subscriptionId);
          toast.success('Subscription paused successfully');
          break;
        case 'resume':
          await subscriptionsAPI.resume(confirmDialog.subscriptionId);
          toast.success('Subscription resumed successfully');
          break;
        case 'cancel':
          await subscriptionsAPI.cancel(confirmDialog.subscriptionId);
          toast.success('Subscription cancelled successfully');
          break;
      }
      loadSubscriptions();
    } catch (error) {
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        type: null,
        subscriptionId: null,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-fresh-green';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getQuantityDisplay = (subscription: Subscription) => {
    if (subscription.plan_type === 'daily' && subscription.schedule?.[0]) {
      return `${subscription.schedule[0].quantity} ${subscription.unit}/day`;
    } else if (subscription.plan_type === 'weekly' && subscription.schedule) {
      const total = subscription.schedule.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0);
      return `${total.toFixed(1)} ${subscription.unit}/week`;
    }
    return `${subscription.unit}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading subscriptions...</p>
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
            Subscriptions
          </h1>
          <p className="text-dairy-600">Manage customer subscription plans</p>
        </div>
        <button
          onClick={handleCreateSubscription}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Create Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-12"
              placeholder="Search by customer name or code..."
            />
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'paused', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-fresh-green text-white shadow-lg'
                    : 'bg-dairy-100 text-dairy-700 hover:bg-dairy-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="card hover:shadow-xl transform transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-fresh-green to-fresh-lime rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {subscription.customer_name}
                    </h3>
                    <p className="text-sm text-dairy-600">{subscription.customer_code}</p>
                  </div>
                  <span className={`px-3 py-1 ${getStatusColor(subscription.status)} text-xs font-semibold rounded-full capitalize`}>
                    {subscription.status}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-dairy-500" />
                    <span className="font-medium text-gray-700">
                      {subscription.product_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dairy-600">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{subscription.plan_type} Plan</span>
                    {subscription.schedule && (
                      <span className="text-xs bg-dairy-100 px-2 py-0.5 rounded-full">
                        {getQuantityDisplay(subscription)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dairy-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Started {new Date(subscription.start_date).toLocaleDateString()}
                    </span>
                    {subscription.end_date && (
                      <span className="text-xs">
                        • Ends {new Date(subscription.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-dairy-200">
              {subscription.status === 'active' && (
                <>
                  <button
                    onClick={() => handleEditSubscription(subscription)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                    disabled={actionLoading === subscription.id}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openConfirmDialog('pause', subscription.id, subscription.customer_name)}
                    className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1"
                    disabled={actionLoading === subscription.id}
                  >
                    {actionLoading === subscription.id ? (
                      <div className="w-4 h-4 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openConfirmDialog('cancel', subscription.id, subscription.customer_name)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1"
                    disabled={actionLoading === subscription.id}
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
              {subscription.status === 'paused' && (
                <>
                  <button
                    onClick={() => handleEditSubscription(subscription)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                    disabled={actionLoading === subscription.id}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openConfirmDialog('resume', subscription.id, subscription.customer_name)}
                    className="flex-1 bg-green-50 hover:bg-green-100 text-fresh-green text-sm py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1"
                    disabled={actionLoading === subscription.id}
                  >
                    {actionLoading === subscription.id ? (
                      <div className="w-4 h-4 border-2 border-fresh-green border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openConfirmDialog('cancel', subscription.id, subscription.customer_name)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1"
                    disabled={actionLoading === subscription.id}
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
              {subscription.status === 'cancelled' && (
                <div className="flex-1 text-center text-sm text-dairy-500 py-2">
                  Subscription cancelled
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No subscriptions found</h3>
          <p className="text-dairy-600 mb-4">
            {search ? 'Try adjusting your search' : 'No subscriptions match the selected filter'}
          </p>
          {!search && statusFilter === 'all' && (
            <button onClick={handleCreateSubscription} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Subscription
            </button>
          )}
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSubscription(null);
        }}
        onSuccess={loadSubscriptions}
        subscription={selectedSubscription}
        mode={modalMode}
      />

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-gray-600">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() =>
                  setConfirmDialog({
                    isOpen: false,
                    title: '',
                    message: '',
                    type: null,
                    subscriptionId: null,
                  })
                }
                className="btn-secondary flex-1"
                disabled={actionLoading !== null}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition ${
                  confirmDialog.type === 'cancel'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : confirmDialog.type === 'pause'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-fresh-green hover:bg-green-700 text-white'
                }`}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="capitalize">Confirm {confirmDialog.type}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;

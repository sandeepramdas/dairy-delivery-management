import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Calendar,
  DollarSign,
  CreditCard,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import AgingDrilldownModal from '../components/AgingDrilldownModal';
import type { DashboardStats } from '../types';

interface AgingBucket {
  amount: number;
  count: number;
  customers: Array<{
    customer_id: string;
    customer_name: string;
    customer_code: string;
    outstanding_amount: number;
    days_overdue: number;
  }>;
}

interface AgingSummary {
  current: AgingBucket;
  days_1_30: AgingBucket;
  days_31_60: AgingBucket;
  days_61_90: AgingBucket;
  days_over_90: AgingBucket;
  total_outstanding: number;
  total_customers: number;
}

interface DeliveryReport {
  total_deliveries: number;
  completed: number;
  missed: number;
  pending: number;
  completion_rate: number;
  total_quantity: number;
  average_per_day: number;
  by_area: Array<{
    area_name: string;
    total: number;
    completed: number;
    completion_rate: number;
  }>;
}

interface FinancialReport {
  total_revenue: number;
  collected: number;
  pending: number;
  overdue: number;
  by_payment_method: Array<{
    payment_method: string;
    amount: number;
    count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    revenue: number;
    payments: number;
  }>;
}

interface CustomerReport {
  total_customers: number;
  active_customers: number;
  active_rate: number;
  new_this_month: number;
  top_customers: Array<{
    customer_name: string;
    customer_code: string;
    total_revenue: number;
  }>;
  by_area: Array<{
    area_name: string;
    customer_count: number;
  }>;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'financial' | 'aging' | 'customers'>('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [agingSummary, setAgingSummary] = useState<AgingSummary | null>(null);
  const [deliveryReport, setDeliveryReport] = useState<DeliveryReport | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReport | null>(null);

  // Date filters
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Aging drilldown modal
  const [showAgingModal, setShowAgingModal] = useState(false);
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<{
    title: string;
    customers: any[];
    color: string;
  } | null>(null);

  useEffect(() => {
    loadAllReports();
  }, [activeTab, dateRange, startDate, endDate]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      // Load dashboard stats for overview
      if (activeTab === 'overview') {
        const dashResponse = await reportsAPI.getDashboard();
        setDashboardStats(dashResponse.data.data);
      }

      // Load aging report
      if (activeTab === 'aging') {
        const agingResponse = await reportsAPI.getAging();
        setAgingSummary(agingResponse.data.data);
      }

      // Load delivery report
      if (activeTab === 'deliveries') {
        const params = getDateParams();
        const deliveryResponse = await reportsAPI.getDeliveries(params);
        setDeliveryReport(deliveryResponse.data.data);
      }

      // Load financial report
      if (activeTab === 'financial') {
        const params = getDateParams();
        const financialResponse = await reportsAPI.getFinancial(params);
        setFinancialReport(financialResponse.data.data);
      }

      // Load customer report
      if (activeTab === 'customers') {
        const customerResponse = await reportsAPI.getCustomers();
        setCustomerReport(customerResponse.data.data);
      }
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getDateParams = () => {
    if (dateRange === 'custom' && startDate && endDate) {
      return { start_date: startDate, end_date: endDate };
    }

    const today = new Date();
    const daysAgo = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    const start = new Date(today);
    start.setDate(today.getDate() - daysAgo);

    return {
      start_date: start.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };
  };

  const openAgingDrilldown = (
    title: string,
    customers: any[],
    color: string
  ) => {
    setSelectedAgingBucket({ title, customers, color });
    setShowAgingModal(true);
  };

  const renderOverview = () => {
    if (!dashboardStats) return null;

    const overviewCards = [
      {
        title: "Today's Revenue",
        value: `₹${dashboardStats.today_revenue.revenue?.toLocaleString() || 0}`,
        subtitle: `${dashboardStats.today_revenue.quantity_delivered || 0}L delivered`,
        icon: DollarSign,
        gradient: 'from-fresh-green to-fresh-lime',
        trend: null,
      },
      {
        title: 'Active Subscriptions',
        value: dashboardStats.active_stats.active_subscriptions || 0,
        subtitle: `${dashboardStats.active_stats.active_customers || 0} customers`,
        icon: Package,
        gradient: 'from-blue-500 to-blue-600',
        trend: null,
      },
      {
        title: 'Pending Deliveries',
        value: dashboardStats.today_deliveries.pending || 0,
        subtitle: `${dashboardStats.today_deliveries.total || 0} total today`,
        icon: Clock,
        gradient: 'from-yellow-500 to-yellow-600',
        trend: null,
      },
      {
        title: 'Outstanding Amount',
        value: `₹${dashboardStats.pending_collections.total?.toLocaleString() || 0}`,
        subtitle: `${dashboardStats.overdue_invoices.count || 0} overdue invoices`,
        icon: AlertCircle,
        gradient: 'from-red-500 to-red-600',
        trend: null,
      },
    ];

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewCards.map((card, index) => (
            <div key={index} className="card hover:scale-105 transform transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl shadow-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                {card.trend && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    card.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(card.trend)}%
                  </div>
                )}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {card.value}
              </h3>
              <p className="text-sm text-dairy-600 font-medium">{card.title}</p>
              <p className="text-xs text-dairy-500 mt-1">{card.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Delivery Status */}
          <div className="card">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
              Today's Delivery Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-fresh-green" />
                  <span className="font-medium text-gray-700">Completed</span>
                </div>
                <span className="font-bold text-fresh-green text-xl">
                  {dashboardStats.today_deliveries.completed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-700">In Progress</span>
                </div>
                <span className="font-bold text-blue-600 text-xl">
                  {dashboardStats.today_deliveries.in_progress || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-700">Pending</span>
                </div>
                <span className="font-bold text-yellow-600 text-xl">
                  {dashboardStats.today_deliveries.pending || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Overview */}
          <div className="card">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
              Payment Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-dairy-100">
                <span className="text-dairy-600">Today's Collections</span>
                <span className="font-bold text-fresh-green text-lg">
                  ₹{dashboardStats.today_payments.total?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-dairy-100">
                <span className="text-dairy-600">Payment Count</span>
                <span className="font-bold text-gray-900 text-lg">
                  {dashboardStats.today_payments.count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-dairy-100">
                <span className="text-dairy-600">Pending Collections</span>
                <span className="font-bold text-orange-600 text-lg">
                  ₹{dashboardStats.pending_collections.total?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dairy-600">Overdue Amount</span>
                <span className="font-bold text-red-600 text-lg">
                  ₹{dashboardStats.overdue_invoices.total?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeliveryAnalytics = () => {
    if (!deliveryReport) return null;

    return (
      <div className="space-y-6">
        {/* Delivery Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Total Deliveries</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {deliveryReport.total_deliveries}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {deliveryReport.total_quantity}L total quantity
            </p>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-fresh-green" />
              <span className="text-sm font-medium text-green-700">Completed</span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              {deliveryReport.completion_rate.toFixed(1)}%
            </p>
            <p className="text-xs text-green-600 mt-1">
              {deliveryReport.completed} deliveries
            </p>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <span className="text-sm font-medium text-red-700">Missed</span>
            </div>
            <p className="text-3xl font-bold text-red-900">
              {((deliveryReport.missed / deliveryReport.total_deliveries) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-red-600 mt-1">
              {deliveryReport.missed} deliveries
            </p>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Avg Per Day</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {Math.round(deliveryReport.average_per_day)}
            </p>
            <p className="text-xs text-purple-600 mt-1">deliveries per day</p>
          </div>
        </div>

        {/* Area Performance */}
        <div className="card">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-fresh-green" />
            Top Performing Areas
          </h3>
          <div className="space-y-3">
            {deliveryReport.by_area.slice(0, 5).map((area, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{area.area_name}</span>
                    <span className="text-sm text-gray-600">
                      {area.completed}/{area.total} ({area.completion_rate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fresh-green to-fresh-lime"
                      style={{ width: `${area.completion_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialReports = () => {
    if (!financialReport) return null;

    return (
      <div className="space-y-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-fresh-green" />
              <span className="text-sm font-medium text-green-700">Total Revenue</span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              ₹{financialReport.total_revenue.toLocaleString()}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Collected</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              ₹{financialReport.collected.toLocaleString()}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Pending</span>
            </div>
            <p className="text-3xl font-bold text-yellow-900">
              ₹{financialReport.pending.toLocaleString()}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="text-sm font-medium text-red-700">Overdue</span>
            </div>
            <p className="text-3xl font-bold text-red-900">
              ₹{financialReport.overdue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-fresh-green" />
            Payment Method Breakdown
          </h3>
          <div className="space-y-3">
            {financialReport.by_payment_method.map((method, index) => {
              const percentage = (method.amount / financialReport.total_revenue) * 100;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 capitalize">
                        {method.payment_method.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        ₹{method.amount.toLocaleString()} ({method.count} transactions)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-fresh-green to-fresh-lime"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-fresh-green" />
            Monthly Revenue Trend
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-dairy-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Payments</th>
                </tr>
              </thead>
              <tbody>
                {financialReport.monthly_trend.map((month, index) => (
                  <tr key={index} className="border-b border-dairy-100 hover:bg-dairy-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{month.month}</td>
                    <td className="text-right py-3 px-4 text-gray-900">
                      ₹{month.revenue.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">{month.payments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAgingAnalysis = () => {
    if (!agingSummary) return null;

    const buckets = [
      {
        title: '0-30 Days',
        amount: agingSummary.days_1_30.amount,
        count: agingSummary.days_1_30.count,
        color: 'green',
        gradient: 'from-green-500 to-green-600',
        bg: 'bg-green-50',
        text: 'text-green-700',
        customers: agingSummary.days_1_30.customers,
      },
      {
        title: '31-60 Days',
        amount: agingSummary.days_31_60.amount,
        count: agingSummary.days_31_60.count,
        color: 'yellow',
        gradient: 'from-yellow-500 to-yellow-600',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        customers: agingSummary.days_31_60.customers,
      },
      {
        title: '61-90 Days',
        amount: agingSummary.days_61_90.amount,
        count: agingSummary.days_61_90.count,
        color: 'orange',
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        customers: agingSummary.days_61_90.customers,
      },
      {
        title: '90+ Days',
        amount: agingSummary.days_over_90.amount,
        count: agingSummary.days_over_90.count,
        color: 'red',
        gradient: 'from-red-500 to-red-600',
        bg: 'bg-red-50',
        text: 'text-red-700',
        customers: agingSummary.days_over_90.customers,
      },
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Total Outstanding</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">
              ₹{agingSummary.total_outstanding.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              across {agingSummary.total_customers} customers
            </p>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Customers with Balance</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {agingSummary.total_customers}
            </p>
            <p className="text-xs text-blue-600 mt-1">with outstanding amounts</p>
          </div>
        </div>

        {/* Aging Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {buckets.map((bucket, index) => (
            <div
              key={index}
              className={`card ${bucket.bg} border-2 border-transparent hover:border-gray-300 cursor-pointer transition-all`}
              onClick={() => openAgingDrilldown(bucket.title, bucket.customers, bucket.color)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold ${bucket.text}`}>
                  {bucket.title}
                </span>
                <Calendar className={`w-5 h-5 ${bucket.text}`} />
              </div>
              <p className={`text-2xl font-bold ${bucket.text} mb-1`}>
                ₹{bucket.amount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">
                {bucket.count} customer{bucket.count !== 1 ? 's' : ''}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  Click to view details
                  <TrendingUp className="w-3 h-3" />
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Current (Not Overdue) */}
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Current (Not Overdue)</h3>
              <p className="text-sm text-gray-600">
                {agingSummary.current.count} customer{agingSummary.current.count !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                ₹{agingSummary.current.amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerAnalytics = () => {
    if (!customerReport) return null;

    return (
      <div className="space-y-6">
        {/* Customer Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Total Customers</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {customerReport.total_customers}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-fresh-green" />
              <span className="text-sm font-medium text-green-700">Active Rate</span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              {customerReport.active_rate.toFixed(1)}%
            </p>
            <p className="text-xs text-green-600 mt-1">
              {customerReport.active_customers} active
            </p>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">New This Month</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {customerReport.new_this_month}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Areas Served</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">
              {customerReport.by_area.length}
            </p>
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-fresh-green" />
            Top Customers by Revenue
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-dairy-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {customerReport.top_customers.map((customer, index) => (
                  <tr key={index} className="border-b border-dairy-100 hover:bg-dairy-50">
                    <td className="py-3 px-4 font-bold text-fresh-green">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {customer.customer_name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{customer.customer_code}</td>
                    <td className="text-right py-3 px-4 font-bold text-gray-900">
                      ₹{customer.total_revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Area Distribution */}
        <div className="card">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-fresh-green" />
            Customer Distribution by Area
          </h3>
          <div className="space-y-3">
            {customerReport.by_area.map((area, index) => {
              const percentage = (area.customer_count / customerReport.total_customers) * 100;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{area.area_name}</span>
                      <span className="text-sm text-gray-600">
                        {area.customer_count} customers ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-fresh-green to-fresh-lime"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
          Reports & Analytics
        </h1>
        <p className="text-dairy-600">Comprehensive business insights and analytics</p>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'deliveries', label: 'Deliveries', icon: Package },
            { key: 'financial', label: 'Financial', icon: DollarSign },
            { key: 'aging', label: 'Aging Analysis', icon: Calendar },
            { key: 'customers', label: 'Customers', icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-fresh-green text-white shadow-lg'
                  : 'bg-dairy-100 text-dairy-700 hover:bg-dairy-200'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter (for deliveries and financial) */}
      {(activeTab === 'deliveries' || activeTab === 'financial') && (
        <div className="card">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: '7days', label: 'Last 7 Days' },
              { key: '30days', label: 'Last 30 Days' },
              { key: '90days', label: 'Last 90 Days' },
              { key: 'custom', label: 'Custom Range' },
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setDateRange(range.key as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  dateRange === range.key
                    ? 'bg-fresh-green text-white shadow-lg'
                    : 'bg-dairy-100 text-dairy-700 hover:bg-dairy-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading reports...</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'deliveries' && renderDeliveryAnalytics()}
          {activeTab === 'financial' && renderFinancialReports()}
          {activeTab === 'aging' && renderAgingAnalysis()}
          {activeTab === 'customers' && renderCustomerAnalytics()}
        </>
      )}

      {/* Aging Drilldown Modal */}
      {selectedAgingBucket && (
        <AgingDrilldownModal
          isOpen={showAgingModal}
          onClose={() => setShowAgingModal(false)}
          title={selectedAgingBucket.title}
          customers={selectedAgingBucket.customers}
          bucketColor={selectedAgingBucket.color}
        />
      )}
    </div>
  );
};

export default Reports;

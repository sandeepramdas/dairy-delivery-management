import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { reportsAPI } from '../services/api';
import type { DashboardStats } from '../types';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await reportsAPI.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Deliveries",
      value: stats?.today_deliveries.total || 0,
      subtitle: `${stats?.today_deliveries.completed || 0} completed`,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: "Today's Revenue",
      value: `₹${stats?.today_revenue.revenue?.toLocaleString() || 0}`,
      subtitle: `${stats?.today_revenue.quantity_delivered || 0}L delivered`,
      icon: TrendingUp,
      gradient: 'from-fresh-green to-fresh-lime',
      bgColor: 'bg-green-50',
      iconColor: 'text-fresh-green',
    },
    {
      title: 'Active Customers',
      value: stats?.active_stats.active_customers || 0,
      subtitle: `${stats?.active_stats.active_subscriptions || 0} subscriptions`,
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Pending Collections',
      value: `₹${stats?.pending_collections.total?.toLocaleString() || 0}`,
      subtitle: `${stats?.overdue_invoices.count || 0} overdue`,
      icon: DollarSign,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
          Dashboard 🥛
        </h1>
        <p className="text-dairy-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="card hover:scale-105 transform transition-transform duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-dairy-600 font-medium">{stat.title}</p>
            <p className="text-xs text-dairy-500 mt-1">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Deliveries */}
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
              <span className="font-bold text-fresh-green">
                {stats?.today_deliveries.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-700">Pending</span>
              </div>
              <span className="font-bold text-yellow-600">
                {stats?.today_deliveries.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">In Progress</span>
              </div>
              <span className="font-bold text-blue-600">
                {stats?.today_deliveries.in_progress || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
            Quick Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-dairy-100">
              <span className="text-dairy-600">Active Areas</span>
              <span className="font-bold text-gray-900">
                {stats?.active_stats.active_areas || 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-dairy-100">
              <span className="text-dairy-600">Today's Payments</span>
              <span className="font-bold text-gray-900">
                ₹{stats?.today_payments.total?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-dairy-100">
              <span className="text-dairy-600">Payment Count</span>
              <span className="font-bold text-gray-900">
                {stats?.today_payments.count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dairy-600">Overdue Amount</span>
              <span className="font-bold text-red-600">
                ₹{stats?.overdue_invoices.total?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="card bg-gradient-to-r from-fresh-mint to-green-50 border-2 border-fresh-green/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Package className="w-6 h-6 text-fresh-green" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-1">
              🎉 Everything's Fresh Today!
            </h3>
            <p className="text-dairy-700">
              You have {stats?.today_deliveries.pending || 0} deliveries pending.
              Keep up the great work delivering fresh milk to happy customers!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'manager' | 'delivery_person';
  is_active: boolean;
}

export interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email?: string;
  area_id: string;
  area_name?: string;
  area_code?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  status: 'active' | 'inactive' | 'suspended';
  latitude?: number;
  longitude?: number;
  location_notes?: string;
  alternate_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  today_deliveries: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
  };
  today_revenue: {
    revenue: number;
    quantity_delivered: number;
  };
  today_payments: {
    count: number;
    total: number;
  };
  active_stats: {
    active_customers: number;
    active_subscriptions: number;
    active_areas: number;
  };
  pending_collections: {
    total: number;
  };
  overdue_invoices: {
    count: number;
    total: number;
  };
}

export interface AgingCustomer {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  outstanding_amount: number;
  days_overdue: number;
}

export interface AgingBucket {
  amount: number;
  count: number;
  customers: AgingCustomer[];
}

export interface AgingSummary {
  current: AgingBucket;
  days_1_30: AgingBucket;
  days_31_60: AgingBucket;
  days_61_90: AgingBucket;
  days_over_90: AgingBucket;
  total_outstanding: number;
  total_customers: number;
}

export interface DeliveryReport {
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

export interface FinancialReport {
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

export interface CustomerReport {
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

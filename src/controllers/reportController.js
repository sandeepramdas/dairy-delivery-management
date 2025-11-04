const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get aging report
const getAgingReport = async (req, res, next) => {
  try {
    const { area_id, status } = req.query;

    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;

    if (area_id) {
      whereClause += ` AND area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    const result = await query(
      `SELECT * FROM vw_customer_outstanding
       WHERE 1=1 ${whereClause}
       ORDER BY total_outstanding DESC`,
      queryParams
    );

    // Calculate totals
    const totals = result.rows.reduce(
      (acc, row) => ({
        total_outstanding: acc.total_outstanding + parseFloat(row.total_outstanding || 0),
        current_amount: acc.current_amount + parseFloat(row.current_amount || 0),
        days_1_30: acc.days_1_30 + parseFloat(row.days_1_30 || 0),
        days_31_60: acc.days_31_60 + parseFloat(row.days_31_60 || 0),
        days_61_90: acc.days_61_90 + parseFloat(row.days_61_90 || 0),
        days_90_plus: acc.days_90_plus + parseFloat(row.days_90_plus || 0),
      }),
      {
        total_outstanding: 0,
        current_amount: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_90_plus: 0,
      }
    );

    return successResponse(
      res,
      {
        customers: result.rows,
        totals,
        count: result.rows.length,
      },
      'Aging report fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get financial summary
const getFinancialSummary = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;

    const queryParams = [];
    let dateFilter = '';
    let paramIndex = 1;

    if (date_from && date_to) {
      dateFilter = ` AND scheduled_date >= $${paramIndex} AND scheduled_date <= $${paramIndex + 1}`;
      queryParams.push(date_from, date_to);
      paramIndex += 2;
    }

    // Revenue from deliveries
    const revenueResult = await query(
      `SELECT
         COUNT(*) as total_deliveries,
         COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as completed_deliveries,
         SUM(CASE WHEN delivery_status = 'delivered' THEN amount ELSE 0 END) as total_revenue,
         SUM(CASE WHEN delivery_status = 'delivered' THEN delivered_quantity ELSE 0 END) as total_quantity_delivered
       FROM deliveries
       WHERE 1=1 ${dateFilter}`,
      queryParams
    );

    // Payments collected
    const paymentParams = date_from && date_to ? [date_from, date_to] : [];
    const paymentDateFilter = date_from && date_to ? ' WHERE payment_date >= $1 AND payment_date <= $2' : '';

    const paymentResult = await query(
      `SELECT
         COUNT(*) as total_payments,
         SUM(amount) as total_collected,
         SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END) as cash_collected,
         SUM(CASE WHEN payment_method = 'upi' THEN amount ELSE 0 END) as upi_collected,
         SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END) as card_collected,
         SUM(CASE WHEN payment_method = 'bank_transfer' THEN amount ELSE 0 END) as bank_transfer_collected
       FROM payments
       ${paymentDateFilter}
       AND payment_status = 'completed'`,
      paymentParams
    );

    // Outstanding amount
    const outstandingResult = await query(
      `SELECT
         SUM(balance_amount) as total_outstanding,
         COUNT(*) as outstanding_invoices
       FROM invoices
       WHERE status IN ('sent', 'partially_paid', 'overdue')`
    );

    // Active subscriptions
    const subscriptionResult = await query(
      `SELECT
         COUNT(*) as active_subscriptions,
         COUNT(CASE WHEN plan_type = 'daily' THEN 1 END) as daily_plans,
         COUNT(CASE WHEN plan_type = 'weekly' THEN 1 END) as weekly_plans,
         COUNT(CASE WHEN plan_type = 'custom' THEN 1 END) as custom_plans
       FROM subscription_plans
       WHERE status = 'active'`
    );

    return successResponse(
      res,
      {
        revenue: revenueResult.rows[0],
        payments: paymentResult.rows[0],
        outstanding: outstandingResult.rows[0],
        subscriptions: subscriptionResult.rows[0],
      },
      'Financial summary fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get delivery reports
const getDeliveryReports = async (req, res, next) => {
  try {
    const { date_from, date_to, area_id, group_by = 'date' } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (date_from) {
      whereClause += ` AND scheduled_date >= $${paramIndex}`;
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereClause += ` AND scheduled_date <= $${paramIndex}`;
      queryParams.push(date_to);
      paramIndex++;
    }

    if (area_id) {
      whereClause += ` AND area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    let groupByClause = 'scheduled_date';
    let orderByClause = 'scheduled_date DESC';

    if (group_by === 'area') {
      const result = await query(
        `SELECT * FROM vw_daily_delivery_summary
         ${whereClause}
         ORDER BY scheduled_date DESC, area_name`,
        queryParams
      );
      return successResponse(res, result.rows, 'Delivery reports by area fetched successfully');
    } else if (group_by === 'person') {
      const result = await query(
        `SELECT * FROM vw_daily_delivery_summary
         ${whereClause}
         ORDER BY scheduled_date DESC, delivery_person_name`,
        queryParams
      );
      return successResponse(res, result.rows, 'Delivery reports by person fetched successfully');
    } else {
      // Group by date
      const result = await query(
        `SELECT
           d.scheduled_date,
           COUNT(*) as total_deliveries,
           COUNT(CASE WHEN d.delivery_status = 'delivered' THEN 1 END) as completed,
           COUNT(CASE WHEN d.delivery_status = 'missed' THEN 1 END) as missed,
           COUNT(CASE WHEN d.delivery_status = 'cancelled' THEN 1 END) as cancelled,
           SUM(d.scheduled_quantity) as total_quantity_scheduled,
           SUM(d.delivered_quantity) as total_quantity_delivered,
           SUM(d.amount) as total_amount,
           ROUND((COUNT(CASE WHEN d.delivery_status = 'delivered' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2) as completion_rate
         FROM deliveries d
         JOIN customers c ON d.customer_id = c.id
         ${whereClause}
         GROUP BY d.scheduled_date
         ORDER BY d.scheduled_date DESC`,
        queryParams
      );
      return successResponse(res, result.rows, 'Delivery reports by date fetched successfully');
    }
  } catch (error) {
    next(error);
  }
};

// Get customer analytics
const getCustomerAnalytics = async (req, res, next) => {
  try {
    const { area_id } = req.query;

    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;

    if (area_id) {
      whereClause = ` WHERE c.area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    // Customer stats
    const customerStats = await query(
      `SELECT
         COUNT(*) as total_customers,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
         COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_customers,
         COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_customers
       FROM customers c
       ${whereClause}`,
      queryParams
    );

    // Customer growth (by month)
    const growthResult = await query(
      `SELECT
         TO_CHAR(joining_date, 'YYYY-MM') as month,
         COUNT(*) as new_customers
       FROM customers c
       ${whereClause}
       GROUP BY TO_CHAR(joining_date, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
      queryParams
    );

    // Top customers by revenue
    const topCustomersResult = await query(
      `SELECT
         c.id,
         c.customer_code,
         c.full_name,
         c.phone,
         a.name as area_name,
         COUNT(DISTINCT d.id) as total_deliveries,
         SUM(CASE WHEN d.delivery_status = 'delivered' THEN d.amount ELSE 0 END) as total_revenue,
         COUNT(DISTINCT sp.id) as active_subscriptions
       FROM customers c
       LEFT JOIN areas a ON c.area_id = a.id
       LEFT JOIN deliveries d ON c.id = d.customer_id
       LEFT JOIN subscription_plans sp ON c.id = sp.customer_id AND sp.status = 'active'
       ${whereClause}
       GROUP BY c.id, c.customer_code, c.full_name, c.phone, a.name
       ORDER BY total_revenue DESC
       LIMIT 10`,
      queryParams
    );

    // Product popularity
    const productPopularity = await query(
      `SELECT
         p.product_name,
         p.product_code,
         COUNT(DISTINCT d.id) as total_orders,
         SUM(d.delivered_quantity) as total_quantity_sold,
         SUM(CASE WHEN d.delivery_status = 'delivered' THEN d.amount ELSE 0 END) as total_revenue
       FROM deliveries d
       JOIN product_catalog p ON d.product_id = p.id
       JOIN customers c ON d.customer_id = c.id
       ${whereClause}
       GROUP BY p.product_name, p.product_code
       ORDER BY total_revenue DESC`
,
      queryParams
    );

    return successResponse(
      res,
      {
        customer_stats: customerStats.rows[0],
        growth_trend: growthResult.rows,
        top_customers: topCustomersResult.rows,
        product_popularity: productPopularity.rows,
      },
      'Customer analytics fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get dashboard summary
const getDashboardSummary = async (req, res, next) => {
  try {
    // Today's deliveries
    const todayDeliveries = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as completed,
         COUNT(CASE WHEN delivery_status = 'scheduled' THEN 1 END) as pending,
         COUNT(CASE WHEN delivery_status = 'out_for_delivery' THEN 1 END) as in_progress
       FROM deliveries
       WHERE scheduled_date = CURRENT_DATE`
    );

    // Today's revenue
    const todayRevenue = await query(
      `SELECT
         SUM(amount) as revenue,
         SUM(delivered_quantity) as quantity_delivered
       FROM deliveries
       WHERE scheduled_date = CURRENT_DATE AND delivery_status = 'delivered'`
    );

    // Today's payments
    const todayPayments = await query(
      `SELECT
         COUNT(*) as count,
         SUM(amount) as total
       FROM payments
       WHERE payment_date = CURRENT_DATE AND payment_status = 'completed'`
    );

    // Active customers and subscriptions
    const activeStats = await query(
      `SELECT
         (SELECT COUNT(*) FROM customers WHERE status = 'active') as active_customers,
         (SELECT COUNT(*) FROM subscription_plans WHERE status = 'active') as active_subscriptions,
         (SELECT COUNT(*) FROM areas WHERE is_active = true) as active_areas`
    );

    // Pending collections
    const pendingCollections = await query(
      `SELECT SUM(balance_amount) as total
       FROM invoices
       WHERE status IN ('sent', 'partially_paid', 'overdue')`
    );

    // Overdue invoices
    const overdueInvoices = await query(
      `SELECT COUNT(*) as count, SUM(balance_amount) as total
       FROM invoices
       WHERE due_date < CURRENT_DATE AND balance_amount > 0`
    );

    return successResponse(
      res,
      {
        today_deliveries: todayDeliveries.rows[0],
        today_revenue: todayRevenue.rows[0],
        today_payments: todayPayments.rows[0],
        active_stats: activeStats.rows[0],
        pending_collections: pendingCollections.rows[0],
        overdue_invoices: overdueInvoices.rows[0],
      },
      'Dashboard summary fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAgingReport,
  getFinancialSummary,
  getDeliveryReports,
  getCustomerAnalytics,
  getDashboardSummary,
};

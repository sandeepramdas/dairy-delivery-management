const { query, transaction } = require('../config/database');

/**
 * Automatically generate deliveries for a specific date based on active subscriptions
 * This should be run daily (via cron or manual trigger) to create next day's deliveries
 */
const generateDeliveriesForDate = async (targetDate) => {
  console.log(`🚀 Generating deliveries for ${targetDate}...`);

  try {
    const result = await transaction(async (client) => {
      // Calculate day of week (0 = Sunday, 6 = Saturday)
      const date = new Date(targetDate);
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();

      console.log(`📅 Target date: ${targetDate}, Day of week: ${dayOfWeek}, Day of month: ${dayOfMonth}`);

      // Get all active subscriptions that should deliver on this date
      // Explicitly exclude cancelled, paused, and expired subscriptions
      const subscriptionsResult = await client.query(
        `SELECT
          sp.id as subscription_id,
          sp.customer_id,
          sp.product_id,
          sp.plan_name,
          sp.status as subscription_status,
          ss.quantity,
          c.full_name as customer_name,
          p.product_name,
          p.price_per_unit
         FROM subscription_plans sp
         JOIN subscription_schedule ss ON sp.id = ss.subscription_plan_id
         JOIN customers c ON sp.customer_id = c.id
         JOIN product_catalog p ON sp.product_id = p.id
         WHERE sp.status = 'active'
           AND sp.status NOT IN ('cancelled', 'paused', 'expired')
           AND c.status = 'active'
           AND p.is_active = true
           AND ss.is_active = true
           AND sp.start_date <= $1
           AND (sp.end_date IS NULL OR sp.end_date >= $1)
           AND ss.effective_from <= $1
           AND (ss.effective_to IS NULL OR ss.effective_to >= $1)
           AND (
             (ss.day_of_week IS NOT NULL AND ss.day_of_week = $2)
             OR
             (ss.day_of_month IS NOT NULL AND ss.day_of_month = $3)
           )`,
        [targetDate, dayOfWeek, dayOfMonth]
      );

      const subscriptions = subscriptionsResult.rows;
      console.log(`📦 Found ${subscriptions.length} subscriptions for delivery`);

      if (subscriptions.length === 0) {
        return { count: 0, deliveries: [] };
      }

      const deliveriesCreated = [];

      for (const sub of subscriptions) {
        // Check if delivery already exists for this subscription and date
        const existingDelivery = await client.query(
          `SELECT id FROM deliveries
           WHERE customer_id = $1
             AND product_id = $2
             AND scheduled_date = $3
             AND subscription_plan_id = $4`,
          [sub.customer_id, sub.product_id, targetDate, sub.subscription_id]
        );

        if (existingDelivery.rows.length > 0) {
          console.log(`⏭️  Skipping: Delivery already exists for ${sub.customer_name} - ${sub.product_name}`);
          continue;
        }

        // Calculate amount
        const price = parseFloat(sub.price_per_unit);
        const quantity = parseFloat(sub.quantity);
        const amount = price * quantity;

        // Create delivery
        const deliveryResult = await client.query(
          `INSERT INTO deliveries
           (customer_id, product_id, subscription_plan_id, scheduled_date, scheduled_quantity, amount, delivery_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
           RETURNING *`,
          [sub.customer_id, sub.product_id, sub.subscription_id, targetDate, quantity, amount]
        );

        const delivery = deliveryResult.rows[0];
        console.log(`✅ Created delivery: ${sub.customer_name} - ${quantity} ${sub.product_name}`);
        deliveriesCreated.push(delivery);
      }

      return { count: deliveriesCreated.length, deliveries: deliveriesCreated };
    });

    console.log(`🎉 Successfully generated ${result.count} deliveries for ${targetDate}`);
    return result;
  } catch (error) {
    console.error('❌ Error generating deliveries:', error);
    throw error;
  }
};

/**
 * Generate deliveries for tomorrow (to be run daily at night)
 */
const generateTomorrowDeliveries = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return await generateDeliveriesForDate(tomorrowStr);
};

/**
 * Generate deliveries for today (manual trigger if needed)
 */
const generateTodayDeliveries = async () => {
  const today = new Date().toISOString().split('T')[0];
  return await generateDeliveriesForDate(today);
};

/**
 * Generate deliveries for a date range (for initial setup or backfill)
 */
const generateDeliveriesForDateRange = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const allDeliveries = [];
  let totalCount = 0;

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const result = await generateDeliveriesForDate(dateStr);
    totalCount += result.count;
    allDeliveries.push(...result.deliveries);
  }

  return { count: totalCount, deliveries: allDeliveries };
};

module.exports = {
  generateDeliveriesForDate,
  generateTomorrowDeliveries,
  generateTodayDeliveries,
  generateDeliveriesForDateRange,
};

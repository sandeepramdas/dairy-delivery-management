const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create subscription plan with schedule
const createSubscription = async (req, res, next) => {
  try {
    const {
      customer_id,
      product_id,
      plan_name,
      plan_type,
      start_date,
      end_date,
      schedule, // Array of schedule items
    } = req.body;

    const result = await transaction(async (client) => {
      // Create subscription plan
      const planResult = await client.query(
        `INSERT INTO subscription_plans (customer_id, product_id, plan_name, plan_type, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [customer_id, product_id, plan_name, plan_type, start_date, end_date]
      );

      const subscription = planResult.rows[0];

      // Create schedule entries
      const schedulePromises = schedule.map((item) => {
        return client.query(
          `INSERT INTO subscription_schedule
           (subscription_plan_id, day_of_week, day_of_month, quantity, effective_from, effective_to)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            subscription.id,
            item.day_of_week || null,
            item.day_of_month || null,
            item.quantity,
            item.effective_from || start_date,
            item.effective_to || null,
          ]
        );
      });

      const scheduleResults = await Promise.all(schedulePromises);
      const scheduleItems = scheduleResults.map((r) => r.rows[0]);

      return { subscription, schedule: scheduleItems };
    });

    return successResponse(res, result, 'Subscription created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all subscriptions
const getAllSubscriptions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      customer_id,
      status,
      plan_type,
      search,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (customer_id) {
      whereClause += ` AND sp.customer_id = $${paramIndex}`;
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND sp.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (plan_type) {
      whereClause += ` AND sp.plan_type = $${paramIndex}`;
      queryParams.push(plan_type);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (c.full_name ILIKE $${paramIndex} OR c.customer_code ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM subscription_plans sp
       JOIN customers c ON sp.customer_id = c.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get subscriptions
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT sp.*,
              c.customer_code, c.full_name as customer_name,
              p.product_name, p.product_code, p.unit, p.price_per_unit
       FROM subscription_plans sp
       JOIN customers c ON sp.customer_id = c.id
       JOIN product_catalog p ON sp.product_id = p.id
       ${whereClause}
       ORDER BY sp.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    // Get schedule for each subscription
    const subscriptionsWithSchedule = await Promise.all(
      result.rows.map(async (sub) => {
        const scheduleResult = await query(
          `SELECT * FROM subscription_schedule
           WHERE subscription_plan_id = $1 AND is_active = true
           ORDER BY day_of_week`,
          [sub.id]
        );
        return { ...sub, schedule: scheduleResult.rows };
      })
    );

    return paginatedResponse(
      res,
      subscriptionsWithSchedule,
      { page: parseInt(page), limit: parseInt(limit), total },
      'Subscriptions fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get subscription by ID with schedule
const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const planResult = await query(
      `SELECT sp.*,
              c.customer_code, c.full_name as customer_name, c.phone as customer_phone,
              p.product_name, p.product_code, p.unit, p.price_per_unit
       FROM subscription_plans sp
       JOIN customers c ON sp.customer_id = c.id
       JOIN product_catalog p ON sp.product_id = p.id
       WHERE sp.id = $1`,
      [id]
    );

    if (planResult.rows.length === 0) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    const scheduleResult = await query(
      `SELECT * FROM subscription_schedule
       WHERE subscription_plan_id = $1 AND is_active = true
       ORDER BY
         CASE
           WHEN day_of_week IS NOT NULL THEN day_of_week
           ELSE day_of_month
         END`,
      [id]
    );

    const subscription = {
      ...planResult.rows[0],
      schedule: scheduleResult.rows,
    };

    return successResponse(res, subscription, 'Subscription fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update subscription plan
const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan_name, status, end_date } = req.body;

    const result = await query(
      `UPDATE subscription_plans SET
        plan_name = COALESCE($1, plan_name),
        status = COALESCE($2, status),
        end_date = COALESCE($3, end_date)
       WHERE id = $4
       RETURNING *`,
      [plan_name, status, end_date, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    return successResponse(res, result.rows[0], 'Subscription updated successfully');
  } catch (error) {
    next(error);
  }
};

// Update subscription schedule
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;

    const result = await transaction(async (client) => {
      // Deactivate existing schedule
      await client.query(
        'UPDATE subscription_schedule SET is_active = false WHERE subscription_plan_id = $1',
        [id]
      );

      // Create new schedule entries
      const schedulePromises = schedule.map((item) => {
        return client.query(
          `INSERT INTO subscription_schedule
           (subscription_plan_id, day_of_week, day_of_month, quantity, effective_from, effective_to)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            id,
            item.day_of_week || null,
            item.day_of_month || null,
            item.quantity,
            item.effective_from || new Date(),
            item.effective_to || null,
          ]
        );
      });

      const scheduleResults = await Promise.all(schedulePromises);
      return scheduleResults.map((r) => r.rows[0]);
    });

    return successResponse(res, result, 'Schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

// Pause subscription
const pauseSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE subscription_plans SET status = 'paused' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    return successResponse(res, result.rows[0], 'Subscription paused successfully');
  } catch (error) {
    next(error);
  }
};

// Resume subscription
const resumeSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE subscription_plans SET status = 'active' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    return successResponse(res, result.rows[0], 'Subscription resumed successfully');
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE subscription_plans SET status = 'cancelled', end_date = CURRENT_DATE WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    return successResponse(res, result.rows[0], 'Subscription cancelled successfully');
  } catch (error) {
    next(error);
  }
};

// Delete subscription
const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM subscription_plans WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    return successResponse(res, null, 'Subscription deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  updateSchedule,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  deleteSubscription,
};

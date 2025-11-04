const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create delivery (manual)
const createDelivery = async (req, res, next) => {
  try {
    const {
      customer_id,
      product_id,
      subscription_plan_id,
      scheduled_date,
      scheduled_quantity,
      delivery_notes,
    } = req.body;

    // Get product price
    const productResult = await query('SELECT price_per_unit FROM product_catalog WHERE id = $1', [product_id]);
    const price = parseFloat(productResult.rows[0].price_per_unit);
    const amount = price * parseFloat(scheduled_quantity);

    const result = await query(
      `INSERT INTO deliveries
       (customer_id, product_id, subscription_plan_id, scheduled_date, scheduled_quantity, amount, delivery_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customer_id, product_id, subscription_plan_id, scheduled_date, scheduled_quantity, amount, delivery_notes]
    );

    return successResponse(res, result.rows[0], 'Delivery created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all deliveries with filters
const getAllDeliveries = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      customer_id,
      area_id,
      delivery_status,
      date_from,
      date_to,
      delivered_by,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (customer_id) {
      whereClause += ` AND d.customer_id = $${paramIndex}`;
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (area_id) {
      whereClause += ` AND c.area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    if (delivery_status) {
      whereClause += ` AND d.delivery_status = $${paramIndex}`;
      queryParams.push(delivery_status);
      paramIndex++;
    }

    if (date_from) {
      whereClause += ` AND d.scheduled_date >= $${paramIndex}`;
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereClause += ` AND d.scheduled_date <= $${paramIndex}`;
      queryParams.push(date_to);
      paramIndex++;
    }

    if (delivered_by) {
      whereClause += ` AND d.delivered_by = $${paramIndex}`;
      queryParams.push(delivered_by);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM deliveries d
       JOIN customers c ON d.customer_id = c.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get deliveries
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT d.*,
              c.customer_code, c.full_name as customer_name, c.phone as customer_phone,
              c.address_line1, c.city, c.latitude, c.longitude,
              a.name as area_name, a.code as area_code,
              p.product_name, p.product_code, p.unit,
              u.full_name as delivered_by_name
       FROM deliveries d
       JOIN customers c ON d.customer_id = c.id
       JOIN areas a ON c.area_id = a.id
       JOIN product_catalog p ON d.product_id = p.id
       LEFT JOIN users u ON d.delivered_by = u.id
       ${whereClause}
       ORDER BY d.scheduled_date DESC, d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return paginatedResponse(
      res,
      result.rows,
      { page: parseInt(page), limit: parseInt(limit), total },
      'Deliveries fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get delivery by ID
const getDeliveryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT d.*,
              c.customer_code, c.full_name as customer_name, c.phone as customer_phone,
              c.address_line1, c.address_line2, c.city, c.pincode,
              c.latitude, c.longitude, c.location_notes,
              a.name as area_name, a.code as area_code,
              p.product_name, p.product_code, p.unit, p.price_per_unit,
              u.full_name as delivered_by_name
       FROM deliveries d
       JOIN customers c ON d.customer_id = c.id
       JOIN areas a ON c.area_id = a.id
       JOIN product_catalog p ON d.product_id = p.id
       LEFT JOIN users u ON d.delivered_by = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    return successResponse(res, result.rows[0], 'Delivery fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update delivery
const updateDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      scheduled_quantity,
      delivered_quantity,
      delivery_status,
      delivery_notes,
      customer_feedback,
    } = req.body;

    const result = await query(
      `UPDATE deliveries SET
        scheduled_quantity = COALESCE($1, scheduled_quantity),
        delivered_quantity = COALESCE($2, delivered_quantity),
        delivery_status = COALESCE($3, delivery_status),
        delivery_notes = COALESCE($4, delivery_notes),
        customer_feedback = COALESCE($5, customer_feedback)
       WHERE id = $6
       RETURNING *`,
      [scheduled_quantity, delivered_quantity, delivery_status, delivery_notes, customer_feedback, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    return successResponse(res, result.rows[0], 'Delivery updated successfully');
  } catch (error) {
    next(error);
  }
};

// Mark delivery as completed
const completeDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { delivered_quantity, delivery_notes } = req.body;

    const result = await query(
      `UPDATE deliveries SET
        delivery_status = 'delivered',
        delivered_quantity = $1,
        delivery_notes = COALESCE($2, delivery_notes),
        delivered_by = $3,
        delivered_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [delivered_quantity, delivery_notes, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    return successResponse(res, result.rows[0], 'Delivery marked as completed');
  } catch (error) {
    next(error);
  }
};

// Mark delivery as missed
const markMissed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { delivery_notes } = req.body;

    const result = await query(
      `UPDATE deliveries SET
        delivery_status = 'missed',
        delivery_notes = COALESCE($1, delivery_notes),
        delivered_by = $2
       WHERE id = $3
       RETURNING *`,
      [delivery_notes, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    return successResponse(res, result.rows[0], 'Delivery marked as missed');
  } catch (error) {
    next(error);
  }
};

// Get today's deliveries
const getTodayDeliveries = async (req, res, next) => {
  try {
    const { area_id, delivery_status } = req.query;

    let whereClause = 'WHERE d.scheduled_date = CURRENT_DATE';
    const queryParams = [];
    let paramIndex = 1;

    if (area_id) {
      whereClause += ` AND c.area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    if (delivery_status) {
      whereClause += ` AND d.delivery_status = $${paramIndex}`;
      queryParams.push(delivery_status);
      paramIndex++;
    }

    const result = await query(
      `SELECT d.*,
              c.customer_code, c.full_name as customer_name, c.phone as customer_phone,
              c.address_line1, c.city, c.latitude, c.longitude, c.location_notes,
              a.name as area_name, a.code as area_code,
              p.product_name, p.product_code, p.unit
       FROM deliveries d
       JOIN customers c ON d.customer_id = c.id
       JOIN areas a ON c.area_id = a.id
       JOIN product_catalog p ON d.product_id = p.id
       ${whereClause}
       ORDER BY a.name, c.full_name`,
      queryParams
    );

    return successResponse(res, result.rows, "Today's deliveries fetched successfully");
  } catch (error) {
    next(error);
  }
};

// Get calendar view data (monthly summary)
const getCalendarView = async (req, res, next) => {
  try {
    const { year, month, area_id } = req.query;

    if (!year || !month) {
      return errorResponse(res, 'Year and month are required', 400);
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    let whereClause = 'WHERE d.scheduled_date >= $1 AND d.scheduled_date <= $2';
    const queryParams = [startDate, endDate];
    let paramIndex = 3;

    if (area_id) {
      whereClause += ` AND c.area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    const result = await query(
      `SELECT
         d.scheduled_date,
         COUNT(*) as total_deliveries,
         COUNT(CASE WHEN d.delivery_status = 'delivered' THEN 1 END) as completed,
         COUNT(CASE WHEN d.delivery_status = 'scheduled' THEN 1 END) as scheduled,
         COUNT(CASE WHEN d.delivery_status = 'missed' THEN 1 END) as missed,
         COUNT(CASE WHEN d.delivery_status = 'cancelled' THEN 1 END) as cancelled,
         COUNT(CASE WHEN d.delivery_status = 'out_for_delivery' THEN 1 END) as out_for_delivery,
         SUM(d.scheduled_quantity) as total_quantity,
         SUM(d.amount) as total_amount
       FROM deliveries d
       JOIN customers c ON d.customer_id = c.id
       ${whereClause}
       GROUP BY d.scheduled_date
       ORDER BY d.scheduled_date`,
      queryParams
    );

    return successResponse(res, result.rows, 'Calendar data fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Get deliveries for a specific date
const getDeliveriesByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { area_id } = req.query;

    let whereClause = 'WHERE d.scheduled_date = $1';
    const queryParams = [date];
    let paramIndex = 2;

    if (area_id) {
      whereClause += ` AND c.area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    const result = await query(
      `SELECT d.*,
              c.customer_code, c.full_name as customer_name, c.phone as customer_phone,
              c.address_line1, c.city, c.latitude, c.longitude,
              a.name as area_name, a.code as area_code,
              p.product_name, p.product_code, p.unit,
              u.full_name as delivered_by_name
       FROM deliveries d
       JOIN customers c ON d.customer_id = c.id
       JOIN areas a ON c.area_id = a.id
       JOIN product_catalog p ON d.product_id = p.id
       LEFT JOIN users u ON d.delivered_by = u.id
       ${whereClause}
       ORDER BY a.name, c.full_name`,
      queryParams
    );

    return successResponse(res, result.rows, 'Deliveries for date fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Report delivery exception
const reportException = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { exception_type, exception_notes } = req.body;

    const result = await query(
      `INSERT INTO delivery_exceptions (delivery_id, exception_type, exception_notes, reported_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, exception_type, exception_notes, req.user.id]
    );

    return successResponse(res, result.rows[0], 'Exception reported successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get delivery exceptions
const getExceptions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT de.*, u.full_name as reported_by_name
       FROM delivery_exceptions de
       JOIN users u ON de.reported_by = u.id
       WHERE de.delivery_id = $1
       ORDER BY de.reported_at DESC`,
      [id]
    );

    return successResponse(res, result.rows, 'Exceptions fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Delete delivery
const deleteDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM deliveries WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    return successResponse(res, null, 'Delivery deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  completeDelivery,
  markMissed,
  getTodayDeliveries,
  getCalendarView,
  getDeliveriesByDate,
  reportException,
  getExceptions,
  deleteDelivery,
};

const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create new customer
const createCustomer = async (req, res, next) => {
  try {
    const {
      full_name,
      phone,
      email,
      area_id,
      address_line1,
      address_line2,
      city,
      pincode,
      latitude,
      longitude,
      location_notes,
      alternate_phone,
    } = req.body;

    const result = await query(
      `INSERT INTO customers (
        full_name, phone, email, area_id, address_line1, address_line2,
        city, pincode, latitude, longitude, location_notes, alternate_phone, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        full_name, phone, email, area_id, address_line1, address_line2,
        city, pincode, latitude, longitude, location_notes, alternate_phone, req.user.id
      ]
    );

    return successResponse(res, result.rows[0], 'Customer created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all customers with pagination and filters
const getAllCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      area_id,
      status = 'active',
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (area_id) {
      whereClause += ` AND c.area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (c.full_name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR c.customer_code ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM customers c ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].count);

    // Get customers
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT c.*, a.name as area_name, a.code as area_code
       FROM customers c
       LEFT JOIN areas a ON c.area_id = a.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return paginatedResponse(
      res,
      result.rows,
      { page: parseInt(page), limit: parseInt(limit), total },
      'Customers fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get customer by ID
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.*, a.name as area_name, a.code as area_code,
              u.full_name as created_by_name
       FROM customers c
       LEFT JOIN areas a ON c.area_id = a.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Customer not found', 404);
    }

    return successResponse(res, result.rows[0], 'Customer fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update customer
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      email,
      area_id,
      address_line1,
      address_line2,
      city,
      pincode,
      latitude,
      longitude,
      location_notes,
      status,
      alternate_phone,
    } = req.body;

    const result = await query(
      `UPDATE customers SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        area_id = COALESCE($4, area_id),
        address_line1 = COALESCE($5, address_line1),
        address_line2 = COALESCE($6, address_line2),
        city = COALESCE($7, city),
        pincode = COALESCE($8, pincode),
        latitude = COALESCE($9, latitude),
        longitude = COALESCE($10, longitude),
        location_notes = COALESCE($11, location_notes),
        status = COALESCE($12, status),
        alternate_phone = COALESCE($13, alternate_phone)
      WHERE id = $14
      RETURNING *`,
      [
        full_name, phone, email, area_id, address_line1, address_line2,
        city, pincode, latitude, longitude, location_notes, status, alternate_phone, id
      ]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Customer not found', 404);
    }

    return successResponse(res, result.rows[0], 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete customer
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Customer not found', 404);
    }

    return successResponse(res, null, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get customer's subscriptions
const getCustomerSubscriptions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT sp.*, p.product_name, p.product_code, p.unit, p.price_per_unit
       FROM subscription_plans sp
       JOIN product_catalog p ON sp.product_id = p.id
       WHERE sp.customer_id = $1
       ORDER BY sp.created_at DESC`,
      [id]
    );

    return successResponse(res, result.rows, 'Customer subscriptions fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Get customer's payment history
const getCustomerPayments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, u.full_name as received_by_name
       FROM payments p
       LEFT JOIN users u ON p.received_by = u.id
       WHERE p.customer_id = $1
       ORDER BY p.payment_date DESC`,
      [id]
    );

    return successResponse(res, result.rows, 'Customer payments fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Get customer's invoices
const getCustomerInvoices = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM invoices
       WHERE customer_id = $1
       ORDER BY invoice_date DESC`,
      [id]
    );

    return successResponse(res, result.rows, 'Customer invoices fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Get customer's outstanding balance
const getCustomerOutstanding = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM vw_customer_outstanding
       WHERE customer_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return successResponse(res, {
        customer_id: id,
        total_outstanding: 0,
        current_amount: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_90_plus: 0,
      }, 'No outstanding balance');
    }

    return successResponse(res, result.rows[0], 'Customer outstanding fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerSubscriptions,
  getCustomerPayments,
  getCustomerInvoices,
  getCustomerOutstanding,
};

const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Record payment
const createPayment = async (req, res, next) => {
  try {
    const {
      customer_id,
      amount,
      payment_date,
      payment_method,
      transaction_reference,
      notes,
      invoice_allocations, // Array of { invoice_id, amount }
    } = req.body;

    const result = await transaction(async (client) => {
      // Create payment
      const paymentResult = await client.query(
        `INSERT INTO payments (customer_id, amount, payment_date, payment_method, transaction_reference, notes, received_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [customer_id, amount, payment_date || new Date(), payment_method, transaction_reference, notes, req.user.id]
      );

      const payment = paymentResult.rows[0];

      // Allocate payment to invoices
      if (invoice_allocations && invoice_allocations.length > 0) {
        for (const allocation of invoice_allocations) {
          // Create allocation
          await client.query(
            `INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount)
             VALUES ($1, $2, $3)`,
            [payment.id, allocation.invoice_id, allocation.amount]
          );

          // Update invoice paid amount
          await client.query(
            `UPDATE invoices
             SET paid_amount = paid_amount + $1
             WHERE id = $2`,
            [allocation.amount, allocation.invoice_id]
          );
        }
      } else {
        // Auto-allocate to oldest unpaid invoices
        const invoicesResult = await client.query(
          `SELECT id, balance_amount FROM invoices
           WHERE customer_id = $1 AND balance_amount > 0
           ORDER BY due_date ASC`,
          [customer_id]
        );

        let remainingAmount = parseFloat(amount);

        for (const invoice of invoicesResult.rows) {
          if (remainingAmount <= 0) break;

          const allocateAmount = Math.min(remainingAmount, parseFloat(invoice.balance_amount));

          await client.query(
            `INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount)
             VALUES ($1, $2, $3)`,
            [payment.id, invoice.id, allocateAmount]
          );

          await client.query(
            `UPDATE invoices
             SET paid_amount = paid_amount + $1
             WHERE id = $2`,
            [allocateAmount, invoice.id]
          );

          remainingAmount -= allocateAmount;
        }
      }

      return payment;
    });

    return successResponse(res, result, 'Payment recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all payments
const getAllPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      customer_id,
      payment_method,
      payment_status,
      date_from,
      date_to,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (customer_id) {
      whereClause += ` AND p.customer_id = $${paramIndex}`;
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (payment_method) {
      whereClause += ` AND p.payment_method = $${paramIndex}`;
      queryParams.push(payment_method);
      paramIndex++;
    }

    if (payment_status) {
      whereClause += ` AND p.payment_status = $${paramIndex}`;
      queryParams.push(payment_status);
      paramIndex++;
    }

    if (date_from) {
      whereClause += ` AND p.payment_date >= $${paramIndex}`;
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereClause += ` AND p.payment_date <= $${paramIndex}`;
      queryParams.push(date_to);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM payments p ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get payments
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT p.*,
              c.customer_code, c.full_name as customer_name,
              u.full_name as received_by_name
       FROM payments p
       JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON p.received_by = u.id
       ${whereClause}
       ORDER BY p.payment_date DESC, p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return paginatedResponse(
      res,
      result.rows,
      { page: parseInt(page), limit: parseInt(limit), total },
      'Payments fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const paymentResult = await query(
      `SELECT p.*,
              c.customer_code, c.full_name as customer_name, c.phone as customer_phone,
              u.full_name as received_by_name
       FROM payments p
       JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON p.received_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (paymentResult.rows.length === 0) {
      return errorResponse(res, 'Payment not found', 404);
    }

    // Get allocations
    const allocationsResult = await query(
      `SELECT pa.*, i.invoice_number, i.total_amount as invoice_total
       FROM payment_allocations pa
       JOIN invoices i ON pa.invoice_id = i.id
       WHERE pa.payment_id = $1`,
      [id]
    );

    const payment = {
      ...paymentResult.rows[0],
      allocations: allocationsResult.rows,
    };

    return successResponse(res, payment, 'Payment fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update payment
const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_status, transaction_reference, notes } = req.body;

    const result = await query(
      `UPDATE payments SET
        payment_status = COALESCE($1, payment_status),
        transaction_reference = COALESCE($2, transaction_reference),
        notes = COALESCE($3, notes)
       WHERE id = $4
       RETURNING *`,
      [payment_status, transaction_reference, notes, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Payment not found', 404);
    }

    return successResponse(res, result.rows[0], 'Payment updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete payment
const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    await transaction(async (client) => {
      // Get allocations
      const allocationsResult = await client.query(
        'SELECT * FROM payment_allocations WHERE payment_id = $1',
        [id]
      );

      // Reverse invoice payments
      for (const allocation of allocationsResult.rows) {
        await client.query(
          `UPDATE invoices
           SET paid_amount = paid_amount - $1
           WHERE id = $2`,
          [allocation.allocated_amount, allocation.invoice_id]
        );
      }

      // Delete payment (allocations will be deleted via CASCADE)
      const result = await client.query('DELETE FROM payments WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }
    });

    return successResponse(res, null, 'Payment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get pending collections
const getPendingCollections = async (req, res, next) => {
  try {
    const { area_id } = req.query;

    let whereClause = 'WHERE i.balance_amount > 0';
    const queryParams = [];
    let paramIndex = 1;

    if (area_id) {
      whereClause += ` AND c.area_id = $${paramIndex}`;
      queryParams.push(area_id);
      paramIndex++;
    }

    const result = await query(
      `SELECT
         c.id as customer_id,
         c.customer_code,
         c.full_name as customer_name,
         c.phone,
         a.name as area_name,
         SUM(i.balance_amount) as total_pending,
         COUNT(i.id) as pending_invoices,
         MIN(i.due_date) as oldest_due_date
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       JOIN areas a ON c.area_id = a.id
       ${whereClause}
       GROUP BY c.id, c.customer_code, c.full_name, c.phone, a.name
       ORDER BY total_pending DESC`,
      queryParams
    );

    return successResponse(res, result.rows, 'Pending collections fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPendingCollections,
};

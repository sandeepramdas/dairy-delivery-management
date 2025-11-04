const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create invoice
const createInvoice = async (req, res, next) => {
  try {
    const {
      customer_id,
      billing_period_start,
      billing_period_end,
      line_items, // Array of { product_id, description, quantity, unit_price }
      tax_amount = 0,
      discount_amount = 0,
      due_date,
    } = req.body;

    const result = await transaction(async (client) => {
      // Calculate subtotal
      const subtotal = line_items.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
      }, 0);

      const total_amount = subtotal + parseFloat(tax_amount) - parseFloat(discount_amount);

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices
         (customer_id, billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount, total_amount, balance_amount, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [customer_id, billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount, total_amount, total_amount, due_date]
      );

      const invoice = invoiceResult.rows[0];

      // Create line items
      for (const item of line_items) {
        const line_total = parseFloat(item.quantity) * parseFloat(item.unit_price);

        await client.query(
          `INSERT INTO invoice_line_items
           (invoice_id, delivery_id, product_id, description, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [invoice.id, item.delivery_id || null, item.product_id, item.description, item.quantity, item.unit_price, line_total]
        );
      }

      return invoice;
    });

    return successResponse(res, result, 'Invoice created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Auto-generate invoice from deliveries
const generateInvoiceFromDeliveries = async (req, res, next) => {
  try {
    const {
      customer_id,
      billing_period_start,
      billing_period_end,
      tax_amount = 0,
      discount_amount = 0,
      due_date,
    } = req.body;

    const result = await transaction(async (client) => {
      // Get all delivered items in the period
      const deliveriesResult = await client.query(
        `SELECT d.*, p.product_name, p.unit
         FROM deliveries d
         JOIN product_catalog p ON d.product_id = p.id
         WHERE d.customer_id = $1
           AND d.scheduled_date >= $2
           AND d.scheduled_date <= $3
           AND d.delivery_status = 'delivered'
           AND d.id NOT IN (SELECT delivery_id FROM invoice_line_items WHERE delivery_id IS NOT NULL)
         ORDER BY d.scheduled_date`,
        [customer_id, billing_period_start, billing_period_end]
      );

      if (deliveriesResult.rows.length === 0) {
        throw new Error('No delivered items found for the specified period');
      }

      // Calculate subtotal
      const subtotal = deliveriesResult.rows.reduce((sum, delivery) => {
        return sum + parseFloat(delivery.amount);
      }, 0);

      const total_amount = subtotal + parseFloat(tax_amount) - parseFloat(discount_amount);

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices
         (customer_id, billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount, total_amount, balance_amount, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [customer_id, billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount, total_amount, total_amount, due_date]
      );

      const invoice = invoiceResult.rows[0];

      // Create line items from deliveries
      for (const delivery of deliveriesResult.rows) {
        const description = `${delivery.product_name} - ${delivery.scheduled_date.toISOString().split('T')[0]}`;
        const unit_price = parseFloat(delivery.amount) / parseFloat(delivery.delivered_quantity);

        await client.query(
          `INSERT INTO invoice_line_items
           (invoice_id, delivery_id, product_id, description, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [invoice.id, delivery.id, delivery.product_id, description, delivery.delivered_quantity, unit_price, delivery.amount]
        );
      }

      return invoice;
    });

    return successResponse(res, result, 'Invoice generated successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all invoices
const getAllInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      customer_id,
      status,
      date_from,
      date_to,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (customer_id) {
      whereClause += ` AND i.customer_id = $${paramIndex}`;
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND i.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (date_from) {
      whereClause += ` AND i.invoice_date >= $${paramIndex}`;
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereClause += ` AND i.invoice_date <= $${paramIndex}`;
      queryParams.push(date_to);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM invoices i ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get invoices
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT i.*,
              c.customer_code, c.full_name as customer_name, c.phone as customer_phone
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       ${whereClause}
       ORDER BY i.invoice_date DESC, i.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return paginatedResponse(
      res,
      result.rows,
      { page: parseInt(page), limit: parseInt(limit), total },
      'Invoices fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get invoice by ID with line items
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoiceResult = await query(
      `SELECT i.*,
              c.customer_code, c.full_name as customer_name,
              c.phone as customer_phone, c.email as customer_email,
              c.address_line1, c.address_line2, c.city, c.pincode
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Get line items
    const lineItemsResult = await query(
      `SELECT ili.*, p.product_name, p.unit
       FROM invoice_line_items ili
       JOIN product_catalog p ON ili.product_id = p.id
       WHERE ili.invoice_id = $1
       ORDER BY ili.created_at`,
      [id]
    );

    // Get payments
    const paymentsResult = await query(
      `SELECT pa.*, p.payment_code, p.payment_date, p.payment_method
       FROM payment_allocations pa
       JOIN payments p ON pa.payment_id = p.id
       WHERE pa.invoice_id = $1
       ORDER BY p.payment_date DESC`,
      [id]
    );

    const invoice = {
      ...invoiceResult.rows[0],
      line_items: lineItemsResult.rows,
      payments: paymentsResult.rows,
    };

    return successResponse(res, invoice, 'Invoice fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update invoice
const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tax_amount, discount_amount, due_date } = req.body;

    const result = await query(
      `UPDATE invoices SET
        status = COALESCE($1, status),
        tax_amount = COALESCE($2, tax_amount),
        discount_amount = COALESCE($3, discount_amount),
        due_date = COALESCE($4, due_date),
        total_amount = subtotal + COALESCE($2, tax_amount) - COALESCE($3, discount_amount)
       WHERE id = $5
       RETURNING *`,
      [status, tax_amount, discount_amount, due_date, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    return successResponse(res, result.rows[0], 'Invoice updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete invoice
const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if invoice has payments
    const paymentCheck = await query(
      'SELECT COUNT(*) FROM payment_allocations WHERE invoice_id = $1',
      [id]
    );

    if (parseInt(paymentCheck.rows[0].count) > 0) {
      return errorResponse(res, 'Cannot delete invoice with existing payments', 400);
    }

    const result = await query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    return successResponse(res, null, 'Invoice deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  generateInvoiceFromDeliveries,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};

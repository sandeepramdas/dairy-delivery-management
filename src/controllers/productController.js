const { query } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create new product
const createProduct = async (req, res, next) => {
  try {
    const { product_name, product_code, unit, price_per_unit, description } = req.body;

    const result = await query(
      `INSERT INTO product_catalog (product_name, product_code, unit, price_per_unit, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_name, product_code, unit, price_per_unit, description]
    );

    return successResponse(res, result.rows[0], 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all products
const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_active, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      queryParams.push(is_active === 'true');
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (product_name ILIKE $${paramIndex} OR product_code ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM product_catalog ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get products
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT * FROM product_catalog
       ${whereClause}
       ORDER BY product_name
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return paginatedResponse(
      res,
      result.rows,
      { page: parseInt(page), limit: parseInt(limit), total },
      'Products fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get product by ID
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM product_catalog WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    return successResponse(res, result.rows[0], 'Product fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update product
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { product_name, product_code, unit, price_per_unit, description, is_active } = req.body;

    const result = await query(
      `UPDATE product_catalog SET
        product_name = COALESCE($1, product_name),
        product_code = COALESCE($2, product_code),
        unit = COALESCE($3, unit),
        price_per_unit = COALESCE($4, price_per_unit),
        description = COALESCE($5, description),
        is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [product_name, product_code, unit, price_per_unit, description, is_active, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    return successResponse(res, result.rows[0], 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product is used in any subscriptions
    const subscriptionCheck = await query(
      'SELECT COUNT(*) FROM subscription_plans WHERE product_id = $1',
      [id]
    );

    if (parseInt(subscriptionCheck.rows[0].count) > 0) {
      return errorResponse(
        res,
        'Cannot delete product with existing subscriptions. Please deactivate instead.',
        400
      );
    }

    const result = await query('DELETE FROM product_catalog WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    return successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};

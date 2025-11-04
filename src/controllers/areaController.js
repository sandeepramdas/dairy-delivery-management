const { query } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create new area
const createArea = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    const result = await query(
      `INSERT INTO areas (name, code, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, code, description]
    );

    return successResponse(res, result.rows[0], 'Area created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all areas
const getAllAreas = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_active } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      queryParams.push(is_active === 'true');
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM areas ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get areas with customer count
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT a.*,
              COUNT(DISTINCT c.id) as customer_count,
              COUNT(DISTINCT dpa.user_id) as assigned_personnel_count
       FROM areas a
       LEFT JOIN customers c ON a.id = c.area_id AND c.status = 'active'
       LEFT JOIN delivery_personnel_assignments dpa ON a.id = dpa.area_id AND dpa.is_active = true
       ${whereClause}
       GROUP BY a.id
       ORDER BY a.name
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return paginatedResponse(
      res,
      result.rows,
      { page: parseInt(page), limit: parseInt(limit), total },
      'Areas fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get area by ID
const getAreaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.*,
              COUNT(DISTINCT c.id) as customer_count,
              COUNT(DISTINCT dpa.user_id) as assigned_personnel_count
       FROM areas a
       LEFT JOIN customers c ON a.id = c.area_id AND c.status = 'active'
       LEFT JOIN delivery_personnel_assignments dpa ON a.id = dpa.area_id AND dpa.is_active = true
       WHERE a.id = $1
       GROUP BY a.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Area not found', 404);
    }

    return successResponse(res, result.rows[0], 'Area fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update area
const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, is_active } = req.body;

    const result = await query(
      `UPDATE areas SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description),
        is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [name, code, description, is_active, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Area not found', 404);
    }

    return successResponse(res, result.rows[0], 'Area updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete area
const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if area has customers
    const customerCheck = await query(
      'SELECT COUNT(*) FROM customers WHERE area_id = $1',
      [id]
    );

    if (parseInt(customerCheck.rows[0].count) > 0) {
      return errorResponse(
        res,
        'Cannot delete area with existing customers. Please reassign customers first.',
        400
      );
    }

    const result = await query('DELETE FROM areas WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Area not found', 404);
    }

    return successResponse(res, null, 'Area deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get area customers
const getAreaCustomers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT * FROM customers
       WHERE area_id = $1 AND status = 'active'
       ORDER BY full_name
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM customers WHERE area_id = $1 AND status = $2',
      [id, 'active']
    );

    return paginatedResponse(
      res,
      result.rows,
      { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count) },
      'Area customers fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get assigned delivery personnel for an area
const getAreaPersonnel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT dpa.*, u.full_name, u.email, u.phone
       FROM delivery_personnel_assignments dpa
       JOIN users u ON dpa.user_id = u.id
       WHERE dpa.area_id = $1 AND dpa.is_active = true
       ORDER BY dpa.assigned_date DESC`,
      [id]
    );

    return successResponse(res, result.rows, 'Area personnel fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Assign delivery personnel to area
const assignPersonnel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, assigned_date } = req.body;

    const result = await query(
      `INSERT INTO delivery_personnel_assignments (user_id, area_id, assigned_date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, id, assigned_date || new Date()]
    );

    return successResponse(res, result.rows[0], 'Personnel assigned successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Remove personnel assignment
const removePersonnel = async (req, res, next) => {
  try {
    const { id, assignment_id } = req.params;

    const result = await query(
      'UPDATE delivery_personnel_assignments SET is_active = false WHERE id = $1 AND area_id = $2 RETURNING *',
      [assignment_id, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Assignment not found', 404);
    }

    return successResponse(res, result.rows[0], 'Personnel assignment removed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createArea,
  getAllAreas,
  getAreaById,
  updateArea,
  deleteArea,
  getAreaCustomers,
  getAreaPersonnel,
  assignPersonnel,
  removePersonnel,
};

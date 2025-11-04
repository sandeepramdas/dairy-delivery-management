# Milk Delivery Management System - API Documentation

Base URL: `http://localhost:3000/api/v1`

## Table of Contents
1. [Authentication](#authentication)
2. [Customers](#customers)
3. [Areas](#areas)
4. [Products](#products)
5. [Subscriptions](#subscriptions)
6. [Deliveries](#deliveries)
7. [Payments](#payments)
8. [Invoices](#invoices)
9. [Reports](#reports)

---

## Authentication

### Register User
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "9876543210",
  "role": "delivery_person"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {...},
    "token": "jwt_token_here"
  }
}
```

### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer {token}
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer {token}
```

**Body:**
```json
{
  "full_name": "John Updated",
  "phone": "9876543211"
}
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer {token}
```

**Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
```

---

## Customers

### Create Customer
```http
POST /customers
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "full_name": "Rajesh Kumar",
  "phone": "9876543210",
  "email": "rajesh@example.com",
  "area_id": "uuid-here",
  "address_line1": "123 Main Street",
  "address_line2": "Near Park",
  "city": "Mumbai",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "location_notes": "Blue gate, 2nd floor",
  "alternate_phone": "9876543211"
}
```

### Get All Customers
```http
GET /customers?page=1&limit=20&search=Rajesh&area_id=uuid&status=active
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by name, phone, or customer code
- `area_id` (optional): Filter by area
- `status` (optional): active, inactive, suspended

### Get Customer by ID
```http
GET /customers/{id}
Authorization: Bearer {token}
```

### Update Customer
```http
PUT /customers/{id}
Authorization: Bearer {token}
Roles: admin, manager
```

### Delete Customer
```http
DELETE /customers/{id}
Authorization: Bearer {token}
Roles: admin
```

### Get Customer Subscriptions
```http
GET /customers/{id}/subscriptions
Authorization: Bearer {token}
```

### Get Customer Payments
```http
GET /customers/{id}/payments
Authorization: Bearer {token}
```

### Get Customer Invoices
```http
GET /customers/{id}/invoices
Authorization: Bearer {token}
```

### Get Customer Outstanding
```http
GET /customers/{id}/outstanding
Authorization: Bearer {token}
```

---

## Areas

### Create Area
```http
POST /areas
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "name": "Zone A - North",
  "code": "ZN-A",
  "description": "North sector residential area"
}
```

### Get All Areas
```http
GET /areas?page=1&limit=20&is_active=true
Authorization: Bearer {token}
```

### Get Area by ID
```http
GET /areas/{id}
Authorization: Bearer {token}
```

### Update Area
```http
PUT /areas/{id}
Authorization: Bearer {token}
Roles: admin, manager
```

### Delete Area
```http
DELETE /areas/{id}
Authorization: Bearer {token}
Roles: admin
```

### Get Area Customers
```http
GET /areas/{id}/customers
Authorization: Bearer {token}
```

### Get Area Personnel
```http
GET /areas/{id}/personnel
Authorization: Bearer {token}
```

### Assign Personnel to Area
```http
POST /areas/{id}/personnel
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "user_id": "uuid-here",
  "assigned_date": "2025-11-03"
}
```

### Remove Personnel Assignment
```http
DELETE /areas/{id}/personnel/{assignment_id}
Authorization: Bearer {token}
Roles: admin, manager
```

---

## Products

### Create Product
```http
POST /products
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "product_name": "Full Cream Milk",
  "product_code": "MILK-FC",
  "unit": "litres",
  "price_per_unit": 60.00,
  "description": "Fresh full cream milk"
}
```

### Get All Products
```http
GET /products?page=1&limit=20&is_active=true&search=milk
Authorization: Bearer {token}
```

### Get Product by ID
```http
GET /products/{id}
Authorization: Bearer {token}
```

### Update Product
```http
PUT /products/{id}
Authorization: Bearer {token}
Roles: admin, manager
```

### Delete Product
```http
DELETE /products/{id}
Authorization: Bearer {token}
Roles: admin
```

---

## Subscriptions

### Create Subscription
```http
POST /subscriptions
Authorization: Bearer {token}
Roles: admin, manager
```

**Body (Weekly Plan):**
```json
{
  "customer_id": "uuid-here",
  "product_id": "uuid-here",
  "plan_name": "Weekly Subscription",
  "plan_type": "weekly",
  "start_date": "2025-11-03",
  "end_date": null,
  "schedule": [
    { "day_of_week": 1, "quantity": 2.0 },
    { "day_of_week": 2, "quantity": 2.0 },
    { "day_of_week": 3, "quantity": 1.5 },
    { "day_of_week": 4, "quantity": 2.0 },
    { "day_of_week": 5, "quantity": 2.0 },
    { "day_of_week": 6, "quantity": 1.0 }
  ]
}
```

**Body (Daily Plan):**
```json
{
  "customer_id": "uuid-here",
  "product_id": "uuid-here",
  "plan_name": "Daily Subscription",
  "plan_type": "daily",
  "start_date": "2025-11-03",
  "end_date": null,
  "schedule": [
    { "quantity": 2.0, "effective_from": "2025-11-03" }
  ]
}
```

### Get All Subscriptions
```http
GET /subscriptions?page=1&limit=20&customer_id=uuid&status=active&plan_type=weekly
Authorization: Bearer {token}
```

### Get Subscription by ID
```http
GET /subscriptions/{id}
Authorization: Bearer {token}
```

### Update Subscription
```http
PUT /subscriptions/{id}
Authorization: Bearer {token}
Roles: admin, manager
```

### Update Schedule
```http
PUT /subscriptions/{id}/schedule
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "schedule": [
    { "day_of_week": 1, "quantity": 3.0 },
    { "day_of_week": 2, "quantity": 2.5 }
  ]
}
```

### Pause Subscription
```http
POST /subscriptions/{id}/pause
Authorization: Bearer {token}
Roles: admin, manager
```

### Resume Subscription
```http
POST /subscriptions/{id}/resume
Authorization: Bearer {token}
Roles: admin, manager
```

### Cancel Subscription
```http
POST /subscriptions/{id}/cancel
Authorization: Bearer {token}
Roles: admin, manager
```

### Delete Subscription
```http
DELETE /subscriptions/{id}
Authorization: Bearer {token}
Roles: admin
```

---

## Deliveries

### Create Delivery (Manual)
```http
POST /deliveries
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "customer_id": "uuid-here",
  "product_id": "uuid-here",
  "subscription_plan_id": "uuid-here",
  "scheduled_date": "2025-11-03",
  "scheduled_quantity": 2.0,
  "delivery_notes": "Extra bottle requested"
}
```

### Get All Deliveries
```http
GET /deliveries?page=1&limit=20&customer_id=uuid&area_id=uuid&delivery_status=delivered&date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer {token}
```

### Get Today's Deliveries
```http
GET /deliveries/today?area_id=uuid&delivery_status=scheduled
Authorization: Bearer {token}
```

### Get Calendar View
```http
GET /deliveries/calendar?year=2025&month=11&area_id=uuid
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "scheduled_date": "2025-11-03",
      "total_deliveries": 45,
      "completed": 35,
      "scheduled": 10,
      "missed": 0,
      "cancelled": 0,
      "out_for_delivery": 0,
      "total_quantity": 90.5,
      "total_amount": 5430.00
    }
  ]
}
```

### Get Deliveries by Date
```http
GET /deliveries/date/2025-11-03?area_id=uuid
Authorization: Bearer {token}
```

### Get Delivery by ID
```http
GET /deliveries/{id}
Authorization: Bearer {token}
```

### Update Delivery
```http
PUT /deliveries/{id}
Authorization: Bearer {token}
Roles: admin, manager, delivery_person
```

### Complete Delivery
```http
POST /deliveries/{id}/complete
Authorization: Bearer {token}
Roles: admin, manager, delivery_person
```

**Body:**
```json
{
  "delivered_quantity": 2.0,
  "delivery_notes": "Delivered successfully"
}
```

### Mark as Missed
```http
POST /deliveries/{id}/missed
Authorization: Bearer {token}
Roles: admin, manager, delivery_person
```

**Body:**
```json
{
  "delivery_notes": "Customer not available"
}
```

### Report Exception
```http
POST /deliveries/{id}/exceptions
Authorization: Bearer {token}
Roles: admin, manager, delivery_person
```

**Body:**
```json
{
  "exception_type": "customer_unavailable",
  "exception_notes": "Customer on vacation"
}
```

### Get Exceptions
```http
GET /deliveries/{id}/exceptions
Authorization: Bearer {token}
```

### Delete Delivery
```http
DELETE /deliveries/{id}
Authorization: Bearer {token}
Roles: admin
```

---

## Payments

### Record Payment
```http
POST /payments
Authorization: Bearer {token}
Roles: admin, manager, delivery_person
```

**Body (Auto-allocate):**
```json
{
  "customer_id": "uuid-here",
  "amount": 5000.00,
  "payment_date": "2025-11-03",
  "payment_method": "upi",
  "transaction_reference": "TXN123456",
  "notes": "Payment received via UPI"
}
```

**Body (Manual allocation):**
```json
{
  "customer_id": "uuid-here",
  "amount": 3000.00,
  "payment_method": "cash",
  "invoice_allocations": [
    { "invoice_id": "uuid-1", "amount": 2000.00 },
    { "invoice_id": "uuid-2", "amount": 1000.00 }
  ]
}
```

### Get All Payments
```http
GET /payments?page=1&limit=20&customer_id=uuid&payment_method=upi&date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer {token}
```

### Get Pending Collections
```http
GET /payments/pending?area_id=uuid
Authorization: Bearer {token}
```

### Get Payment by ID
```http
GET /payments/{id}
Authorization: Bearer {token}
```

### Update Payment
```http
PUT /payments/{id}
Authorization: Bearer {token}
Roles: admin, manager
```

### Delete Payment
```http
DELETE /payments/{id}
Authorization: Bearer {token}
Roles: admin
```

---

## Invoices

### Create Invoice (Manual)
```http
POST /invoices
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "customer_id": "uuid-here",
  "billing_period_start": "2025-11-01",
  "billing_period_end": "2025-11-30",
  "line_items": [
    {
      "product_id": "uuid-here",
      "description": "Full Cream Milk - November 2025",
      "quantity": 60,
      "unit_price": 60.00
    }
  ],
  "tax_amount": 0,
  "discount_amount": 200,
  "due_date": "2025-12-10"
}
```

### Generate Invoice from Deliveries
```http
POST /invoices/generate
Authorization: Bearer {token}
Roles: admin, manager
```

**Body:**
```json
{
  "customer_id": "uuid-here",
  "billing_period_start": "2025-11-01",
  "billing_period_end": "2025-11-30",
  "tax_amount": 0,
  "discount_amount": 0,
  "due_date": "2025-12-10"
}
```

### Get All Invoices
```http
GET /invoices?page=1&limit=20&customer_id=uuid&status=overdue&date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer {token}
```

### Get Invoice by ID
```http
GET /invoices/{id}
Authorization: Bearer {token}
```

### Update Invoice
```http
PUT /invoices/{id}
Authorization: Bearer {token}
Roles: admin, manager
```

### Delete Invoice
```http
DELETE /invoices/{id}
Authorization: Bearer {token}
Roles: admin
```

---

## Reports

### Get Aging Report
```http
GET /reports/aging?area_id=uuid
Authorization: Bearer {token}
Roles: admin, manager
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "customer_id": "uuid",
        "customer_code": "CUST-000001",
        "full_name": "Rajesh Kumar",
        "phone": "9876543210",
        "area_name": "Zone A",
        "total_outstanding": 5000,
        "current_amount": 1000,
        "days_1_30": 2000,
        "days_31_60": 1500,
        "days_61_90": 500,
        "days_90_plus": 0
      }
    ],
    "totals": {
      "total_outstanding": 50000,
      "current_amount": 10000,
      "days_1_30": 20000,
      "days_31_60": 15000,
      "days_61_90": 5000,
      "days_90_plus": 0
    },
    "count": 25
  }
}
```

### Get Financial Summary
```http
GET /reports/financial?date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer {token}
Roles: admin, manager
```

### Get Delivery Reports
```http
GET /reports/deliveries?date_from=2025-11-01&date_to=2025-11-30&area_id=uuid&group_by=date
Authorization: Bearer {token}
Roles: admin, manager
```

**Query Parameters:**
- `group_by`: date, area, person

### Get Customer Analytics
```http
GET /reports/customers?area_id=uuid
Authorization: Bearer {token}
Roles: admin, manager
```

### Get Dashboard Summary
```http
GET /reports/dashboard
Authorization: Bearer {token}
Roles: admin, manager
```

**Response:**
```json
{
  "success": true,
  "data": {
    "today_deliveries": {
      "total": 45,
      "completed": 30,
      "pending": 15,
      "in_progress": 0
    },
    "today_revenue": {
      "revenue": 2700,
      "quantity_delivered": 45
    },
    "today_payments": {
      "count": 5,
      "total": 15000
    },
    "active_stats": {
      "active_customers": 150,
      "active_subscriptions": 120,
      "active_areas": 4
    },
    "pending_collections": {
      "total": 75000
    },
    "overdue_invoices": {
      "count": 12,
      "total": 25000
    }
  }
}
```

---

## Error Responses

All endpoints follow a standard error response format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Pagination

Paginated endpoints return responses in this format:

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Tokens are returned upon successful login/registration and expire after 7 days (configurable).

---

## Role-Based Access Control

- **admin**: Full access to all endpoints
- **manager**: Access to most endpoints except critical deletions
- **delivery_person**: Limited access to delivery management and payment recording

Refer to individual endpoint documentation for role requirements.

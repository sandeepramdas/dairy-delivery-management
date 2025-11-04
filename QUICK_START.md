# Quick Start Guide - Milk Delivery Management System

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Step 1: Install PostgreSQL

### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE milk_delivery;

# Exit
\q
```

## Step 3: Run Database Schema

```bash
cd "Dairy Delivery"
psql -U postgres -d milk_delivery -f database/schema.sql
```

## Step 4: Create Admin User Password

Generate a hashed password for the admin user:

```bash
node database/create-admin.js
```

Copy the generated hash and update it in the database:

```bash
psql -U postgres -d milk_delivery

UPDATE users SET password_hash = 'YOUR_GENERATED_HASH' WHERE email = 'admin@milkdelivery.com';

\q
```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Configure Environment

The `.env` file is already created with default values. Update if needed:

```bash
# Edit .env file
# Update DB_PASSWORD with your PostgreSQL password
# Update JWT_SECRET with a secure random string
```

## Step 7: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## Step 8: Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Login as Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@milkdelivery.com",
    "password": "admin123"
  }'
```

Save the token from the response for subsequent requests.

## Step 9: Explore the API

Use the token to make authenticated requests:

```bash
# Get all areas
curl http://localhost:3000/api/v1/areas \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get all products
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create a customer
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "area_id": "GET_FROM_AREAS_API",
    "address_line1": "123 Main Street",
    "city": "Mumbai",
    "pincode": "400001",
    "latitude": 19.0760,
    "longitude": 72.8777
  }'
```

## Available API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/profile` - Get profile (protected)
- `PUT /api/v1/auth/profile` - Update profile (protected)
- `POST /api/v1/auth/change-password` - Change password (protected)

### Customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers` - Get all customers (with pagination & filters)
- `GET /api/v1/customers/:id` - Get customer by ID
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer
- `GET /api/v1/customers/:id/subscriptions` - Get customer subscriptions
- `GET /api/v1/customers/:id/payments` - Get customer payments
- `GET /api/v1/customers/:id/invoices` - Get customer invoices
- `GET /api/v1/customers/:id/outstanding` - Get outstanding balance

### Areas
- `POST /api/v1/areas` - Create area
- `GET /api/v1/areas` - Get all areas
- `GET /api/v1/areas/:id` - Get area by ID
- `PUT /api/v1/areas/:id` - Update area
- `DELETE /api/v1/areas/:id` - Delete area
- `GET /api/v1/areas/:id/customers` - Get area customers
- `GET /api/v1/areas/:id/personnel` - Get assigned personnel
- `POST /api/v1/areas/:id/personnel` - Assign personnel
- `DELETE /api/v1/areas/:id/personnel/:assignment_id` - Remove assignment

### Products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get product by ID
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Subscriptions
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions` - Get all subscriptions
- `GET /api/v1/subscriptions/:id` - Get subscription by ID
- `PUT /api/v1/subscriptions/:id` - Update subscription
- `PUT /api/v1/subscriptions/:id/schedule` - Update schedule
- `POST /api/v1/subscriptions/:id/pause` - Pause subscription
- `POST /api/v1/subscriptions/:id/resume` - Resume subscription
- `POST /api/v1/subscriptions/:id/cancel` - Cancel subscription
- `DELETE /api/v1/subscriptions/:id` - Delete subscription

### Deliveries
- `POST /api/v1/deliveries` - Create delivery
- `GET /api/v1/deliveries` - Get all deliveries
- `GET /api/v1/deliveries/today` - Get today's deliveries
- `GET /api/v1/deliveries/calendar` - Get calendar view
- `GET /api/v1/deliveries/date/:date` - Get deliveries by date
- `GET /api/v1/deliveries/:id` - Get delivery by ID
- `PUT /api/v1/deliveries/:id` - Update delivery
- `POST /api/v1/deliveries/:id/complete` - Mark as completed
- `POST /api/v1/deliveries/:id/missed` - Mark as missed
- `POST /api/v1/deliveries/:id/exceptions` - Report exception
- `GET /api/v1/deliveries/:id/exceptions` - Get exceptions
- `DELETE /api/v1/deliveries/:id` - Delete delivery

### Payments
- `POST /api/v1/payments` - Record payment
- `GET /api/v1/payments` - Get all payments
- `GET /api/v1/payments/pending` - Get pending collections
- `GET /api/v1/payments/:id` - Get payment by ID
- `PUT /api/v1/payments/:id` - Update payment
- `DELETE /api/v1/payments/:id` - Delete payment

### Invoices
- `POST /api/v1/invoices` - Create invoice
- `POST /api/v1/invoices/generate` - Auto-generate from deliveries
- `GET /api/v1/invoices` - Get all invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice

### Reports
- `GET /api/v1/reports/aging` - Get aging report
- `GET /api/v1/reports/financial` - Get financial summary
- `GET /api/v1/reports/deliveries` - Get delivery reports
- `GET /api/v1/reports/customers` - Get customer analytics
- `GET /api/v1/reports/dashboard` - Get dashboard summary

## Default Credentials

**Admin User:**
- Email: `admin@milkdelivery.com`
- Password: `admin123` (Change this after first login!)

## Sample Data

The database schema includes sample data:
- 4 Areas (Zone A-D)
- 4 Products (Full Cream, Toned, Double Toned, Buffalo Milk)

## Troubleshooting

### Database Connection Error
- Check if PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Verify database credentials in `.env` file
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using the port: `lsof -ti:3000 | xargs kill`

### Token Expired
- Login again to get a new token
- Update JWT_EXPIRES_IN in `.env` to change expiry time

## Next Steps

1. Test all API endpoints using Postman or curl
2. Create customers, subscriptions, and deliveries
3. Generate invoices and record payments
4. View reports and analytics
5. Customize business logic as needed
6. Set up a frontend (React/Vue) if desired

## Documentation

- Full API Documentation: See `API_DOCUMENTATION.md`
- Database Schema: See `database/schema.sql`
- Setup Instructions: See `database/setup-instructions.md`

## Support

For issues or questions, refer to the README.md or create an issue in the repository.

# Database Setup Instructions

## Prerequisites

- PostgreSQL 14+ installed on your system
- PostgreSQL server running
- Access to create databases

## Step-by-Step Setup

### 1. Install PostgreSQL (if not already installed)

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql, create the database
CREATE DATABASE milk_delivery;

# Exit psql
\q
```

### 3. Run the Schema

```bash
# Run the schema file
psql -U postgres -d milk_delivery -f schema.sql
```

Or if you want to see verbose output:

```bash
psql -U postgres -d milk_delivery -f schema.sql -a
```

### 4. Verify Installation

Connect to the database and check tables:

```bash
psql -U postgres -d milk_delivery

# Inside psql, list tables
\dt

# You should see tables like:
# - users
# - areas
# - customers
# - product_catalog
# - subscription_plans
# - deliveries
# - invoices
# - payments
# etc.

# Check sample data
SELECT * FROM areas;
SELECT * FROM product_catalog;

# Exit
\q
```

### 5. Create Admin User with Proper Password

The default admin user in the schema has a placeholder password. Let's create a proper one:

```bash
# Generate password hash (using Node.js)
node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
```

Copy the output hash, then update the admin user:

```bash
psql -U postgres -d milk_delivery

# Update admin password (replace YOUR_HASH with the generated hash)
UPDATE users
SET password_hash = 'YOUR_HASH'
WHERE email = 'admin@milkdelivery.com';

# Verify
SELECT email, full_name, role FROM users WHERE role = 'admin';

\q
```

### 6. Update .env File

Create `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=milk_delivery
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_random_secret_key_here
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7. Test Connection

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Database connection established
🚀 Server is running on port 3000
```

## Database Management Commands

### Backup Database

```bash
pg_dump -U postgres milk_delivery > backup.sql
```

### Restore Database

```bash
psql -U postgres milk_delivery < backup.sql
```

### Reset Database

```bash
# Drop database
psql -U postgres -c "DROP DATABASE milk_delivery;"

# Recreate database
psql -U postgres -c "CREATE DATABASE milk_delivery;"

# Run schema again
psql -U postgres -d milk_delivery -f schema.sql
```

### View Database Size

```bash
psql -U postgres -d milk_delivery -c "SELECT pg_size_pretty(pg_database_size('milk_delivery'));"
```

## Troubleshooting

### Issue: "database does not exist"
**Solution:** Create the database first:
```bash
psql -U postgres -c "CREATE DATABASE milk_delivery;"
```

### Issue: "role does not exist"
**Solution:** Create a PostgreSQL user:
```bash
psql -U postgres -c "CREATE USER your_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE milk_delivery TO your_user;"
```

### Issue: "permission denied"
**Solution:** Grant privileges:
```bash
psql -U postgres -d milk_delivery -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;"
psql -U postgres -d milk_delivery -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;"
```

### Issue: Connection refused
**Solution:** Check if PostgreSQL is running:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Start if not running
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

## Sample Data

The schema includes sample data for:
- 4 areas (Zone A-D)
- 4 products (Full Cream, Toned, Double Toned, Buffalo Milk)
- 1 admin user

You can add more test data as needed using SQL INSERT statements or through the API.

## Next Steps

1. Verify database is running
2. Run schema.sql
3. Update admin password
4. Configure .env file
5. Start the application
6. Test API endpoints using Postman or curl

## Useful PostgreSQL Commands

```sql
-- List all databases
\l

-- Connect to database
\c milk_delivery

-- List all tables
\dt

-- Describe table structure
\d users

-- View table data
SELECT * FROM users;

-- Count records
SELECT COUNT(*) FROM customers;

-- Exit
\q
```

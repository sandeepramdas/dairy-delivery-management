-- =====================================================
-- MILK DELIVERY MANAGEMENT SYSTEM - DATABASE SCHEMA
-- PostgreSQL 14+
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER MANAGEMENT
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'delivery_person', 'manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- AREA & DELIVERY MANAGEMENT
-- =====================================================

CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_areas_code ON areas(code);
CREATE INDEX idx_areas_active ON areas(is_active);

CREATE TABLE delivery_personnel_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, area_id, assigned_date)
);

CREATE INDEX idx_personnel_user ON delivery_personnel_assignments(user_id);
CREATE INDEX idx_personnel_area ON delivery_personnel_assignments(area_id);
CREATE INDEX idx_personnel_active ON delivery_personnel_assignments(is_active);

-- =====================================================
-- CUSTOMER MANAGEMENT
-- =====================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    area_id UUID NOT NULL REFERENCES areas(id),
    address_line1 VARCHAR(500) NOT NULL,
    address_line2 VARCHAR(500),
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location_notes TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
    joining_date DATE DEFAULT CURRENT_DATE,
    alternate_phone VARCHAR(20),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto-generate customer code (trigger function below)
CREATE SEQUENCE customer_code_seq START 1;

CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_area ON customers(area_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_location ON customers(latitude, longitude);

-- =====================================================
-- PRODUCT CATALOG
-- =====================================================

CREATE TABLE product_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('litres', 'ml', 'packets')) DEFAULT 'litres',
    price_per_unit DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_code ON product_catalog(product_code);
CREATE INDEX idx_products_active ON product_catalog(is_active);

-- =====================================================
-- SUBSCRIPTION MANAGEMENT
-- =====================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product_catalog(id),
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'completed')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_customer ON subscription_plans(customer_id);
CREATE INDEX idx_subscriptions_status ON subscription_plans(status);
CREATE INDEX idx_subscriptions_dates ON subscription_plans(start_date, end_date);

CREATE TABLE subscription_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    quantity DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (day_of_week IS NOT NULL AND day_of_month IS NULL) OR
        (day_of_week IS NULL AND day_of_month IS NOT NULL)
    )
);

CREATE INDEX idx_schedule_plan ON subscription_schedule(subscription_plan_id);
CREATE INDEX idx_schedule_dow ON subscription_schedule(day_of_week);
CREATE INDEX idx_schedule_dom ON subscription_schedule(day_of_month);
CREATE INDEX idx_schedule_dates ON subscription_schedule(effective_from, effective_to);

-- =====================================================
-- DELIVERY MANAGEMENT
-- =====================================================

CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    product_id UUID NOT NULL REFERENCES product_catalog(id),
    scheduled_date DATE NOT NULL,
    scheduled_quantity DECIMAL(10,2) NOT NULL,
    delivered_quantity DECIMAL(10,2),
    delivery_status VARCHAR(50) NOT NULL CHECK (delivery_status IN ('scheduled', 'out_for_delivery', 'delivered', 'missed', 'cancelled')) DEFAULT 'scheduled',
    delivered_by UUID REFERENCES users(id),
    delivered_at TIMESTAMP,
    delivery_notes TEXT,
    customer_feedback TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE delivery_code_seq START 1;

CREATE INDEX idx_deliveries_code ON deliveries(delivery_code);
CREATE INDEX idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX idx_deliveries_date ON deliveries(scheduled_date);
CREATE INDEX idx_deliveries_status ON deliveries(delivery_status);
CREATE INDEX idx_deliveries_person ON deliveries(delivered_by);
CREATE INDEX idx_deliveries_subscription ON deliveries(subscription_plan_id);

CREATE TABLE delivery_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    exception_type VARCHAR(50) NOT NULL CHECK (exception_type IN ('customer_unavailable', 'wrong_address', 'quantity_issue', 'payment_issue', 'other')),
    exception_notes TEXT NOT NULL,
    reported_by UUID NOT NULL REFERENCES users(id),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolution_status VARCHAR(50) NOT NULL CHECK (resolution_status IN ('open', 'in_progress', 'resolved')) DEFAULT 'open',
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

CREATE INDEX idx_exceptions_delivery ON delivery_exceptions(delivery_id);
CREATE INDEX idx_exceptions_status ON delivery_exceptions(resolution_status);

-- =====================================================
-- PAYMENT & INVOICING
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue')) DEFAULT 'draft',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE invoice_number_seq START 1;

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(invoice_date, due_date);
CREATE INDEX idx_invoices_balance ON invoices(balance_amount);

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES deliveries(id),
    product_id UUID NOT NULL REFERENCES product_catalog(id),
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_delivery ON invoice_line_items(delivery_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'cheque')),
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
    transaction_reference VARCHAR(255),
    received_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE payment_code_seq START 1;

CREATE INDEX idx_payments_code ON payments(payment_code);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(payment_status);

CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_allocations_invoice ON payment_allocations(invoice_id);

-- =====================================================
-- AUDIT & LOGGING
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON product_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_code IS NULL THEN
        NEW.customer_code := 'CUST-' || LPAD(nextval('customer_code_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customer_code BEFORE INSERT ON customers
    FOR EACH ROW EXECUTE FUNCTION generate_customer_code();

-- Auto-generate delivery code
CREATE OR REPLACE FUNCTION generate_delivery_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_code IS NULL THEN
        NEW.delivery_code := 'DEL-' || TO_CHAR(NEW.scheduled_date, 'YYYYMMDD') || '-' || LPAD(nextval('delivery_code_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_delivery_code BEFORE INSERT ON deliveries
    FOR EACH ROW EXECUTE FUNCTION generate_delivery_code();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Auto-generate payment code
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_code IS NULL THEN
        NEW.payment_code := 'PAY-' || TO_CHAR(NEW.payment_date, 'YYYYMMDD') || '-' || LPAD(nextval('payment_code_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payment_code BEFORE INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION generate_payment_code();

-- Calculate invoice balance
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance_amount := NEW.total_amount - NEW.paid_amount;

    -- Update status based on payment
    IF NEW.balance_amount = 0 THEN
        NEW.status := 'paid';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status := 'partially_paid';
    ELSIF NEW.due_date < CURRENT_DATE AND NEW.status != 'paid' THEN
        NEW.status := 'overdue';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_balance BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_balance();

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Customer Outstanding Summary
CREATE OR REPLACE VIEW vw_customer_outstanding AS
SELECT
    c.id AS customer_id,
    c.customer_code,
    c.full_name,
    c.phone,
    c.area_id,
    a.name AS area_name,
    SUM(CASE WHEN i.status IN ('sent', 'partially_paid', 'overdue') THEN i.balance_amount ELSE 0 END) AS total_outstanding,
    SUM(CASE WHEN i.due_date >= CURRENT_DATE THEN i.balance_amount ELSE 0 END) AS current_amount,
    SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN i.balance_amount ELSE 0 END) AS days_1_30,
    SUM(CASE WHEN i.due_date < CURRENT_DATE - INTERVAL '30 days' AND i.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN i.balance_amount ELSE 0 END) AS days_31_60,
    SUM(CASE WHEN i.due_date < CURRENT_DATE - INTERVAL '60 days' AND i.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN i.balance_amount ELSE 0 END) AS days_61_90,
    SUM(CASE WHEN i.due_date < CURRENT_DATE - INTERVAL '90 days' THEN i.balance_amount ELSE 0 END) AS days_90_plus
FROM customers c
LEFT JOIN areas a ON c.area_id = a.id
LEFT JOIN invoices i ON c.id = i.customer_id
WHERE c.status = 'active'
GROUP BY c.id, c.customer_code, c.full_name, c.phone, c.area_id, a.name;

-- Daily Delivery Summary
CREATE OR REPLACE VIEW vw_daily_delivery_summary AS
SELECT
    d.scheduled_date,
    a.id AS area_id,
    a.name AS area_name,
    u.id AS delivery_person_id,
    u.full_name AS delivery_person_name,
    COUNT(*) AS total_deliveries,
    COUNT(CASE WHEN d.delivery_status = 'delivered' THEN 1 END) AS completed_deliveries,
    COUNT(CASE WHEN d.delivery_status = 'missed' THEN 1 END) AS missed_deliveries,
    COUNT(CASE WHEN d.delivery_status = 'scheduled' THEN 1 END) AS pending_deliveries,
    SUM(d.scheduled_quantity) AS total_quantity_scheduled,
    SUM(d.delivered_quantity) AS total_quantity_delivered,
    SUM(d.amount) AS total_amount
FROM deliveries d
JOIN customers c ON d.customer_id = c.id
JOIN areas a ON c.area_id = a.id
LEFT JOIN users u ON d.delivered_by = u.id
GROUP BY d.scheduled_date, a.id, a.name, u.id, u.full_name;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@milkdelivery.com', '$2b$10$YourHashedPasswordHere', 'System Admin', '9876543210', 'admin');

-- Insert sample areas
INSERT INTO areas (name, code, description) VALUES
('Zone A - North', 'ZN-A', 'North sector residential area'),
('Zone B - South', 'ZN-B', 'South sector commercial area'),
('Zone C - East', 'ZN-C', 'East sector mixed area'),
('Zone D - West', 'ZN-D', 'West sector residential area');

-- Insert sample products
INSERT INTO product_catalog (product_name, product_code, unit, price_per_unit, description) VALUES
('Full Cream Milk', 'MILK-FC', 'litres', 60.00, 'Fresh full cream milk'),
('Toned Milk', 'MILK-TN', 'litres', 50.00, 'Fresh toned milk'),
('Double Toned Milk', 'MILK-DT', 'litres', 45.00, 'Fresh double toned milk'),
('Buffalo Milk', 'MILK-BF', 'litres', 70.00, 'Fresh buffalo milk');

-- =====================================================
-- END OF SCHEMA
-- =====================================================

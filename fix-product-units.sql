-- Fix product_catalog unit constraint to match frontend dropdown
-- Drop existing constraint
ALTER TABLE product_catalog DROP CONSTRAINT IF EXISTS product_catalog_unit_check;

-- Add new constraint with correct values
ALTER TABLE product_catalog ADD CONSTRAINT product_catalog_unit_check 
  CHECK (unit IN ('L', 'mL', 'kg', 'g', 'pieces', 'dozen', 'pack'));

-- Update existing products to use new unit format
UPDATE product_catalog SET unit = 'L' WHERE unit = 'litres';
UPDATE product_catalog SET unit = 'mL' WHERE unit = 'ml';
UPDATE product_catalog SET unit = 'pack' WHERE unit = 'packets';

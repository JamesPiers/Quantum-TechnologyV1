-- Seed data for Quantum Technology Parts Management System
-- File: supabase/seed/seed.sql

-- Clear existing data (in reverse dependency order)
TRUNCATE parts, po_line_items, purchase_orders, customers, suppliers, manufacturers CASCADE;

-- Insert sample manufacturers
INSERT INTO manufacturers (id, name, website, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Parker Hannifin', 'https://www.parker.com', 'Motion and control technologies'),
  ('22222222-2222-2222-2222-222222222222', 'Swagelok', 'https://www.swagelok.com', 'Fluid system products and solutions'),
  ('33333333-3333-3333-3333-333333333333', 'Pfeiffer Vacuum', 'https://www.pfeiffer-vacuum.com', 'Vacuum technology solutions'),
  ('44444444-4444-4444-4444-444444444444', 'Edwards Vacuum', 'https://www.edwardsvacuum.com', 'Vacuum and abatement solutions'),
  ('55555555-5555-5555-5555-555555555555', 'Siemens', 'https://www.siemens.com', 'Industrial automation and drives');

-- Insert sample suppliers
INSERT INTO suppliers (id, name, contact_name, email, phone, website, notes) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Industrial Supply Co.', 'John Smith', 'john.smith@industrialsupply.com', '+1-416-555-0123', 'https://industrialsupply.com', 'Local industrial supplier with good pricing'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Vacuum Tech Solutions', 'Sarah Johnson', 'sarah.j@vacuumtech.com', '+1-905-555-0456', 'https://vacuumtech.com', 'Specialized vacuum equipment supplier'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Precision Components Ltd.', 'Mike Chen', 'mike@precisioncomp.ca', '+1-647-555-0789', 'https://precisioncomp.ca', 'High precision machined components'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Electronic Systems Inc.', 'Lisa Wong', 'lisa.wong@electronsys.com', '+1-514-555-0321', 'https://electronsys.com', 'Electronic components and systems'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Quantum Direct', 'David Taylor', 'david@quantumdirect.com', '+1-416-555-0654', 'https://quantumdirect.com', 'Direct supplier for Quantum Technology projects');

-- Insert sample customers
INSERT INTO customers (id, customer_number, name, email, phone, notes) VALUES
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'CUST-001', 'Advanced Research Labs', 'procurement@advancedresearch.com', '+1-416-555-1001', 'University research facility'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'CUST-002', 'National Defense Corp', 'contracts@natdefense.gov', '+1-613-555-1002', 'Government defense contractor'),
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'CUST-003', 'Photonics International', 'orders@photonicsinc.com', '+1-905-555-1003', 'Commercial photonics manufacturer');

-- Insert sample purchase orders
INSERT INTO purchase_orders (id, po_number, supplier_id, customer_id, order_date, currency, notes) VALUES
  ('90000000-9000-9000-9000-900000000001', 'PO-538-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', '2024-01-15', 'C', 'Initial order for Project 538 vacuum components'),
  ('90000000-9000-9000-9000-900000000002', 'PO-538-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', '2024-02-01', 'U', 'Specialized vacuum pumps for defense project'),
  ('90000000-9000-9000-9000-900000000003', 'PO-539-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', '2024-02-15', 'C', 'Precision components for photonics system');

-- Insert sample parts with varied categories and currencies
INSERT INTO parts (
  id, c, part, desc, vp1, up1, vp2, up2, sup, mfg, pn, proj, sec, dwg, id_from_dwg,
  qty, spare, po, re_sp, ord, wk, s, each, d, n, l, b, w, upd, lc
) VALUES
  -- Material category part
  (
    '10000000-1000-1000-1000-100000000001',
    'm', 'SS316-TUBE-1/4', 'Stainless Steel 316 Tubing', 0.25, 'inch', 10.0, 'ft',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'PKR-SS316-025-10',
    '538', 'A', 'DWG-538-001', 'T1',
    50, 10, 'PO-538-001', 'JS', '2024-01-15', 2, 4, 12.50, 'C',
    'High-grade stainless steel for vacuum applications', 'https://parker.com/ss316-tubing', false, 'JS', '2024-01-20', 'QW'
  ),
  
  -- Vacuum category part
  (
    '10000000-1000-1000-1000-100000000002',
    'v', 'TURBO-250L', 'Turbomolecular Pump 250 L/s', 250.0, 'L/s', 24.0, 'VDC',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'PFR-TURBO-250',
    '538', 'B', 'DWG-538-002', 'P1',
    2, 1, 'PO-538-002', 'MK', '2024-02-01', 8, 2, 4500.00, 'U',
    'High-performance turbo pump for UHV applications', 'https://pfeiffer-vacuum.com/turbo-250l', false, 'MK', '2024-02-05', 'IW'
  ),
  
  -- Electronics category part
  (
    '10000000-1000-1000-1000-100000000003',
    't', 'CTRL-PLC-S7', 'Siemens S7-1200 PLC Controller', 24.0, 'VDC', 32.0, 'I/O',
    'dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 'SIE-S7-1200-32',
    '539', 'C', 'DWG-539-001', 'C1',
    1, 1, 'PO-539-001', 'LW', '2024-02-15', 6, 3, 850.00, 'C',
    'Compact PLC for automation control', 'https://siemens.com/s7-1200', false, 'LW', '2024-02-20', 'CD'
  ),
  
  -- Systems category part
  (
    '10000000-1000-1000-1000-100000000004',
    's', 'CHM-UHV-001', 'Ultra-High Vacuum Chamber', 12.0, 'in', 8.0, 'in',
    'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 'CUSTOM-UHV-CHM-001',
    '538', 'A', 'DWG-538-003', 'CH1',
    1, 0, 'PO-538-001', 'DT', '2024-01-15', 12, 1, 2800.00, 'C',
    'Custom fabricated UHV chamber with multiple ports', NULL, false, 'DT', '2024-01-22', 'CP'
  ),
  
  -- Electrical category part
  (
    '10000000-1000-1000-1000-100000000005',
    'e', 'CBL-PWR-10AWG', 'Power Cable 10 AWG Stranded', 10.0, 'AWG', 25.0, 'ft',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, 'PWR-CBL-10AWG-25FT',
    '539', 'D', 'DWG-539-002', 'E1',
    100, 25, NULL, 'AM', NULL, 1, 0, 2.75, 'C',
    'High-flex power cable for mobile applications', NULL, true, 'AM', '2024-02-10', 'NC'
  );

-- Insert corresponding PO line items
INSERT INTO po_line_items (purchase_order_id, part_id, quantity, unit_price, currency) VALUES
  ('90000000-9000-9000-9000-900000000001', '10000000-1000-1000-1000-100000000001', 50, 12.50, 'C'),
  ('90000000-9000-9000-9000-900000000001', '10000000-1000-1000-1000-100000000004', 1, 2800.00, 'C'),
  ('90000000-9000-9000-9000-900000000002', '10000000-1000-1000-1000-100000000002', 2, 4500.00, 'U'),
  ('90000000-9000-9000-9000-900000000003', '10000000-1000-1000-1000-100000000003', 1, 850.00, 'C');

-- Verify data integrity
SELECT 'Seeding completed successfully!' as message;
SELECT 'Manufacturers: ' || COUNT(*) as count FROM manufacturers;
SELECT 'Suppliers: ' || COUNT(*) as count FROM suppliers;  
SELECT 'Customers: ' || COUNT(*) as count FROM customers;
SELECT 'Parts: ' || COUNT(*) as count FROM parts;
SELECT 'Purchase Orders: ' || COUNT(*) as count FROM purchase_orders;
SELECT 'PO Line Items: ' || COUNT(*) as count FROM po_line_items;

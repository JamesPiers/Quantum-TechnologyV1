-- Initial schema for Quantum Technology Parts Management System
-- Migration: 20241009000001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core dictionary tables
-- 1.1 Manufacturers
CREATE TABLE manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  website text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.2 Suppliers
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  contact_name text,
  email text,
  phone text,
  website text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.3 Customers
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number text UNIQUE NOT NULL,
  name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.4 Status codes legend
CREATE TABLE status_codes (
  code integer PRIMARY KEY,
  label text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default status codes
INSERT INTO status_codes (code, label, description) VALUES
  (0, 'Unknown', 'Status not specified or unclear'),
  (1, 'Quoted', 'Quote received, awaiting decision'),
  (2, 'Ordered', 'Purchase order placed with supplier'),
  (3, 'Shipped', 'Item shipped by supplier'),
  (4, 'Received', 'Item received at facility'),
  (5, 'Installed', 'Item installed and operational'),
  (6, 'Backorder', 'Item on backorder with supplier'),
  (7, 'Cancelled', 'Order cancelled'),
  (8, 'Returned', 'Item returned to supplier'),
  (9, 'Archived', 'Archived/inactive item');

-- 1.5 Main parts table
-- Maps to "Instructions Database Column Rules" 
CREATE TABLE parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identification
  c char(1) NOT NULL CHECK (c IN ('m', 'e', 't', 's', 'p', 'c', 'v', 'x')), -- Category: m(material), e(electrical), t(electronics), s(systems), p(plumbing), c(compressors), v(vacuum), x(misc/other)
  part text NOT NULL,                       -- Primary short name / code (PART column in source)
  "desc" text,                              -- More detailed description (DESC column in source)
  
  -- Value parameters
  vp1 numeric,                              -- Value parameter 1 (VP1 column in source)
  up1 text,                                 -- Units for VP1 (UP1 column in source)
  vp2 numeric,                              -- Value parameter 2 (VP2 column in source)
  up2 text,                                 -- Units for VP2 (UP2 column in source)
  
  -- Relationships
  sup uuid REFERENCES suppliers(id),        -- Supplier (SUP column in source)
  mfg uuid REFERENCES manufacturers(id),    -- Manufacturer (MFG column in source)
  pn text,                                  -- Supplier/manufacturer part number (PN column in source)
  
  -- Project information
  proj text,                                -- Project code e.g., 538 (PROJ column in source)
  sec text,                                 -- Project section (SEC column in source)
  dwg text,                                 -- Drawing reference (DWG column in source)
  id_from_dwg text,                         -- Identifier from drawing (ID column in source)
  
  -- Quantities
  qty integer DEFAULT 0,                    -- Quantity not including spares (QTY column in source)
  spare integer DEFAULT 0,                  -- Spares quantity (SPARE column in source)
  
  -- Purchase information
  po text,                                  -- Purchase order number (PO column in source)
  re_sp text,                               -- Responsible person initials (RE SP column in source)
  ord date,                                 -- Date ordered YYYYMMDD format (ORD column in source)
  wk integer,                               -- Lead time in weeks (WK column in source)
  s integer DEFAULT 0 CHECK (s BETWEEN 0 AND 9), -- Status code 0-9 (S column in source)
  
  -- Pricing
  each numeric,                             -- Price per unit (EACH column in source)
  d char(1) DEFAULT 'C' CHECK (d IN ('C', 'U')), -- Currency: C=CAD, U=USD (D column in source)
  
  -- Additional information
  n text,                                   -- Notes (N column in source)
  l text,                                   -- Link/URL for part entry (L column in source)
  b boolean DEFAULT false,                  -- Budget line - "S" in source means section pricing estimate (B column in source)
  w text,                                   -- Who last updated (initials) (W column in source)
  upd date,                                 -- Date updated YYYYMMDD format (UPD column in source)
  lc text,                                  -- Location/Warehouse codes: IW, CP, QW, CD, NC (LC column in source)
  
  -- Standard audit fields
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add helpful indexes for common queries
CREATE INDEX idx_parts_po ON parts (po);
CREATE INDEX idx_parts_pn ON parts (pn);  
CREATE INDEX idx_parts_part ON parts (part);
CREATE INDEX idx_parts_mfg ON parts (mfg);
CREATE INDEX idx_parts_sup ON parts (sup);
CREATE INDEX idx_parts_proj ON parts (proj);
CREATE INDEX idx_parts_category ON parts (c);
CREATE INDEX idx_parts_status ON parts (s);

-- Add trigram indexes for text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_parts_part_trgm ON parts USING gin (part gin_trgm_ops);
CREATE INDEX idx_parts_pn_trgm ON parts USING gin (pn gin_trgm_ops);
CREATE INDEX idx_parts_po_trgm ON parts USING gin (po gin_trgm_ops);

-- 1.6 Purchase orders for normalized PO data
CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id),
  customer_id uuid REFERENCES customers(id),
  order_date date,
  notes text,
  currency char(1) DEFAULT 'C' CHECK (currency IN ('C', 'U')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.7 Purchase order line items
CREATE TABLE po_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  part_id uuid REFERENCES parts(id),
  quantity integer NOT NULL DEFAULT 0,
  unit_price numeric,
  currency char(1) DEFAULT 'C' CHECK (currency IN ('C', 'U')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for purchase order queries
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders (po_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders (supplier_id);
CREATE INDEX idx_purchase_orders_customer ON purchase_orders (customer_id);
CREATE INDEX idx_po_line_items_po ON po_line_items (purchase_order_id);
CREATE INDEX idx_po_line_items_part ON po_line_items (part_id);

-- Audit events table for tracking changes
CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_events_entity ON audit_events (entity, entity_id);
CREATE INDEX idx_audit_events_user ON audit_events (user_id);

-- Table for raw PDF ingest data (for debugging and audit)
CREATE TABLE raw_ingest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  uploader_user_id uuid,
  parsed_content jsonb,
  ingest_report jsonb,
  processing_status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_raw_ingest_status ON raw_ingest (processing_status);
CREATE INDEX idx_raw_ingest_uploader ON raw_ingest (uploader_user_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_manufacturers_updated_at BEFORE UPDATE ON manufacturers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_status_codes_updated_at BEFORE UPDATE ON status_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_po_line_items_updated_at BEFORE UPDATE ON po_line_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raw_ingest_updated_at BEFORE UPDATE ON raw_ingest FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

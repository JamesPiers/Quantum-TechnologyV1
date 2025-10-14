-- Migration: Create do_quantum_parts_list table
-- Source: quantum_parts_list from MySQL DigitalOcean database
-- Generated: $(date)

-- Drop table if exists (for testing purposes)
DROP TABLE IF EXISTS do_quantum_parts_list CASCADE;

-- Create the table with proper PostgreSQL data types
CREATE TABLE do_quantum_parts_list (
  id INTEGER NOT NULL PRIMARY KEY,
  c VARCHAR(255),
  part VARCHAR(255),
  vp1 VARCHAR(255),
  up1 VARCHAR(255),
  vp2 VARCHAR(255),
  up2 VARCHAR(255),
  descr VARCHAR(2000),
  sup VARCHAR(255),
  mfg VARCHAR(255),
  pn VARCHAR(255),
  proj VARCHAR(255),
  sec VARCHAR(255),
  dwg VARCHAR(255),
  dwg_id VARCHAR(255),
  qty VARCHAR(255),
  spare VARCHAR(255),
  po VARCHAR(255),
  resp VARCHAR(255),
  ord VARCHAR(255),
  wk VARCHAR(255),
  s VARCHAR(255),
  each VARCHAR(255),
  d VARCHAR(255),
  n VARCHAR(1000),
  l VARCHAR(255),
  b VARCHAR(255),
  who VARCHAR(255),
  upd VARCHAR(255),
  category_description VARCHAR(255),
  each_num DECIMAL(12,2),
  d_date DATE
);

-- Add useful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_do_quantum_parts_sup ON do_quantum_parts_list(sup);
CREATE INDEX IF NOT EXISTS idx_do_quantum_parts_mfg ON do_quantum_parts_list(mfg);
CREATE INDEX IF NOT EXISTS idx_do_quantum_parts_pn ON do_quantum_parts_list(pn);
CREATE INDEX IF NOT EXISTS idx_do_quantum_parts_proj ON do_quantum_parts_list(proj);
CREATE INDEX IF NOT EXISTS idx_do_quantum_parts_po ON do_quantum_parts_list(po);
CREATE INDEX IF NOT EXISTS idx_do_quantum_parts_s ON do_quantum_parts_list(s);

-- Add a comment to the table
COMMENT ON TABLE do_quantum_parts_list IS 'Parts list migrated from MySQL quantum_parts_list table (DigitalOcean)';

-- Add comments to key columns
COMMENT ON COLUMN do_quantum_parts_list.id IS 'Primary key from original MySQL table';
COMMENT ON COLUMN do_quantum_parts_list.part IS 'Part name/description';
COMMENT ON COLUMN do_quantum_parts_list.descr IS 'Detailed part description';
COMMENT ON COLUMN do_quantum_parts_list.sup IS 'Supplier name';
COMMENT ON COLUMN do_quantum_parts_list.mfg IS 'Manufacturer';
COMMENT ON COLUMN do_quantum_parts_list.pn IS 'Part number';
COMMENT ON COLUMN do_quantum_parts_list.proj IS 'Project number';
COMMENT ON COLUMN do_quantum_parts_list.po IS 'Purchase order number';
COMMENT ON COLUMN do_quantum_parts_list.each_num IS 'Unit price as decimal';
COMMENT ON COLUMN do_quantum_parts_list.qty IS 'Quantity';
COMMENT ON COLUMN do_quantum_parts_list.resp IS 'Responsible person';

-- Enable Row Level Security (optional - you can enable this later)
-- ALTER TABLE do_quantum_parts_list ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users (uncomment when ready)
-- CREATE POLICY "Authenticated users can read parts list" ON do_quantum_parts_list
--   FOR SELECT TO authenticated
--   USING (true);

-- Create a policy for service role (uncomment when ready)
-- CREATE POLICY "Service role can manage parts list" ON do_quantum_parts_list
--   FOR ALL TO service_role
--   USING (true);

-- Success message
SELECT 'Table do_quantum_parts_list created successfully! Ready for data migration.' as status;

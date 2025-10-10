-- Views and RLS policies for Quantum Technology Parts Management System
-- Migration: 20241009000002_views_and_rls.sql

-- 1. Create readable parts view with expanded/humanized columns
CREATE OR REPLACE VIEW v_parts_readable AS
SELECT 
  p.id,
  p.c as category_code,
  CASE p.c 
    WHEN 'm' THEN 'Material'
    WHEN 'e' THEN 'Electrical'
    WHEN 't' THEN 'Electronics'
    WHEN 's' THEN 'Systems'
    WHEN 'p' THEN 'Plumbing'
    WHEN 'c' THEN 'Compressors'
    WHEN 'v' THEN 'Vacuum'
    WHEN 'x' THEN 'Misc/Other'
    ELSE 'Unknown'
  END as category_name,
  p.part,
  p."desc" as description,
  p.vp1 as value_param_1,
  p.up1 as units_1,
  p.vp2 as value_param_2,
  p.up2 as units_2,
  s.name as supplier_name,
  s.id as supplier_id,
  m.name as manufacturer_name,
  m.id as manufacturer_id,
  p.pn as part_number,
  p.proj as project,
  p.sec as section,
  p.dwg as drawing,
  p.id_from_dwg as drawing_id,
  p.qty as quantity,
  p.spare as spare_quantity,
  (p.qty + COALESCE(p.spare, 0)) as total_quantity,
  p.po as purchase_order,
  p.re_sp as responsible_person,
  p.ord as order_date,
  p.wk as lead_time_weeks,
  p.s as status_code,
  sc.label as status_label,
  sc.description as status_description,
  p.each as unit_price,
  p.d as currency_code,
  CASE p.d 
    WHEN 'C' THEN 'CAD'
    WHEN 'U' THEN 'USD'
    ELSE 'Unknown'
  END as currency_name,
  (p.qty * COALESCE(p.each, 0)) as line_total,
  p.n as notes,
  p.l as link,
  p.b as is_budget_item,
  p.w as last_updated_by,
  p.upd as last_update_date,
  p.lc as location_code,
  CASE p.lc 
    WHEN 'IW' THEN 'Internal Warehouse'
    WHEN 'CP' THEN 'Customer Premises'
    WHEN 'QW' THEN 'Quantum Warehouse'
    WHEN 'CD' THEN 'Customer Dock'
    WHEN 'NC' THEN 'Not Classified'
    ELSE p.lc
  END as location_name,
  p.created_at,
  p.updated_at
FROM parts p
LEFT JOIN suppliers s ON p.sup = s.id
LEFT JOIN manufacturers m ON p.mfg = m.id
LEFT JOIN status_codes sc ON p.s = sc.code;

-- 2. Create PO summary view
CREATE OR REPLACE VIEW v_po_summary AS
SELECT 
  po.id,
  po.po_number,
  po.order_date,
  s.name as supplier_name,
  c.name as customer_name,
  c.customer_number,
  po.currency,
  COUNT(pli.id) as line_item_count,
  SUM(pli.quantity * COALESCE(pli.unit_price, 0)) as total_amount,
  MIN(p.ord) as earliest_part_order_date,
  MAX(p.ord) as latest_part_order_date,
  COUNT(DISTINCT p.id) as unique_parts_count,
  po.notes,
  po.created_at,
  po.updated_at
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN customers c ON po.customer_id = c.id
LEFT JOIN po_line_items pli ON po.id = pli.purchase_order_id
LEFT JOIN parts p ON po.po_number = p.po
GROUP BY po.id, po.po_number, po.order_date, s.name, c.name, c.customer_number, po.currency, po.notes, po.created_at, po.updated_at;

-- 3. Create search function for parts
CREATE OR REPLACE FUNCTION rpc_search_parts(
  search_po text DEFAULT NULL,
  search_customer text DEFAULT NULL,
  search_part text DEFAULT NULL,
  search_manufacturer text DEFAULT NULL,
  search_supplier text DEFAULT NULL,
  search_status integer DEFAULT NULL,
  search_project text DEFAULT NULL,
  search_category text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  parts_data jsonb,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_parts AS (
    SELECT *
    FROM v_parts_readable vpr
    WHERE 
      (search_po IS NULL OR vpr.purchase_order ILIKE '%' || search_po || '%')
      AND (search_customer IS NULL OR EXISTS (
        SELECT 1 FROM customers c WHERE c.customer_number ILIKE '%' || search_customer || '%'
      ))
      AND (search_part IS NULL OR (
        vpr.part ILIKE '%' || search_part || '%' 
        OR vpr.part_number ILIKE '%' || search_part || '%'
        OR vpr.description ILIKE '%' || search_part || '%'
      ))
      AND (search_manufacturer IS NULL OR vpr.manufacturer_name ILIKE '%' || search_manufacturer || '%')
      AND (search_supplier IS NULL OR vpr.supplier_name ILIKE '%' || search_supplier || '%')
      AND (search_status IS NULL OR vpr.status_code = search_status)
      AND (search_project IS NULL OR vpr.project ILIKE '%' || search_project || '%')
      AND (search_category IS NULL OR vpr.category_code = search_category)
  ),
  paginated_parts AS (
    SELECT * FROM filtered_parts
    ORDER BY updated_at DESC, part
    LIMIT limit_count OFFSET offset_count
  ),
  total AS (
    SELECT COUNT(*) as count FROM filtered_parts
  )
  SELECT 
    jsonb_agg(to_jsonb(pp.*)) as parts_data,
    t.count as total_count
  FROM paginated_parts pp, total t
  GROUP BY t.count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security on all tables
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_ingest ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies

-- Manufacturers policies
CREATE POLICY "read_manufacturers" ON manufacturers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manage_manufacturers" ON manufacturers
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- Suppliers policies
CREATE POLICY "read_suppliers" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manage_suppliers" ON suppliers
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- Customers policies
CREATE POLICY "read_customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manage_customers" ON customers
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- Status codes policies (read-only for most, admin can manage)
CREATE POLICY "read_status_codes" ON status_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manage_status_codes" ON status_codes
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- Parts policies
CREATE POLICY "read_parts" ON parts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manage_parts" ON parts
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- Purchase orders policies
CREATE POLICY "read_purchase_orders" ON purchase_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manage_purchase_orders" ON purchase_orders
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- PO line items policies
CREATE POLICY "read_po_line_items" ON po_line_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manage_po_line_items" ON po_line_items
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- Audit events policies (users can read their own, admins can read all)
CREATE POLICY "read_own_audit_events" ON audit_events
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

CREATE POLICY "insert_audit_events" ON audit_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Raw ingest policies (users can read their own uploads, admins can read all)
CREATE POLICY "read_own_raw_ingest" ON raw_ingest
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (uploader_user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

CREATE POLICY "manage_raw_ingest" ON raw_ingest
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'user_role' = 'admin')
  );

-- 6. Grant necessary permissions for the service role and authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Allow authenticated users to execute the search function
GRANT EXECUTE ON FUNCTION rpc_search_parts TO authenticated;

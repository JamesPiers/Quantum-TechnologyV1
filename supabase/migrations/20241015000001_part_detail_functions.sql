-- Migration: Part detail view functions
-- Date: 2025-10-15
-- Description: Functions to support comprehensive part detail views with history, POs, and audit logging

-- Function to get part price history from audit events
CREATE OR REPLACE FUNCTION rpc_get_part_price_history(part_id_param uuid)
RETURNS TABLE (
  id uuid,
  changed_at timestamptz,
  changed_by uuid,
  old_price numeric,
  new_price numeric,
  currency char(1),
  notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id,
    ae.created_at as changed_at,
    ae.user_id as changed_by,
    (ae.payload->>'old_price')::numeric as old_price,
    (ae.payload->>'new_price')::numeric as new_price,
    COALESCE((ae.payload->>'currency')::char(1), 'C') as currency,
    ae.payload->>'notes' as notes
  FROM audit_events ae
  WHERE ae.entity = 'parts'
    AND ae.entity_id = part_id_param::text
    AND ae.action IN ('update', 'price_change')
    AND ae.payload ? 'new_price'
  ORDER BY ae.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all POs that include this part
CREATE OR REPLACE FUNCTION rpc_get_part_purchase_orders(part_id_param uuid)
RETURNS TABLE (
  po_id uuid,
  po_number text,
  order_date date,
  supplier_name text,
  supplier_id uuid,
  quantity integer,
  unit_price numeric,
  currency char(1),
  line_total numeric,
  status_code integer,
  status_label text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  -- Get POs from po_line_items table
  SELECT 
    po.id as po_id,
    po.po_number,
    po.order_date,
    s.name as supplier_name,
    s.id as supplier_id,
    pli.quantity,
    pli.unit_price,
    pli.currency,
    (pli.quantity * COALESCE(pli.unit_price, 0)) as line_total,
    0 as status_code,
    'N/A'::text as status_label,
    po.created_at
  FROM po_line_items pli
  JOIN purchase_orders po ON pli.purchase_order_id = po.id
  LEFT JOIN suppliers s ON po.supplier_id = s.id
  WHERE pli.part_id = part_id_param
  
  UNION
  
  -- Get POs from parts table (legacy PO references)
  SELECT 
    NULL::uuid as po_id,
    p.po as po_number,
    p.ord as order_date,
    s.name as supplier_name,
    s.id as supplier_id,
    p.qty as quantity,
    p.each as unit_price,
    p.d as currency,
    (p.qty * COALESCE(p.each, 0)) as line_total,
    p.s as status_code,
    sc.label as status_label,
    p.created_at
  FROM parts p
  LEFT JOIN suppliers s ON p.sup = s.id
  LEFT JOIN status_codes sc ON p.s = sc.code
  WHERE p.id = part_id_param
    AND p.po IS NOT NULL
  
  ORDER BY order_date DESC NULLS LAST, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get part change history (audit log)
CREATE OR REPLACE FUNCTION rpc_get_part_audit_log(part_id_param uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  action text,
  changes jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id,
    ae.user_id,
    ae.action,
    ae.payload as changes,
    ae.created_at
  FROM audit_events ae
  WHERE ae.entity = 'parts'
    AND ae.entity_id = part_id_param::text
  ORDER BY ae.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all parts with the same part code (duplicates)
CREATE OR REPLACE FUNCTION rpc_get_related_parts(part_code_param text)
RETURNS TABLE (
  id uuid,
  part text,
  description text,
  supplier_name text,
  manufacturer_name text,
  part_number text,
  project text,
  purchase_order text,
  status_label text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vpr.id,
    vpr.part,
    vpr.description,
    vpr.supplier_name,
    vpr.manufacturer_name,
    vpr.part_number,
    vpr.project,
    vpr.purchase_order,
    vpr.status_label,
    vpr.created_at,
    vpr.updated_at
  FROM v_parts_readable vpr
  WHERE vpr.part = part_code_param
  ORDER BY vpr.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log part update with detailed change tracking
CREATE OR REPLACE FUNCTION log_part_change()
RETURNS TRIGGER AS $$
DECLARE
  changes jsonb := '{}';
  field_name text;
  old_value text;
  new_value text;
BEGIN
  -- Build a changes object showing what changed
  FOR field_name IN 
    SELECT column_name::text 
    FROM information_schema.columns 
    WHERE table_name = 'parts' 
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
  LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name)
      INTO old_value, new_value
      USING OLD, NEW;
    
    IF old_value IS DISTINCT FROM new_value THEN
      changes := changes || jsonb_build_object(
        field_name,
        jsonb_build_object(
          'old', old_value,
          'new', new_value
        )
      );
    END IF;
  END LOOP;
  
  -- Only log if there were actual changes
  IF changes != '{}'::jsonb THEN
    INSERT INTO audit_events (entity, entity_id, action, payload, user_id)
    VALUES (
      'parts',
      NEW.id::text,
      'update',
      changes,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic change logging
DROP TRIGGER IF EXISTS parts_change_log_trigger ON parts;
CREATE TRIGGER parts_change_log_trigger
  AFTER UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION log_part_change();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION rpc_get_part_price_history TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_part_purchase_orders TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_part_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_related_parts TO authenticated;


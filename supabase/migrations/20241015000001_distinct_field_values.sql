-- Create function to get distinct field values efficiently
-- This function safely gets DISTINCT values for any field in v_parts_readable

CREATE OR REPLACE FUNCTION get_distinct_field_values(
  table_name text,
  field_name text
)
RETURNS TABLE (value text) AS $$
BEGIN
  -- Validate table name (security)
  IF table_name != 'v_parts_readable' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;
  
  -- Validate field name (security) - only allow known fields
  IF field_name NOT IN (
    'responsible_person', 'project', 'section', 'drawing', 
    'drawing_id', 'purchase_order', 'location_code', 'last_updated_by'
  ) THEN
    RAISE EXCEPTION 'Invalid field name: %', field_name;
  END IF;
  
  -- Return distinct non-null values
  RETURN QUERY EXECUTE format(
    'SELECT DISTINCT %I::text as value FROM %I WHERE %I IS NOT NULL AND %I::text != '''' ORDER BY %I',
    field_name, table_name, field_name, field_name, field_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_distinct_field_values TO authenticated;


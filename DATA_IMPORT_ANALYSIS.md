# Data Import Analysis: do_quantum_parts_list → parts

## Executive Summary

This document analyzes the structure of `do_quantum_parts_list` (raw source data) and compares it to the `parts` table (target normalized structure), then provides a plan for importing the data.

---

## 1. Schema Comparison

### Source: `do_quantum_parts_list`
- **Purpose**: Raw data migrated from MySQL (read-only staging table)
- **Structure**: Flat denormalized structure with mostly VARCHAR types
- **Key Characteristics**:
  - Supplier and Manufacturer stored as TEXT names
  - All fields are nullable
  - Uses generic column names (c, part, descr, etc.)
  - 41 columns total
  - Integer primary key (from original MySQL)

### Target: `parts`
- **Purpose**: Production-ready normalized parts management table
- **Structure**: Normalized with foreign keys and proper types
- **Key Characteristics**:
  - Supplier and Manufacturer are UUIDs (foreign keys)
  - Uses proper data types (numeric, date, boolean, etc.)
  - Has constraints and validation
  - UUID primary key
  - RLS policies enabled

---

## 2. Column Mapping

| Source (do_quantum_parts_list) | Target (parts) | Transformation Required |
|--------------------------------|----------------|-------------------------|
| `id` (INTEGER) | - | Not mapped (new UUIDs generated) |
| `c` (VARCHAR) | `c` (CHAR) | Direct copy - validate enum values |
| `part` (VARCHAR) | `part` (TEXT) | Direct copy |
| `vp1` (VARCHAR) | `vp1` (NUMERIC) | Parse to numeric or NULL |
| `up1` (VARCHAR) | `up1` (TEXT) | Direct copy |
| `vp2` (VARCHAR) | `vp2` (NUMERIC) | Parse to numeric or NULL |
| `up2` (VARCHAR) | `up2` (TEXT) | Direct copy |
| `descr` (VARCHAR) | `desc` (TEXT) | Direct copy (rename) |
| `sup` (VARCHAR) | `sup` (UUID) | **Lookup/create supplier, get UUID** |
| `mfg` (VARCHAR) | `mfg` (UUID) | **Lookup/create manufacturer, get UUID** |
| `pn` (VARCHAR) | `pn` (TEXT) | Direct copy |
| `proj` (VARCHAR) | `proj` (TEXT) | Direct copy |
| `sec` (VARCHAR) | `sec` (TEXT) | Direct copy |
| `dwg` (VARCHAR) | `dwg` (TEXT) | Direct copy |
| `dwg_id` (VARCHAR) | `id_from_dwg` (TEXT) | Direct copy (rename) |
| `qty` (VARCHAR) | `qty` (INTEGER) | Parse to integer, default 0 |
| `spare` (VARCHAR) | `spare` (INTEGER) | Parse to integer, default 0 |
| `po` (VARCHAR) | `po` (TEXT) | Direct copy |
| `resp` (VARCHAR) | `re_sp` (TEXT) | Direct copy (rename) |
| `ord` (VARCHAR) | `ord` (DATE) | Parse date format |
| `wk` (VARCHAR) | `wk` (INTEGER) | Parse to integer or NULL |
| `s` (VARCHAR) | `s` (INTEGER) | Parse to integer 0-9, default 0 |
| `each` (VARCHAR) | `each` (NUMERIC) | Use `each_num` column |
| `each_num` (DECIMAL) | `each` (NUMERIC) | Direct copy |
| `d` (VARCHAR) | `d` (CHAR) | Direct copy - validate C/U |
| `d_date` (DATE) | - | Not mapped |
| `n` (VARCHAR) | `n` (TEXT) | Direct copy |
| `l` (VARCHAR) | `l` (TEXT) | Direct copy |
| `b` (VARCHAR) | `b` (BOOLEAN) | Parse to boolean |
| `who` (VARCHAR) | `w` (TEXT) | Direct copy (rename) |
| `upd` (VARCHAR) | `upd` (DATE) | Parse date format |
| `category_description` (VARCHAR) | - | Not mapped (derived from `c`) |
| - | `lc` (TEXT) | Not in source - NULL |
| - | `created_at` (TIMESTAMPTZ) | Auto-generated |
| - | `updated_at` (TIMESTAMPTZ) | Auto-generated |

---

## 3. Critical Transformations

### 3.1 Supplier & Manufacturer Resolution

**Challenge**: Source has TEXT names, target needs UUID foreign keys.

**Solution**:
1. Extract unique supplier names from `do_quantum_parts_list.sup`
2. For each unique supplier:
   - Check if exists in `suppliers` table by name
   - If not exists, INSERT new supplier with name
   - Create lookup map: `supplier_name → supplier_uuid`
3. Repeat for manufacturers
4. During import, use lookup maps to resolve UUIDs

### 3.2 Data Type Conversions

**Numeric Fields** (`vp1`, `vp2`, `qty`, `spare`, `wk`, `s`):
- Source: VARCHAR (may contain empty strings, nulls, or non-numeric values)
- Target: NUMERIC/INTEGER
- Logic: Try to parse, set to NULL or default if invalid

**Date Fields** (`ord`, `upd`):
- Source: VARCHAR (may have various formats)
- Target: DATE (YYYY-MM-DD format)
- Logic: Parse with flexible date parser, handle edge cases

**Boolean Fields** (`b`):
- Source: VARCHAR (may be "S", "1", "0", "", null)
- Target: BOOLEAN
- Logic: Map specific values to true/false

**Currency Fields** (`d`):
- Source: VARCHAR
- Target: CHAR(1) with CHECK constraint (C or U)
- Logic: Validate and default to 'C' if invalid

**Category** (`c`):
- Source: VARCHAR
- Target: CHAR(1) with CHECK constraint (m,e,t,s,p,c,v,x)
- Logic: Validate enum values, reject invalid rows

---

## 4. Data Quality Concerns

### 4.1 Potential Issues
- **Empty/null values**: Many fields in source may be empty strings vs NULL
- **Invalid numeric values**: Text fields may contain non-numeric data
- **Date format variations**: Dates may be in multiple formats or invalid
- **Missing required fields**: Source allows NULLs, target requires some fields
- **Duplicate part entries**: No unique constraint in source
- **Invalid enum values**: Category or currency codes outside valid ranges

### 4.2 Validation Strategy
1. **Pre-flight check**: Count total rows, check for required fields
2. **Dry run mode**: Process data without inserting, report issues
3. **Batch processing**: Import in batches with error tracking
4. **Error logging**: Track which rows fail and why
5. **Rollback capability**: Use transactions for safety

---

## 5. Import Strategy

### Phase 1: Prepare Reference Data
1. Extract unique suppliers from source → populate `suppliers` table
2. Extract unique manufacturers from source → populate `manufacturers` table
3. Create in-memory lookup maps for fast resolution

### Phase 2: Data Validation
1. Query `do_quantum_parts_list` with validation checks
2. Identify rows with data quality issues
3. Generate validation report
4. Decide on handling strategy (skip, fix, or manual review)

### Phase 3: Transform and Load
1. Read from `do_quantum_parts_list` in batches (e.g., 500 rows)
2. For each row:
   - Transform data types
   - Resolve supplier/manufacturer UUIDs
   - Validate constraints
   - Map columns to target schema
3. Insert batch into `parts` table
4. Log success/failure for each batch
5. Continue until all rows processed

### Phase 4: Verification
1. Compare row counts (source vs target)
2. Check for orphaned suppliers/manufacturers
3. Verify critical fields populated correctly
4. Sample random rows for manual QA
5. Check referential integrity

---

## 6. Implementation Files

### 6.1 Script Structure
```
scripts/
├── import-quantum-parts.ts          # Main import script
├── utils/
│   ├── data-transformers.ts         # Type conversion functions
│   ├── reference-data.ts            # Supplier/manufacturer setup
│   └── validators.ts                # Data validation logic
└── reports/
    └── import-report-[timestamp].json  # Import results
```

### 6.2 Script Features
- ✅ Read-only access to `do_quantum_parts_list`
- ✅ Automatic supplier/manufacturer creation
- ✅ Batch processing with error recovery
- ✅ Comprehensive logging
- ✅ Dry-run mode for testing
- ✅ Progress indicators
- ✅ Detailed error reporting
- ✅ Rollback on critical errors

---

## 7. Estimated Impact

### Data Volume
- Source rows: ~TBD (need to query)
- Expected success rate: 90-95% (some rows may need manual review)
- New suppliers: ~50-200 (estimate)
- New manufacturers: ~100-300 (estimate)

### Processing Time
- Phase 1 (reference data): ~1-2 minutes
- Phase 2 (validation): ~2-5 minutes
- Phase 3 (import): ~5-15 minutes (depends on row count)
- Phase 4 (verification): ~1-2 minutes
- **Total: ~10-25 minutes**

---

## 8. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data corruption | High | Use transactions, enable rollback |
| Duplicate data | Medium | Check for existing parts before insert |
| Invalid references | Medium | Validate supplier/manufacturer exists |
| Performance issues | Low | Batch processing, indexes already exist |
| Type conversion errors | Medium | Comprehensive error handling and logging |
| Partial import failure | Medium | Track progress, allow resume |

---

## 9. Success Criteria

✅ **Must Have**:
1. All valid rows from `do_quantum_parts_list` imported to `parts`
2. All suppliers and manufacturers properly created
3. Foreign key relationships maintained
4. No data loss or corruption
5. Import is repeatable and can be rolled back

✅ **Should Have**:
1. Detailed import report with statistics
2. Error log for failed rows
3. Data quality metrics
4. Validation summary

✅ **Nice to Have**:
1. Dashboard showing import progress
2. Automatic data cleaning suggestions
3. Pre-import data quality score

---

## 10. Next Steps

1. ✅ **Review this analysis** - Confirm approach with stakeholders
2. 🔨 **Build import script** - Implement transformation logic
3. 🧪 **Test with subset** - Validate with 100 rows first
4. 🚀 **Execute full import** - Process all data
5. ✔️ **Verify results** - Validate data integrity
6. 📊 **Generate report** - Document what was imported

---

## Appendix A: Sample SQL Queries

### Check source data volume
```sql
SELECT COUNT(*) as total_rows FROM do_quantum_parts_list;
```

### Unique suppliers
```sql
SELECT DISTINCT sup FROM do_quantum_parts_list 
WHERE sup IS NOT NULL AND sup != '' 
ORDER BY sup;
```

### Unique manufacturers
```sql
SELECT DISTINCT mfg FROM do_quantum_parts_list 
WHERE mfg IS NOT NULL AND mfg != '' 
ORDER BY mfg;
```

### Check category distribution
```sql
SELECT c, COUNT(*) as count 
FROM do_quantum_parts_list 
GROUP BY c 
ORDER BY count DESC;
```

### Validate required fields
```sql
SELECT COUNT(*) as missing_required
FROM do_quantum_parts_list
WHERE c IS NULL OR c = '' OR part IS NULL OR part = '';
```

---

**Document Version**: 1.0  
**Created**: October 14, 2025  
**Status**: Ready for Implementation


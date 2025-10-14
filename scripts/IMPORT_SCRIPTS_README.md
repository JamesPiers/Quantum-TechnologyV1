# Import Scripts - Documentation

This directory contains scripts for importing data from `do_quantum_parts_list` into the normalized `parts` table structure.

---

## 🎯 Quick Start

```bash
# Full import (production)
npm run import:quantum-parts

# Verify the import
npm run verify:import
```

---

## 📜 Available Scripts

### Core Import Scripts

#### 1. `import-quantum-parts.ts`
**Main import engine** - Imports data from `do_quantum_parts_list` to `parts` table.

**Features**:
- Automatic supplier/manufacturer creation
- Data type conversion and validation
- Category mapping and correction
- Batch processing (500 rows/batch)
- Progress tracking
- Comprehensive error handling
- Dry-run mode

**Usage**:
```bash
# Full import
npm run import:quantum-parts

# Dry-run (no changes)
npm run import:quantum-parts:dry-run

# Test with 100 rows
npm run import:quantum-parts:test
```

**What it does**:
1. Extracts unique suppliers and manufacturers from source
2. Creates missing suppliers/manufacturers in dictionary tables
3. Maps text names to UUIDs
4. Transforms data types (VARCHAR → numeric, date, boolean)
5. Validates and corrects categories
6. Filters out invalid supplier/manufacturer names
7. Inserts data in batches with progress tracking

**Skipped rows**:
- Parts with missing/empty `part` names
- Invalid data that can't be transformed

---

#### 2. `verify-import.ts`
**Verification utility** - Validates imported data and generates reports.

**Usage**:
```bash
npm run verify:import
```

**What it checks**:
- ✅ Row counts (source vs target)
- ✅ Import coverage percentage
- ✅ Supplier and manufacturer counts
- ✅ Category distribution
- ✅ Sample parts inspection
- ✅ Parts without suppliers/manufacturers
- ✅ NULL field validation
- ✅ Data integrity checks

**Output**:
- Detailed statistics
- Category breakdown with percentages
- Sample parts with full details
- Data quality metrics
- PASS/FAIL status

---

#### 3. `clear-test-data.ts`
**Cleanup utility** - Removes all data from parts, suppliers, and manufacturers tables.

⚠️ **WARNING**: This is destructive! Use with caution.

**Usage**:
```bash
npm run clear:test-data
```

**What it does**:
1. Shows current row counts
2. Deletes all parts (respects FK constraints)
3. Deletes all suppliers
4. Deletes all manufacturers
5. Verifies deletion
6. Confirms tables are empty

**When to use**:
- Before re-running a full import
- After test imports
- When resetting to clean state

---

## 🔄 Typical Workflow

### First Time Import
```bash
# 1. Test with dry-run first
npm run import:quantum-parts:dry-run

# 2. Run actual import
npm run import:quantum-parts

# 3. Verify results
npm run verify:import
```

### Re-importing Data
```bash
# 1. Clear existing data
npm run clear:test-data

# 2. Import again
npm run import:quantum-parts

# 3. Verify
npm run verify:import
```

### Testing Changes
```bash
# 1. Test with small batch
npm run import:quantum-parts:test

# 2. Verify
npm run verify:import

# 3. If good, clear and do full import
npm run clear:test-data
npm run import:quantum-parts
```

---

## 📊 Import Statistics (Last Run)

**Date**: October 14, 2025

| Metric | Value |
|--------|-------|
| Source rows | 20,695 |
| Imported | 20,081 (97.0%) |
| Skipped | 614 (3.0%) |
| Suppliers created | 4 |
| Manufacturers created | 191 |
| Errors | 0 |
| Import time | ~3 minutes |

---

## 🔍 Data Transformations

### Category Mapping
Invalid categories are automatically corrected:
- `y` → `x` (Nitrogen Liquefiers)
- `l` → `x` (Labour)
- `r` → `x` (Drawings)
- `P` → `p` (case fix)
- `X` → `x` (case fix)
- NULL/empty → `x` (default)

### Supplier/Manufacturer Filtering
Invalid names are filtered out:
- `???`, `.`, `0`, `2`, `900` (junk data)
- Pure numeric values
- Part number patterns (e.g., `3037T73`)
- Stock notes (e.g., `(check stock)`)

### Type Conversions
- **VARCHAR → NUMERIC**: `vp1`, `vp2`, `qty`, `spare`, `wk`, `s`, `each`
- **VARCHAR → DATE**: `ord`, `upd` (flexible format parsing)
- **VARCHAR → BOOLEAN**: `b` (maps various text values)
- **VARCHAR → CHAR(1)**: `c`, `d` (with validation)

### Column Mapping
| Source | Target | Notes |
|--------|--------|-------|
| `descr` | `desc` | Renamed |
| `dwg_id` | `id_from_dwg` | Renamed |
| `resp` | `re_sp` | Renamed |
| `who` | `w` | Renamed |
| `sup` (text) | `sup` (UUID) | FK lookup |
| `mfg` (text) | `mfg` (UUID) | FK lookup |
| `each_num` | `each` | Direct numeric copy |

---

## 🛠️ Technical Details

### Batch Processing
- **Batch size**: 500 rows per insert
- **Reason**: Prevents memory issues and provides progress tracking
- **Total batches**: ~42 batches for full dataset

### Error Handling
- Skips rows with missing required fields
- Logs all errors with row numbers
- Continues processing after errors
- Returns detailed error report

### Performance
- **Fetch phase**: ~30 seconds (20,695 rows in batches of 1000)
- **Transform phase**: ~10 seconds
- **Insert phase**: ~2 minutes (42 batches of 500 rows)
- **Total time**: ~3 minutes

### Memory Usage
- Efficient batch processing
- No loading entire dataset into memory
- Streams data in 1000-row chunks

---

## 🔐 Safety Features

### Read-Only Source
- `do_quantum_parts_list` is NEVER modified
- All reads are SELECT only
- Original data preserved

### Transaction Safety
- Uses Supabase service role key
- Proper error handling
- FK constraints enforced

### Validation
- Required fields checked
- Data types validated
- Enum values verified
- FK relationships confirmed

---

## 📝 Environment Requirements

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Note**: Service role key required (not anon key) to bypass RLS policies during import.

---

## 🐛 Troubleshooting

### Import Fails with "Missing Supabase credentials"
**Solution**: Check `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### "Table do_quantum_parts_list does not exist"
**Solution**: Run the MySQL migration first to create and populate this table

### Import is slow
**Normal**: Full import takes ~3 minutes for 20K rows. This is expected.

### Some rows are skipped
**Normal**: 614 rows are skipped due to missing part names (required field). This is expected and correct behavior.

### Suppliers/Manufacturers not created
**Check**: Source data may have invalid names. Script filters out junk data like "???", ".", numbers, etc.

### Foreign key errors
**Solution**: Run `npm run clear:test-data` first, then import again. This ensures clean state.

---

## 📚 Related Documentation

- **`IMPORT_SUMMARY.md`** - Executive summary of import results
- **`IMPORT_COMPLETE.md`** - Detailed technical results
- **`DATA_IMPORT_ANALYSIS.md`** - Analysis and planning documentation

---

## 🔄 Re-running Import

The import is **idempotent** when starting fresh:

```bash
# Clean slate
npm run clear:test-data

# Import
npm run import:quantum-parts
```

If you run import again without clearing, it will:
- Use existing suppliers/manufacturers (won't duplicate)
- Insert duplicate parts (no unique constraint to prevent this)

**Recommendation**: Always clear first for clean import.

---

## 🎯 Exit Codes

- **0**: Success
- **1**: Error (check console output for details)

---

## 📄 Script Outputs

### Console Output
- Progress bars and counters
- Success/error messages
- Statistics and summaries
- Validation results

### No File Output
Scripts output to console only. No log files created.

---

## ✨ Future Enhancements (Optional)

Potential improvements if needed:

1. **Incremental import** - Import only new/changed rows
2. **Duplicate detection** - Check for existing parts before insert
3. **Data enrichment** - Auto-populate missing fields from other sources
4. **Custom mappings** - Allow user-defined category/supplier mappings
5. **Resume capability** - Continue from last successful batch on failure
6. **Rollback** - Automatic rollback on critical errors

---

**Created**: October 14, 2025  
**Last Import**: October 14, 2025  
**Status**: Production Ready ✅

---

*For questions or issues, refer to the main documentation files or verify your environment setup.*


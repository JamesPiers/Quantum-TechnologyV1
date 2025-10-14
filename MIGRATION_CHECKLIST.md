# Migration Execution Checklist

Use this checklist to ensure you complete all steps of the migration successfully.

## Pre-Migration Checklist

- [ ] Read `MIGRATION_COMPLETE.md` for overview
- [ ] Review `MIGRATION_GUIDE.md` for detailed instructions
- [ ] Ensure Node.js 20+ is installed (`node --version`)
- [ ] Confirm you have Supabase account and project created

## Step 1: Environment Setup

- [ ] Create `.env.local` file in project root
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` from Supabase Dashboard
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Dashboard
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard ⚠️ (service_role, not anon!)
- [ ] Verify MySQL credentials are in `.env.local`:
  - [ ] `MYSQL_HOST`
  - [ ] `MYSQL_PORT`
  - [ ] `MYSQL_DATABASE`
  - [ ] `MYSQL_USER`
  - [ ] `MYSQL_PASSWORD`
- [ ] Confirm `.env.local` is in `.gitignore` (already done)

## Step 2: Verify Installation

- [ ] Run `npm install` to ensure dependencies are installed
- [ ] Verify `mysql2` is installed (`npm list mysql2`)
- [ ] Verify `dotenv` is installed (`npm list dotenv`)
- [ ] Verify `tsx` is installed (`npm list tsx`)

## Step 3: Test MySQL Connection

- [ ] Run `npm run test:mysql`
- [ ] Verify connection succeeds
- [ ] Note the number of tables found
- [ ] Note the row counts for each table
- [ ] Review sample data to ensure it's correct

**If test fails:**
- [ ] Check credentials in `.env.local`
- [ ] Verify IP is whitelisted in DigitalOcean
- [ ] Confirm MySQL server is running
- [ ] Review error messages for specific issues

## Step 4: Run Migration

- [ ] Run `npm run migrate:mysql`
- [ ] Watch console output for progress
- [ ] Note any error messages
- [ ] Verify SQL files are created in `migrations/` directory
- [ ] Check `migrations/mysql_to_supabase.sql` exists
- [ ] Review `migrations/mysql/` contains individual table files

**Expected output:**
- [ ] "Successfully connected to MySQL"
- [ ] "Found X tables"
- [ ] "Retrieved 100 rows from [table]" for each table
- [ ] "Generated combined migration file"
- [ ] "Migration preparation completed successfully"

## Step 5: Review Generated SQL

- [ ] Open `migrations/mysql_to_supabase.sql`
- [ ] Verify CREATE TABLE statements look correct
- [ ] Check data types are appropriate
- [ ] Ensure INSERT statements contain expected data
- [ ] Note any tables that might need manual adjustments

**What to check:**
- [ ] Table names have `azure_` prefix
- [ ] Column names are properly quoted
- [ ] Data types are PostgreSQL compatible
- [ ] Primary keys are defined
- [ ] NOT NULL constraints are present

## Step 6: Execute SQL in Supabase

- [ ] Go to Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Open a new query
- [ ] Copy entire contents of `migrations/mysql_to_supabase.sql`
- [ ] Paste into Supabase SQL Editor
- [ ] Review SQL one more time
- [ ] Click "Run" button
- [ ] Wait for execution to complete
- [ ] Check for any error messages

**If errors occur:**
- [ ] Note the specific error message
- [ ] Check if tables already exist (drop if needed)
- [ ] Verify service_role key is being used
- [ ] Review data type mismatches
- [ ] Check Supabase logs for details

## Step 7: Verify Data Migration

### Check Tables Created
- [ ] Run: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'azure_%';`
- [ ] Verify all expected tables are listed
- [ ] Note any missing tables

### Check Row Counts
For each table:
- [ ] Run: `SELECT COUNT(*) FROM azure_[tablename];`
- [ ] Verify count is ≤ 100 (as expected)
- [ ] Compare with original MySQL counts from test

### Sample Data Verification
- [ ] Run: `SELECT * FROM azure_[tablename] LIMIT 5;`
- [ ] Check data looks correct
- [ ] Verify no corruption or encoding issues
- [ ] Compare sample with MySQL original data

### Data Integrity Checks
- [ ] Check for NULL values where they shouldn't be
- [ ] Verify date/time formats are correct
- [ ] Test boolean values (true/false)
- [ ] Check numeric precision (decimals)
- [ ] Verify text encoding (special characters)

## Step 8: Post-Migration Enhancements

### Add Constraints
- [ ] Identify foreign key relationships
- [ ] Create foreign key constraints
- [ ] Add unique constraints where needed
- [ ] Add check constraints if applicable

**Example:**
```sql
ALTER TABLE azure_orders 
ADD CONSTRAINT fk_user 
FOREIGN KEY (user_id) REFERENCES azure_users(id);
```

### Create Indexes
- [ ] Identify frequently queried columns
- [ ] Create indexes on foreign keys
- [ ] Add indexes for search columns
- [ ] Create composite indexes if needed

**Example:**
```sql
CREATE INDEX idx_users_email ON azure_users(email);
CREATE INDEX idx_orders_user_id ON azure_orders(user_id);
```

### Set Up Row Level Security
- [ ] Enable RLS on each table
- [ ] Create read policies
- [ ] Create write policies
- [ ] Test policies with different users

**Example:**
```sql
ALTER TABLE azure_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON azure_users
FOR SELECT TO authenticated
USING (auth.uid() = id);
```

## Step 9: Application Testing

- [ ] Update application connection strings (if needed)
- [ ] Test SELECT queries from application
- [ ] Test INSERT operations
- [ ] Test UPDATE operations
- [ ] Test DELETE operations
- [ ] Verify relationships work correctly
- [ ] Test edge cases and boundary conditions
- [ ] Performance test with expected load

## Step 10: Documentation & Cleanup

### Update Documentation
- [ ] Document any manual changes made
- [ ] Note any differences from source schema
- [ ] Record any issues encountered
- [ ] Update team on migration completion

### Clean Up Test Data (When Ready)
- [ ] Backup `azure_*` tables before deletion
- [ ] Drop test tables: `DROP TABLE IF EXISTS azure_[tablename] CASCADE;`
- [ ] Remove migration files (optional)
- [ ] Archive `.env.local` securely

### Security Cleanup
- [ ] Rotate MySQL password
- [ ] Rotate Supabase service role key
- [ ] Remove `.env.local` from development machine (if done)
- [ ] Update password manager with new credentials

## Step 11: Production Migration (If Applicable)

If migrating to production:
- [ ] Schedule migration during off-peak hours
- [ ] Create database backups
- [ ] Test in staging environment first
- [ ] Prepare rollback plan
- [ ] Notify stakeholders of migration window
- [ ] Monitor error logs during migration
- [ ] Verify data integrity after migration
- [ ] Test application thoroughly
- [ ] Monitor performance for 24-48 hours

## Troubleshooting Reference

### Common Issues

**Connection Timeout:**
- Check firewall rules
- Verify IP whitelisting
- Test network connectivity

**Permission Denied:**
- Confirm service_role key is used
- Check RLS policies
- Verify user permissions

**Type Mismatch:**
- Review type mappings in `sql-generator.ts`
- Manually adjust SQL if needed
- Check data consistency in source

**Data Corruption:**
- Check character encoding
- Verify date/time formats
- Test with smaller dataset

## Success Criteria

Migration is successful when:
- [ ] ✅ All tables created in Supabase
- [ ] ✅ Row counts match expectations
- [ ] ✅ Sample data looks correct
- [ ] ✅ No errors in Supabase logs
- [ ] ✅ Application can query data
- [ ] ✅ Constraints are in place
- [ ] ✅ Indexes created for performance
- [ ] ✅ RLS policies configured
- [ ] ✅ Team is notified and trained

## Resources

- **Main Guide:** `MIGRATION_GUIDE.md`
- **Quick Start:** `MIGRATION_QUICKSTART.md`
- **Flow Diagram:** `MIGRATION_FLOW.md`
- **Technical Docs:** `scripts/README.md`
- **Supabase Docs:** https://supabase.com/docs

## Notes & Issues

Use this space to track any issues or notes during migration:

---

**Table:** _______________  
**Issue:** _________________________________  
**Resolution:** ____________________________  
**Date:** ______________

---

**Table:** _______________  
**Issue:** _________________________________  
**Resolution:** ____________________________  
**Date:** ______________

---

## Sign-Off

Migration completed by: ___________________  
Date: _______________  
Verified by: ___________________  
Date: _______________

---

*Keep this checklist for your records and future migrations*


# 🔄 MySQL to Supabase Data Migration

Complete solution for migrating data from a MySQL database (DigitalOcean) to Supabase PostgreSQL.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [What's Included](#-whats-included)
- [Prerequisites](#-prerequisites)
- [Setup Instructions](#-setup-instructions)
- [Running the Migration](#-running-the-migration)
- [Understanding the Output](#-understanding-the-output)
- [Troubleshooting](#-troubleshooting)
- [Security Best Practices](#-security-best-practices)

---

## 🚀 Quick Start

**TL;DR:** Three commands to migrate your data:

```bash
# 1. Create .env.local with your Supabase credentials
cp .env.migration.example .env.local
# (Edit .env.local with your actual credentials)

# 2. Test the connection
npm run test:mysql

# 3. Run the migration
npm run migrate:mysql
```

Then copy the generated SQL to Supabase SQL Editor and run it.

---

## 📦 What's Included

### Core Scripts

| File | Description |
|------|-------------|
| `scripts/mysql_to_supabase.ts` | Main migration script - connects, extracts, and generates SQL |
| `scripts/sql-generator.ts` | Utility for converting MySQL schema to PostgreSQL DDL |
| `scripts/test-mysql-connection.ts` | Connection test script - verify before migrating |
| `scripts/migrate.sh` | Complete workflow script (bash) |

### Documentation

| File | Description |
|------|-------------|
| `MIGRATION_SETUP.md` | **Start here** - Complete setup guide |
| `MIGRATION_QUICKSTART.md` | Quick reference guide |
| `scripts/README.md` | Detailed technical documentation |
| `.env.migration.example` | Environment variable template |

### Generated Files (after running migration)

```
migrations/
├── mysql_to_supabase.sql     # Combined SQL for all tables
└── mysql/                    # Individual table SQL files
    ├── azure_table1.sql
    ├── azure_table2.sql
    └── ...
```

---

## ✅ Prerequisites

### Required

- [x] Node.js 20+ installed
- [x] Access to MySQL database (DigitalOcean)
- [x] Supabase account with a project
- [x] Supabase service role key (not anon key!)

### MySQL Credentials (Provided)

```
Host: db-mysql-nyc3-90709-do-user-23044501-0.i.db.ondigitalocean.com
Port: 25060
Database: defaultdb
User: doadmin
Password: your_mysql_password_here
```

### You Need to Provide

- **Supabase URL** - From Dashboard → Settings → API
- **Supabase Service Role Key** - From Dashboard → Settings → API → service_role

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies

Already done! The following packages have been added to `package.json`:
- ✅ `mysql2` - MySQL client
- ✅ `dotenv` - Environment variables
- ✅ `tsx` - TypeScript execution

### Step 2: Configure Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ service_role, not anon!

# MySQL Configuration (already provided)
MYSQL_HOST=db-mysql-nyc3-90709-do-user-23044501-0.i.db.ondigitalocean.com
MYSQL_PORT=25060
MYSQL_DATABASE=defaultdb
MYSQL_USER=doadmin
MYSQL_PASSWORD=your_mysql_password_here
```

**Important:** Add `.env.local` to `.gitignore` (already done).

### Step 3: Verify Connection

Test your MySQL connection before running the full migration:

```bash
npm run test:mysql
```

Expected output:
```
✅ Successfully connected to MySQL!
📋 Available Tables:
   Found 5 tables:
   ✓ users                        (1500 rows)
   ✓ products                     (350 rows)
   ...
```

---

## 🏃 Running the Migration

### Option 1: Automated Workflow (Recommended)

Run the complete workflow script:

```bash
./scripts/migrate.sh
```

This will:
1. ✅ Check `.env.local` exists
2. ✅ Test MySQL connection
3. ✅ Run migration and generate SQL
4. ✅ Show next steps

### Option 2: Manual Steps

#### Step A: Run Migration Script

```bash
npm run migrate:mysql
```

This will:
- Connect to MySQL and extract data
- Generate SQL migration files in `migrations/`
- Attempt to insert data (if tables already exist)

#### Step B: Execute SQL in Supabase

1. Open `migrations/mysql_to_supabase.sql`
2. Go to **Supabase Dashboard** → **SQL Editor**
3. Copy the entire SQL content
4. Click **Run** to execute

#### Step C: Verify Data

```sql
-- List migrated tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'azure_%';

-- Check row counts
SELECT COUNT(*) FROM azure_users;

-- View sample data
SELECT * FROM azure_users LIMIT 10;
```

---

## 📊 Understanding the Output

### Console Output Explained

```
🚀 Starting MySQL to Supabase Migration
================================================================================
🔌 Connecting to MySQL database...
✅ Connected to MySQL successfully

📋 Fetching list of tables from MySQL...
✅ Found 5 tables: users, products, orders, inventory, settings

🔄 Gathering information from 5 tables...

================================================================================
📊 Processing table: users
================================================================================
  📐 Getting structure for table: users
  📦 Fetching 100 rows from users...
  ✅ Retrieved 100 rows from users

[... repeated for each table ...]

📝 Generating SQL migration files...
✅ Generated combined migration file: migrations/mysql_to_supabase.sql
✅ Generated 5 individual table migration files

📊 MIGRATION SUMMARY
================================================================================
✅ Successfully processed: 5 tables
❌ Failed to process: 0 tables
📦 Total rows extracted: 500
📄 Migration files created in: migrations/
================================================================================
```

### Generated SQL Structure

```sql
-- MySQL to Supabase Migration
-- Generated on: 2024-10-14T...

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Table: users (100 rows)
CREATE TABLE IF NOT EXISTS "azure_users" (
  "id" integer NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(100),
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- ============================================================================
-- DATA INSERTION
-- ============================================================================

-- Data for: users
INSERT INTO "azure_users" (id, email, name, created_at)
VALUES
  (1, 'user1@example.com', 'User One', '2024-01-01 10:00:00'),
  (2, 'user2@example.com', 'User Two', '2024-01-02 10:00:00'),
  ...
```

---

## 🎯 What Gets Migrated

### ✅ Migrated

- Table structure (columns, data types)
- Primary keys
- NOT NULL constraints
- Default values
- First 100 rows of data per table
- MySQL → PostgreSQL type conversion

### ❌ Not Migrated (Add Manually)

- Foreign key relationships
- Indexes (except primary keys)
- Triggers
- Views
- Stored procedures
- User-defined functions
- Row Level Security policies

---

## 🔍 Troubleshooting

### Connection Issues

**Problem:** `ETIMEDOUT` or `ECONNREFUSED`

**Solutions:**
- Check if your IP is whitelisted in DigitalOcean
- Verify MySQL server is running
- Test internet connection
- Try from a different network

**Test command:**
```bash
npm run test:mysql
```

### Supabase Issues

**Problem:** Cannot insert data or create tables

**Solutions:**
- Verify you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check that tables don't already exist
- Review Supabase logs in Dashboard → Logs

**Drop and recreate:**
```sql
DROP TABLE IF EXISTS azure_users CASCADE;
-- Then re-run the CREATE TABLE and INSERT statements
```

### Data Type Mismatches

**Problem:** Type conversion errors during insert

**Solutions:**
- Review the type mapping in `scripts/sql-generator.ts`
- Manually adjust the generated SQL
- Check for data inconsistencies in MySQL

**Common mappings:**
- MySQL `INT` → PostgreSQL `integer`
- MySQL `VARCHAR(n)` → PostgreSQL `varchar(n)`
- MySQL `DATETIME` → PostgreSQL `timestamp`
- MySQL `TEXT` → PostgreSQL `text`
- MySQL `TINYINT(1)` → PostgreSQL `boolean`

### Script Errors

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Test TypeScript execution
npx tsx --version
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

- ✅ **Do:** Store credentials in `.env.local`
- ❌ **Don't:** Commit `.env.local` to Git (already in `.gitignore`)
- ⚠️ **Warning:** Service role key bypasses all RLS policies

### 2. MySQL Access

- Use read-only credentials if possible
- Limit access to specific tables
- Whitelist only necessary IPs
- Enable SSL/TLS (already configured)

### 3. After Migration

- [ ] Rotate MySQL password
- [ ] Rotate Supabase service role key
- [ ] Review migrated data for sensitive information
- [ ] Set up Row Level Security policies
- [ ] Create appropriate indexes
- [ ] Test application access

### 4. Production Migration

If migrating to production:
- [ ] Run migration during off-peak hours
- [ ] Take database backups first
- [ ] Test in staging environment
- [ ] Have rollback plan ready
- [ ] Monitor for errors during migration
- [ ] Validate data integrity after migration

---

## 📚 Additional Resources

### Documentation Files

- **MIGRATION_SETUP.md** - Complete setup and configuration
- **MIGRATION_QUICKSTART.md** - Quick reference guide
- **scripts/README.md** - Technical documentation

### npm Scripts

```json
{
  "test:mysql": "Test MySQL connection",
  "migrate:mysql": "Run full migration",
  "dev": "Start Next.js dev server",
  "build": "Build for production"
}
```

### Useful SQL Queries

```sql
-- List all tables with row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE tablename LIKE 'azure_%'
ORDER BY n_live_tup DESC;

-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'azure_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'azure_users'
ORDER BY ordinal_position;
```

---

## 🎉 Next Steps After Migration

1. **Verify Data**
   - Check row counts match
   - Sample data looks correct
   - No data corruption

2. **Add Constraints**
   - Foreign keys
   - Unique constraints
   - Check constraints

3. **Create Indexes**
   - On frequently queried columns
   - On foreign key columns

4. **Set Up RLS**
   - Enable Row Level Security
   - Create appropriate policies

5. **Test Application**
   - Update connection strings
   - Test CRUD operations
   - Verify business logic

6. **Clean Up**
   - Drop `azure_*` test tables
   - Remove migration files
   - Update documentation

---

## 💡 Tips & Tricks

### Migrating Specific Tables

Edit `scripts/mysql_to_supabase.ts` and filter tables:

```typescript
const tables = await getMySQLTables(mysqlConnection)
const filteredTables = tables.filter(t => ['users', 'orders'].includes(t))
```

### Changing Row Limit

Edit the `CONFIG` object in `scripts/mysql_to_supabase.ts`:

```typescript
const CONFIG = {
  // ... other config
  rowLimit: 500, // Change from 100 to 500
}
```

### Custom Table Prefix

```typescript
const CONFIG = {
  // ... other config
  tablePrefix: 'mysql_', // Change from 'azure_' to 'mysql_'
}
```

### Batch Processing

For large tables, consider processing in batches:

```typescript
// Modify the script to use OFFSET
for (let i = 0; i < totalRows; i += 100) {
  const rows = await connection.query(
    `SELECT * FROM ${table} LIMIT 100 OFFSET ${i}`
  )
  // Process batch...
}
```

---

## 📞 Support

**Issues or questions?**

1. Check the troubleshooting section above
2. Review the detailed documentation in `scripts/README.md`
3. Check Supabase logs: Dashboard → Logs
4. Review MySQL error logs

---

**Ready to migrate?** Start with `npm run test:mysql` to verify your connection! 🚀


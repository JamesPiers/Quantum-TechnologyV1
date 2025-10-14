# MySQL to Supabase Migration - Setup Complete ✅

## What Has Been Created

### 1. Main Migration Script
**File:** `scripts/mysql_to_supabase.ts`
- Connects to MySQL database (DigitalOcean)
- Extracts first 100 rows from each table
- Maps MySQL data types to PostgreSQL
- Generates SQL migration files
- Attempts to insert data into Supabase

### 2. SQL Generator Utility
**File:** `scripts/sql-generator.ts`
- Converts MySQL schema to PostgreSQL DDL
- Generates CREATE TABLE statements
- Generates INSERT statements
- Creates individual and combined migration files

### 3. Documentation
**Files:**
- `scripts/README.md` - Comprehensive documentation
- `MIGRATION_QUICKSTART.md` - Quick start guide
- `.env.migration.example` - Environment variable template

### 4. Package Configuration
**Updated:** `package.json`
- Added `mysql2` for MySQL connectivity
- Added `dotenv` for environment variable management
- Added `tsx` for TypeScript execution
- Added npm script: `npm run migrate:mysql`

## How to Run the Migration

### Step 1: Set Up Environment Variables

Create a `.env.local` file in the project root with your credentials:

```env
# Supabase credentials (get from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ This is the service_role key!

# MySQL credentials (already provided by you)
MYSQL_HOST=db-mysql-nyc3-90709-do-user-23044501-0.i.db.ondigitalocean.com
MYSQL_PORT=25060
MYSQL_DATABASE=defaultdb
MYSQL_USER=doadmin
MYSQL_PASSWORD=your_mysql_password_here
```

### Step 2: Run the Migration

```bash
npm run migrate:mysql
```

This will:
1. Connect to your MySQL database
2. Discover all tables
3. Extract the first 100 rows from each
4. Generate SQL files in `migrations/` directory
5. Attempt to insert data into Supabase (if tables exist)

### Step 3: Execute SQL in Supabase

1. Open the generated file: `migrations/mysql_to_supabase.sql`
2. Go to **Supabase Dashboard** → **SQL Editor**
3. Copy and paste the SQL content
4. Click **Run** to create tables and insert data

## What Gets Migrated

### ✅ Migrated
- Table structure (columns, data types, constraints)
- Primary keys
- First 100 rows of data from each table
- NOT NULL constraints
- Default values

### ❌ Not Migrated (Add Manually)
- Foreign key relationships
- Indexes (except primary keys)
- Triggers
- Views
- Stored procedures
- Row Level Security policies

## Table Naming

All tables are prefixed with `azure_` to separate them from production tables:

| Source (MySQL) | Destination (Supabase) |
|----------------|------------------------|
| `users` | `azure_users` |
| `products` | `azure_products` |
| `orders` | `azure_orders` |

## Security Notes ⚠️

1. **Never commit `.env.local`** - It contains sensitive credentials
2. **The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies** - Use carefully
3. **Rotate credentials after migration** - Change passwords when done testing
4. **Review migrated data** - Verify integrity before production use

## File Structure

```
quantum-instructions/
├── scripts/
│   ├── mysql_to_supabase.ts      # Main migration script
│   ├── sql-generator.ts           # SQL generation utilities
│   └── README.md                  # Detailed documentation
├── migrations/                    # Generated SQL files (created on first run)
│   ├── mysql_to_supabase.sql      # Combined migration
│   └── mysql/                     # Individual table files
│       ├── azure_table1.sql
│       └── azure_table2.sql
├── .env.local                     # Your credentials (you need to create this)
├── .env.migration.example         # Template for environment variables
└── MIGRATION_QUICKSTART.md        # Quick start guide
```

## Troubleshooting

### Can't connect to MySQL?
- Check if your IP is whitelisted in DigitalOcean
- Verify MySQL server is running
- Confirm credentials are correct

### Can't insert into Supabase?
- Ensure you're using the `service_role` key, not `anon` key
- Create tables first using the generated SQL
- Check Supabase logs for detailed errors

### Data type errors?
- Review the type mapping in `scripts/sql-generator.ts`
- Manually adjust the generated SQL if needed
- Check for inconsistent data in source tables

## Next Steps After Migration

1. **Verify data integrity**
   ```sql
   SELECT COUNT(*) FROM azure_users;
   SELECT * FROM azure_users LIMIT 10;
   ```

2. **Add missing constraints**
   ```sql
   -- Example: Add foreign key
   ALTER TABLE azure_orders 
   ADD CONSTRAINT fk_user 
   FOREIGN KEY (user_id) REFERENCES azure_users(id);
   ```

3. **Create indexes**
   ```sql
   CREATE INDEX idx_users_email ON azure_users(email);
   ```

4. **Set up Row Level Security**
   ```sql
   ALTER TABLE azure_users ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can read own data" ON azure_users
   FOR SELECT TO authenticated
   USING (auth.uid() = id);
   ```

5. **Test thoroughly** before using in production

6. **Clean up** test tables when done
   ```sql
   DROP TABLE IF EXISTS azure_users CASCADE;
   ```

## Support

- **Detailed docs:** See `scripts/README.md`
- **Quick start:** See `MIGRATION_QUICKSTART.md`
- **Environment setup:** See `.env.migration.example`

---

## Ready to Start? 🚀

1. Create your `.env.local` file with Supabase credentials
2. Run: `npm run migrate:mysql`
3. Copy the generated SQL to Supabase SQL Editor
4. Verify your data

**Need help?** Check the detailed documentation in `scripts/README.md`


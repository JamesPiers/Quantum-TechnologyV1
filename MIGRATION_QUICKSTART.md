# Quick Start Guide: MySQL to Supabase Migration

This guide will help you quickly migrate data from your MySQL database to Supabase.

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `mysql2` - MySQL database client
- `dotenv` - Environment variable management
- `tsx` - TypeScript execution engine

## Step 2: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.migration.example .env.local
```

Then edit `.env.local` with your actual credentials:

```env
# Supabase (from your Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ This is the service_role key!

# MySQL (DigitalOcean - already provided)
MYSQL_HOST=db-mysql-nyc3-90709-do-user-23044501-0.i.db.ondigitalocean.com
MYSQL_PORT=25060
MYSQL_DATABASE=defaultdb
MYSQL_USER=doadmin
MYSQL_PASSWORD=your_mysql_password_here
```

## Step 3: Run the Migration Script

```bash
npm run migrate:mysql
```

This will:
1. ✅ Connect to your MySQL database
2. ✅ Extract the first 100 rows from each table
3. ✅ Generate SQL migration files in `migrations/`
4. ✅ Attempt to insert data into Supabase (if tables exist)

## Step 4: Create Tables in Supabase

After running the script, you'll see:

```
📄 Migration files created in: migrations/
```

### Option A: Use the Combined Migration File

1. Open `migrations/mysql_to_supabase.sql`
2. Go to **Supabase Dashboard** → **SQL Editor**
3. Copy the entire SQL content
4. Click **Run** to execute

### Option B: Use Individual Table Files

The script also creates individual files in `migrations/mysql/` for each table:
- `migrations/mysql/azure_users.sql`
- `migrations/mysql/azure_products.sql`
- etc.

You can run these one at a time if you prefer.

## Step 5: Verify the Migration

In Supabase SQL Editor, run:

```sql
-- List all tables with 'azure_' prefix
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'azure_%';

-- Count rows in a specific table
SELECT COUNT(*) FROM azure_users;

-- View sample data
SELECT * FROM azure_users LIMIT 10;
```

## Step 6: Set Up Row Level Security (Optional)

If you want to protect these tables:

```sql
-- Enable RLS on a table
ALTER TABLE azure_users ENABLE ROW LEVEL SECURITY;

-- Create a policy (example: allow all authenticated users to read)
CREATE POLICY "Allow authenticated read access" 
ON azure_users 
FOR SELECT 
TO authenticated 
USING (true);
```

## Troubleshooting

### ❌ "Cannot connect to MySQL"

**Check:**
- Is your IP whitelisted in DigitalOcean?
- Are the credentials correct?
- Is the MySQL server running?

### ❌ "Table already exists"

If you need to re-run the migration:

```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS azure_users CASCADE;
DROP TABLE IF EXISTS azure_products CASCADE;
-- etc...
```

### ❌ "Permission denied for table"

**Solution:** Make sure you're using the `SUPABASE_SERVICE_ROLE_KEY`, not the anon key.

### ❌ "SSL connection error"

The script is configured for DigitalOcean's SSL requirements. If you still get errors, verify that the MySQL server has SSL enabled.

## What Gets Migrated?

- ✅ Table structure (columns, types, constraints)
- ✅ Primary keys
- ✅ First 100 rows of data
- ✅ Default values
- ✅ NOT NULL constraints

**Not migrated:**
- ❌ Foreign keys (need to be added manually)
- ❌ Indexes (except primary key)
- ❌ Triggers
- ❌ Views
- ❌ Stored procedures

## Table Naming Convention

All migrated tables are prefixed with `azure_`:

| MySQL Table | Supabase Table |
|-------------|----------------|
| `users` | `azure_users` |
| `products` | `azure_products` |
| `orders` | `azure_orders` |

**Why the prefix?** This keeps your testing data separate from production tables.

## Next Steps

1. **Test the migrated data** - Query and verify accuracy
2. **Add missing constraints** - Foreign keys, unique constraints, indexes
3. **Set up RLS policies** - Protect your data
4. **Migrate to production tables** - Once validated, move from `azure_*` to your actual table names
5. **Clean up** - Drop the `azure_*` tables when done

## File Structure

```
quantum-instructions/
├── scripts/
│   ├── mysql_to_supabase.ts      # Main migration script
│   ├── sql-generator.ts           # SQL generation utilities
│   └── README.md                  # Detailed documentation
├── migrations/
│   ├── mysql_to_supabase.sql      # Combined migration file
│   └── mysql/                     # Individual table files
│       ├── azure_users.sql
│       ├── azure_products.sql
│       └── ...
├── .env.local                     # Your credentials (DO NOT COMMIT)
└── .env.migration.example         # Template for .env.local
```

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Review the generated SQL files for syntax errors
3. Verify credentials in `.env.local`
4. Check Supabase logs in the Dashboard

---

**Ready to migrate?** Run `npm run migrate:mysql` to get started! 🚀


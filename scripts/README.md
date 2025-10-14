# MySQL to Supabase Migration Script

This script transfers data from a MySQL database (hosted on DigitalOcean) to Supabase PostgreSQL.

## Overview

The script will:
1. Connect to your MySQL database
2. Discover all tables in the database
3. For each table:
   - Fetch the first 100 rows
   - Analyze the table structure (columns, types, constraints)
   - Create a corresponding table in Supabase with the prefix `azure_`
   - Map MySQL data types to PostgreSQL equivalents
   - Insert the data into Supabase

## Prerequisites

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `mysql2` - MySQL client for Node.js
- `dotenv` - Environment variable management
- `tsx` - TypeScript execution engine
- `@supabase/supabase-js` - Supabase client (already installed)

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# MySQL Database Configuration
MYSQL_HOST=db-mysql-nyc3-90709-do-user-23044501-0.i.db.ondigitalocean.com
MYSQL_PORT=25060
MYSQL_DATABASE=defaultdb
MYSQL_USER=doadmin
MYSQL_PASSWORD=your_mysql_password_here
```

**⚠️ Security Note:** Never commit the `.env.local` file to version control. It contains sensitive credentials.

### 3. Get Your Supabase Service Role Key

The service role key is needed to create tables and bypass RLS (Row Level Security) policies.

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Add it to your `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`

## Usage

### Run the Migration Script

```bash
npm run migrate:mysql
```

Or directly with tsx:

```bash
npx tsx scripts/mysql_to_supabase.ts
```

### What Happens During Migration

1. **Connection Phase**
   - Connects to MySQL database using SSL
   - Validates Supabase credentials
   - Lists all tables in the MySQL database

2. **Table Discovery Phase**
   - For each table, the script will:
     - Fetch table structure (columns, types, nullability, defaults)
     - Retrieve the first 100 rows

3. **Table Creation Phase**
   - Maps MySQL data types to PostgreSQL equivalents
   - Generates CREATE TABLE statements
   - **Note:** Automatic table creation requires direct PostgreSQL access
   - The script will output the SQL statements you need to run in Supabase SQL Editor

4. **Data Insertion Phase**
   - Processes data to ensure compatibility (dates, binary data, etc.)
   - Inserts data in batches of 100 rows
   - Reports progress and any errors

### Example Output

```
🚀 Starting MySQL to Supabase Migration
================================================================================
🔌 Connecting to MySQL database...
✅ Connected to MySQL successfully

📋 Fetching list of tables from MySQL...
✅ Found 5 tables: users, products, orders, customers, inventory

🔌 Connecting to Supabase...
✅ Connected to Supabase

🔄 Starting migration of 5 tables...

================================================================================
📊 Processing table: users
================================================================================
  📐 Getting structure for table: users
  📦 Fetching 100 rows from users...
  ✅ Retrieved 100 rows from users

🏗️  Creating table: azure_users
  📝 Please run the following SQL in your Supabase SQL editor:
  ======================================================================
  CREATE TABLE IF NOT EXISTS "azure_users" (
    "id" integer NOT NULL,
    "email" varchar(255) NOT NULL,
    "name" varchar(100),
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
  );
  ======================================================================

📥 Inserting data into: azure_users
  ✅ Inserted batch 1 (100 rows)
  ✅ Total inserted: 100 / 100 rows

[... more tables ...]

================================================================================
📊 MIGRATION SUMMARY
================================================================================
✅ Successfully migrated: 5 tables
❌ Failed migrations: 0 tables
📦 Total rows transferred: 500
================================================================================

🎉 Migration completed successfully!

👋 MySQL connection closed
```

## Manual Table Creation (Required)

Due to Supabase's security model, tables cannot be created programmatically via the service role key. You'll need to:

1. Run the migration script to get the SQL statements
2. Copy each `CREATE TABLE` statement from the output
3. Go to Supabase Dashboard → SQL Editor
4. Paste and run each statement
5. Re-run the migration script to insert the data

**Tip:** You can create all tables at once by combining all CREATE TABLE statements in the SQL Editor.

## Data Type Mapping

The script automatically maps MySQL types to PostgreSQL equivalents:

| MySQL Type | PostgreSQL Type |
|------------|-----------------|
| `TINYINT(1)`, `BOOLEAN` | `boolean` |
| `TINYINT` | `smallint` |
| `SMALLINT` | `smallint` |
| `MEDIUMINT`, `INT` | `integer` |
| `BIGINT` | `bigint` |
| `DECIMAL(p,s)` | `numeric(p,s)` |
| `FLOAT` | `real` |
| `DOUBLE` | `double precision` |
| `VARCHAR(n)`, `CHAR(n)` | `varchar(n)` |
| `TEXT`, `MEDIUMTEXT`, `LONGTEXT` | `text` |
| `BLOB`, `BINARY` | `bytea` |
| `DATETIME`, `TIMESTAMP` | `timestamp` |
| `DATE` | `date` |
| `TIME` | `time` |
| `JSON` | `jsonb` |
| `ENUM`, `SET` | `text` |

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to MySQL
```
❌ Failed to connect to MySQL: connect ETIMEDOUT
```

**Solution:**
- Check your firewall rules
- Verify the MySQL host and port are correct
- Ensure your IP is whitelisted on DigitalOcean
- Confirm SSL is enabled on the MySQL server

### Supabase Issues

**Problem:** Cannot insert data
```
❌ Error inserting batch 1: permission denied for table azure_users
```

**Solution:**
- Verify you're using the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)
- Check that the table exists in Supabase
- Ensure RLS policies allow inserts (service role bypasses RLS by default)

### Data Type Issues

**Problem:** Data type mismatch during insert
```
❌ Error: invalid input syntax for type integer: "abc"
```

**Solution:**
- Check the source data for inconsistencies
- Review the type mapping in the script
- Manually adjust the CREATE TABLE statement if needed

## Configuration Options

You can modify the behavior by editing the `CONFIG` object in the script:

```typescript
const CONFIG = {
  tablePrefix: 'azure_',    // Change the prefix for migrated tables
  rowLimit: 100,            // Change the number of rows to migrate
  // ... other options
}
```

## Security Best Practices

1. **Never commit credentials** - Use `.env.local` and add it to `.gitignore`
2. **Rotate keys after migration** - Change MySQL and Supabase passwords after testing
3. **Use read-only MySQL user** - Create a dedicated user with SELECT-only permissions
4. **Limit Supabase service role usage** - Only use the service role key for migrations
5. **Review migrated data** - Check data integrity before using in production

## Next Steps

After successful migration:

1. **Verify Data Integrity**
   ```sql
   -- In Supabase SQL Editor
   SELECT COUNT(*) FROM azure_users;
   SELECT * FROM azure_users LIMIT 10;
   ```

2. **Set Up Row Level Security (RLS)**
   - Navigate to Supabase Dashboard → Authentication → Policies
   - Create appropriate RLS policies for each table

3. **Create Indexes**
   - Identify frequently queried columns
   - Add indexes to improve performance

4. **Migrate to Production Tables**
   - Once testing is complete, migrate from `azure_*` tables to your production tables
   - Update your application to use the new table structure

5. **Clean Up**
   - Remove test tables: `DROP TABLE IF EXISTS azure_users CASCADE;`
   - Revoke temporary credentials

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify your environment variables are correct
3. Ensure both databases are accessible from your network
4. Review the Supabase logs in the dashboard

## License

This script is part of the Quantum Instructions project.


# Migration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        MySQL to Supabase Migration                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│  1. PREPARATION    │
├────────────────────┤
│ • Create .env.local│
│ • Add credentials  │
│ • npm install      │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│  2. TEST           │
├────────────────────┤
│ npm run test:mysql │
│                    │
│ Verifies:          │
│ ✓ Connection OK    │
│ ✓ Lists tables     │
│ ✓ Shows row counts │
└──────┬─────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  3. EXTRACT DATA                                │
├─────────────────────────────────────────────────┤
│ npm run migrate:mysql                           │
│                                                 │
│ For each table:                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ MySQL Database (DigitalOcean)            │   │
│ │                                          │   │
│ │  ┌─────────┐   ┌──────────┐   ┌──────┐ │   │
│ │  │ users   │   │ products │   │ ...  │ │   │
│ │  │ 1500    │   │ 350      │   │      │ │   │
│ │  │ rows    │   │ rows     │   │      │ │   │
│ │  └─────────┘   └──────────┘   └──────┘ │   │
│ └──────────────────────────────────────────┘   │
│                    │                            │
│                    ▼                            │
│         Extract first 100 rows                  │
│         + table structure                       │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  4. GENERATE SQL                                │
├─────────────────────────────────────────────────┤
│ scripts/sql-generator.ts                        │
│                                                 │
│ Converts:                                       │
│ MySQL Type      →  PostgreSQL Type              │
│ ─────────────────────────────────────           │
│ INT             →  integer                      │
│ VARCHAR(255)    →  varchar(255)                 │
│ DATETIME        →  timestamp                    │
│ TEXT            →  text                         │
│ TINYINT(1)      →  boolean                      │
│                                                 │
│ Creates:                                        │
│ • CREATE TABLE statements                       │
│ • INSERT statements                             │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  5. OUTPUT FILES                                │
├─────────────────────────────────────────────────┤
│ migrations/                                     │
│ ├── mysql_to_supabase.sql (combined)           │
│ └── mysql/                                      │
│     ├── azure_users.sql                         │
│     ├── azure_products.sql                      │
│     └── azure_orders.sql                        │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  6. MANUAL STEP: EXECUTE SQL                    │
├─────────────────────────────────────────────────┤
│ 1. Open: migrations/mysql_to_supabase.sql      │
│ 2. Go to: Supabase Dashboard → SQL Editor      │
│ 3. Copy & Paste SQL                             │
│ 4. Click "Run"                                  │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  7. RESULT: SUPABASE DATABASE                   │
├─────────────────────────────────────────────────┤
│ Supabase PostgreSQL                             │
│                                                 │
│  ┌──────────────┐  ┌────────────────┐          │
│  │ azure_users  │  │ azure_products │          │
│  │ 100 rows     │  │ 100 rows       │          │
│  └──────────────┘  └────────────────┘          │
│                                                 │
│  ┌────────────────┐                             │
│  │ azure_orders   │                             │
│  │ 100 rows       │                             │
│  └────────────────┘                             │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  8. VERIFY & ENHANCE                            │
├─────────────────────────────────────────────────┤
│ ✓ Check row counts                              │
│ ✓ Verify data integrity                         │
│ ✓ Add foreign keys                              │
│ ✓ Create indexes                                │
│ ✓ Set up RLS policies                           │
│ ✓ Test application access                       │
└─────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════

KEY FEATURES:

✅ Automatic MySQL → PostgreSQL type conversion
✅ Handles SSL connections to DigitalOcean
✅ Generates ready-to-run SQL files
✅ Safe: Only reads from MySQL (no writes)
✅ Prefixed tables (azure_*) for easy testing
✅ Comprehensive error handling and logging
✅ Connection test before migration
✅ Individual and combined SQL outputs

═══════════════════════════════════════════════════════════════════════════════

SECURITY NOTES:

⚠️  Service role key bypasses Row Level Security
🔒 Never commit .env.local to version control
🔑 Rotate keys after migration testing
🛡️  Set up RLS policies after data import
🔐 Use read-only MySQL credentials if possible

═══════════════════════════════════════════════════════════════════════════════

COMMANDS QUICK REFERENCE:

Test connection:     npm run test:mysql
Run migration:       npm run migrate:mysql
Complete workflow:   ./scripts/migrate.sh

═══════════════════════════════════════════════════════════════════════════════
```

## File Structure Overview

```
quantum-instructions/
│
├── 📄 Configuration
│   ├── .env.local (you create this)
│   ├── .env.migration.example (template)
│   └── package.json (updated with dependencies)
│
├── 📜 Scripts
│   ├── scripts/
│   │   ├── mysql_to_supabase.ts       Main migration logic
│   │   ├── sql-generator.ts            SQL generation utilities
│   │   ├── test-mysql-connection.ts    Connection tester
│   │   ├── migrate.sh                  Automated workflow
│   │   └── README.md                   Technical docs
│
├── 📚 Documentation
│   ├── MIGRATION_GUIDE.md              Complete guide (you are here)
│   ├── MIGRATION_SETUP.md              Setup instructions
│   ├── MIGRATION_QUICKSTART.md         Quick reference
│   └── MIGRATION_FLOW.md               This diagram
│
└── 📦 Generated Output (after running migration)
    └── migrations/
        ├── mysql_to_supabase.sql       Combined SQL
        └── mysql/
            ├── azure_table1.sql        Individual files
            ├── azure_table2.sql
            └── ...
```

## Data Flow Details

### Phase 1: Connect to MySQL
```
Your Machine → SSL/TLS → DigitalOcean MySQL
              (port 25060)
```

### Phase 2: Extract Schema & Data
```
For each table:
  1. DESCRIBE table_name        → Get columns & types
  2. SELECT * LIMIT 100         → Get first 100 rows
  3. Store in memory            → Process in script
```

### Phase 3: Type Conversion
```
MySQL                 →    PostgreSQL
────────────────────────────────────────
INT                   →    integer
BIGINT                →    bigint
VARCHAR(n)            →    varchar(n)
TEXT                  →    text
DATETIME/TIMESTAMP    →    timestamp
DATE                  →    date
DECIMAL(p,s)          →    numeric(p,s)
TINYINT(1)            →    boolean
BLOB/BINARY           →    bytea
JSON                  →    jsonb
```

### Phase 4: Generate SQL
```
CREATE TABLE "azure_tablename" (
  "column1" datatype constraints,
  "column2" datatype constraints,
  PRIMARY KEY (...)
);

INSERT INTO "azure_tablename" VALUES
  (value1, value2, ...),
  (value1, value2, ...),
  ...
```

### Phase 5: Manual Execution
```
User copies SQL
     ↓
Supabase SQL Editor
     ↓
PostgreSQL executes
     ↓
Tables created & populated
```

## Comparison: Before vs After

### Before Migration
```
┌──────────────────────────┐
│  DigitalOcean MySQL      │
│                          │
│  • Production data       │
│  • Multiple tables       │
│  • Thousands of rows     │
│  • MySQL-specific types  │
└──────────────────────────┘
```

### After Migration
```
┌──────────────────────────┐    ┌──────────────────────────┐
│  DigitalOcean MySQL      │    │  Supabase PostgreSQL     │
│                          │    │                          │
│  • Production data       │    │  • Test data (100 rows)  │
│  • Multiple tables       │    │  • azure_* tables        │
│  • Thousands of rows     │    │  • PostgreSQL types      │
│  • MySQL-specific types  │    │  • Ready for testing     │
└──────────────────────────┘    └──────────────────────────┘
         (Unchanged)                      (New!)
```

## Timeline Estimate

| Step | Time | Notes |
|------|------|-------|
| Setup `.env.local` | 2 min | Copy credentials |
| Test connection | 1 min | `npm run test:mysql` |
| Run migration | 2-5 min | Depends on table count |
| Review SQL | 5 min | Check generated files |
| Execute in Supabase | 1 min | Copy & paste |
| Verify data | 5 min | Query and check |
| **Total** | **15-20 min** | For 5-10 tables |

---

**Ready to visualize your migration?** Follow the flow from top to bottom! 🎯


/**
 * MySQL to Supabase Migration Script
 * 
 * This script transfers the first 100 rows from each table in a MySQL database
 * to corresponding tables in Supabase PostgreSQL with an "azure_" prefix.
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install mysql2 dotenv
 * 2. Set up environment variables in .env file
 * 3. Ensure you have SUPABASE_SERVICE_ROLE_KEY for admin operations
 * 
 * Usage:
 * npx tsx scripts/mysql_to_supabase.ts
 * 
 * OR compile and run:
 * npx tsc scripts/mysql_to_supabase.ts --esModuleInterop --resolveJsonModule
 * node scripts/mysql_to_supabase.js
 */

import * as mysql from 'mysql2/promise'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { 
  generateMigrationFile, 
  generateTableMigrationFiles 
} from './sql-generator'

// Load environment variables
config()

// ============================================================================
// Configuration
// ============================================================================

interface MigrationConfig {
  mysql: {
    host: string
    port: number
    database: string
    user: string
    password: string
    ssl: {
      rejectUnauthorized: boolean
    }
  }
  supabase: {
    url: string
    serviceRoleKey: string
  }
  tablePrefix: string
  rowLimit: number
}

// Read configuration from environment variables
const CONFIG: MigrationConfig = {
  mysql: {
    host: process.env.MYSQL_HOST || '',
    port: parseInt(process.env.MYSQL_PORT || '25060', 10),
    database: process.env.MYSQL_DATABASE || 'defaultdb',
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    ssl: {
      rejectUnauthorized: false, // Required for DigitalOcean MySQL
    },
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  tablePrefix: 'azure_', // Prefix for migrated tables
  rowLimit: 100, // Number of rows to migrate per table
}

// ============================================================================
// Type Definitions
// ============================================================================

interface ColumnInfo {
  Field: string
  Type: string
  Null: string
  Key: string
  Default: any
  Extra: string
}

interface TableInfo {
  tableName: string
  columns: ColumnInfo[]
  rows: any[]
}

// ============================================================================
// MySQL Type to PostgreSQL Type Mapping
// ============================================================================

function mysqlTypeToPostgresType(mysqlType: string): string {
  const type = mysqlType.toLowerCase()

  // Integer types
  if (type.includes('tinyint(1)') || type.includes('boolean')) return 'boolean'
  if (type.includes('tinyint')) return 'smallint'
  if (type.includes('smallint')) return 'smallint'
  if (type.includes('mediumint')) return 'integer'
  if (type.includes('bigint')) return 'bigint'
  if (type.includes('int')) return 'integer'

  // Decimal/Float types
  if (type.includes('decimal') || type.includes('numeric')) {
    const match = type.match(/decimal\((\d+),\s*(\d+)\)/)
    if (match) return `numeric(${match[1]},${match[2]})`
    return 'numeric'
  }
  if (type.includes('float')) return 'real'
  if (type.includes('double')) return 'double precision'

  // String types
  if (type.includes('char') || type.includes('varchar')) {
    const match = type.match(/\((\d+)\)/)
    if (match) return `varchar(${match[1]})`
    return 'varchar(255)'
  }
  if (type.includes('tinytext') || type.includes('text')) return 'text'
  if (type.includes('mediumtext') || type.includes('longtext')) return 'text'

  // Binary types
  if (type.includes('blob') || type.includes('binary')) return 'bytea'

  // Date/Time types
  if (type.includes('datetime') || type.includes('timestamp')) return 'timestamp'
  if (type.includes('date')) return 'date'
  if (type.includes('time')) return 'time'
  if (type.includes('year')) return 'integer'

  // JSON type
  if (type.includes('json')) return 'jsonb'

  // Enum/Set - convert to text
  if (type.includes('enum') || type.includes('set')) return 'text'

  // Default fallback
  console.warn(`⚠️  Unknown MySQL type: ${mysqlType}, defaulting to text`)
  return 'text'
}

// ============================================================================
// MySQL Connection and Query Functions
// ============================================================================

async function connectToMySQL(): Promise<mysql.Connection> {
  console.log('🔌 Connecting to MySQL database...')
  try {
    const connection = await mysql.createConnection(CONFIG.mysql)
    console.log('✅ Connected to MySQL successfully')
    return connection
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error)
    throw error
  }
}

async function getMySQLTables(connection: mysql.Connection): Promise<string[]> {
  console.log('\n📋 Fetching list of tables from MySQL...')
  const [rows] = await connection.query('SHOW TABLES')
  const tables = (rows as any[]).map(row => Object.values(row)[0] as string)
  console.log(`✅ Found ${tables.length} tables: ${tables.join(', ')}`)
  return tables
}

async function getTableStructure(
  connection: mysql.Connection,
  tableName: string
): Promise<ColumnInfo[]> {
  console.log(`  📐 Getting structure for table: ${tableName}`)
  const [columns] = await connection.query(`DESCRIBE ${tableName}`)
  return columns as ColumnInfo[]
}

async function getTableData(
  connection: mysql.Connection,
  tableName: string,
  limit: number
): Promise<any[]> {
  console.log(`  📦 Fetching ${limit} rows from ${tableName}...`)
  const [rows] = await connection.query(
    `SELECT * FROM ${tableName} LIMIT ${limit}`
  )
  return rows as any[]
}

async function gatherTableInfo(
  connection: mysql.Connection,
  tableName: string
): Promise<TableInfo> {
  const columns = await getTableStructure(connection, tableName)
  const rows = await getTableData(connection, tableName, CONFIG.rowLimit)
  console.log(`  ✅ Retrieved ${rows.length} rows from ${tableName}`)
  return { tableName, columns, rows }
}

// ============================================================================
// Supabase Connection and Table Creation Functions
// ============================================================================

function connectToSupabase() {
  console.log('\n🔌 Connecting to Supabase...')
  const supabase = createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  console.log('✅ Connected to Supabase')
  return supabase
}

async function createTableInSupabase(
  supabase: ReturnType<typeof createClient>,
  tableInfo: TableInfo
): Promise<void> {
  const targetTableName = `${CONFIG.tablePrefix}${tableInfo.tableName}`
  console.log(`\n🏗️  Creating table: ${targetTableName}`)

  // Build CREATE TABLE statement
  const columnDefinitions = tableInfo.columns.map(col => {
    const pgType = mysqlTypeToPostgresType(col.Type)
    const nullable = col.Null === 'YES' ? '' : 'NOT NULL'
    const defaultValue = col.Default !== null ? `DEFAULT ${col.Default}` : ''

    return `  "${col.Field}" ${pgType} ${nullable} ${defaultValue}`.trim()
  })

  // Add id as primary key if it exists
  const hasPrimaryKey = tableInfo.columns.some(col => col.Key === 'PRI')
  if (hasPrimaryKey) {
    const pkColumn = tableInfo.columns.find(col => col.Key === 'PRI')
    if (pkColumn) {
      columnDefinitions.push(`  PRIMARY KEY ("${pkColumn.Field}")`)
    }
  }

  const createTableSQL = `
CREATE TABLE IF NOT EXISTS "${targetTableName}" (
${columnDefinitions.join(',\n')}
);
`.trim()

  console.log('  SQL:', createTableSQL)

  // Execute via Supabase's SQL function
  try {
    // Use raw SQL query via REST API
    const { error } = await supabase.rpc('exec_sql' as any, {
      query: createTableSQL,
    } as any)

    // If rpc doesn't exist, we'll use direct SQL execution
    // Note: This requires enabling pg_net or using Supabase SQL editor
    // For now, we'll try a direct approach

    // Alternative: Create via direct PostgreSQL connection
    console.log(
      '  ℹ️  Note: Table creation via SQL requires direct database access or SQL editor'
    )
    console.log('  📝 Please run the following SQL in your Supabase SQL editor:')
    console.log('  ' + '='.repeat(70))
    console.log(createTableSQL)
    console.log('  ' + '='.repeat(70))
  } catch (error) {
    console.error('  ⚠️  Could not create table automatically:', error)
  }
}

async function insertDataIntoSupabase(
  supabase: ReturnType<typeof createClient>,
  tableInfo: TableInfo
): Promise<void> {
  const targetTableName = `${CONFIG.tablePrefix}${tableInfo.tableName}`
  console.log(`\n📥 Inserting data into: ${targetTableName}`)

  if (tableInfo.rows.length === 0) {
    console.log('  ℹ️  No rows to insert')
    return
  }

  // Convert MySQL data formats to PostgreSQL-compatible formats
  const processedRows = tableInfo.rows.map(row => {
    const processed: any = {}
    for (const [key, value] of Object.entries(row)) {
      // Handle dates
      if (value instanceof Date) {
        processed[key] = value.toISOString()
      }
      // Handle buffers (binary data)
      else if (Buffer.isBuffer(value)) {
        processed[key] = value.toString('base64')
      }
      // Handle null/undefined
      else if (value === null || value === undefined) {
        processed[key] = null
      }
      // Everything else as-is
      else {
        processed[key] = value
      }
    }
    return processed
  })

  // Insert in batches of 100 (Supabase limit)
  const batchSize = 100
  let insertedCount = 0

  for (let i = 0; i < processedRows.length; i += batchSize) {
    const batch = processedRows.slice(i, i + batchSize)

    try {
      const { data, error } = await supabase
        .from(targetTableName)
        .insert(batch)
        .select()

      if (error) {
        console.error(
          `  ❌ Error inserting batch ${i / batchSize + 1}:`,
          error.message
        )
        console.error('  Details:', error)
      } else {
        insertedCount += batch.length
        console.log(
          `  ✅ Inserted batch ${i / batchSize + 1} (${batch.length} rows)`
        )
      }
    } catch (error) {
      console.error(`  ❌ Exception during insert:`, error)
    }
  }

  console.log(`  ✅ Total inserted: ${insertedCount} / ${tableInfo.rows.length} rows`)
}

// ============================================================================
// Main Migration Function
// ============================================================================

async function migrateTable(
  mysqlConnection: mysql.Connection,
  supabase: ReturnType<typeof createClient>,
  tableName: string
): Promise<{ success: boolean; rowCount: number }> {
  try {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`📊 Processing table: ${tableName}`)
    console.log('='.repeat(80))

    // Step 1: Gather table information from MySQL
    const tableInfo = await gatherTableInfo(mysqlConnection, tableName)

    // Step 2: Create table in Supabase
    await createTableInSupabase(supabase, tableInfo)

    // Step 3: Insert data into Supabase
    await insertDataIntoSupabase(supabase, tableInfo)

    return { success: true, rowCount: tableInfo.rows.length }
  } catch (error) {
    console.error(`\n❌ Error migrating table ${tableName}:`, error)
    return { success: false, rowCount: 0 }
  }
}

async function main() {
  console.log('🚀 Starting MySQL to Supabase Migration')
  console.log('='.repeat(80))

  // Validate configuration
  if (!CONFIG.mysql.host || !CONFIG.mysql.user || !CONFIG.mysql.password) {
    console.error('❌ MySQL configuration is incomplete. Check your .env file.')
    process.exit(1)
  }

  if (!CONFIG.supabase.url || !CONFIG.supabase.serviceRoleKey) {
    console.error('❌ Supabase configuration is incomplete. Check your .env file.')
    process.exit(1)
  }

  let mysqlConnection: mysql.Connection | null = null
  let totalRowsMigrated = 0
  let successCount = 0
  let failureCount = 0
  const allTableInfo: TableInfo[] = []

  try {
    // Connect to MySQL
    mysqlConnection = await connectToMySQL()

    // Connect to Supabase
    const supabase = connectToSupabase()

    // Get list of tables
    const tables = await getMySQLTables(mysqlConnection)

    if (tables.length === 0) {
      console.log('⚠️  No tables found in MySQL database')
      return
    }

    // Gather information from all tables
    console.log(`\n🔄 Gathering information from ${tables.length} tables...`)

    for (const tableName of tables) {
      try {
        console.log(`\n${'='.repeat(80)}`)
        console.log(`📊 Processing table: ${tableName}`)
        console.log('='.repeat(80))

        const tableInfo = await gatherTableInfo(mysqlConnection, tableName)
        allTableInfo.push(tableInfo)
        totalRowsMigrated += tableInfo.rows.length
        successCount++
      } catch (error) {
        console.error(`\n❌ Error gathering info for table ${tableName}:`, error)
        failureCount++
      }
    }

    // Generate SQL migration files
    console.log(`\n📝 Generating SQL migration files...`)
    
    const migrationFile = generateMigrationFile(
      allTableInfo,
      CONFIG.tablePrefix,
      'migrations/mysql_to_supabase.sql'
    )
    console.log(`✅ Generated combined migration file: ${migrationFile}`)

    const individualFiles = generateTableMigrationFiles(
      allTableInfo,
      CONFIG.tablePrefix,
      'migrations/mysql'
    )
    console.log(`✅ Generated ${individualFiles.length} individual table migration files`)

    // Now attempt to create tables and insert data via Supabase
    console.log(`\n🔄 Attempting to insert data into Supabase...`)
    
    for (const tableInfo of allTableInfo) {
      try {
        await insertDataIntoSupabase(supabase, tableInfo)
      } catch (error) {
        console.error(`❌ Error inserting data for ${tableInfo.tableName}:`, error)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Successfully processed: ${successCount} tables`)
    console.log(`❌ Failed to process: ${failureCount} tables`)
    console.log(`📦 Total rows extracted: ${totalRowsMigrated}`)
    console.log(`📄 Migration files created in: migrations/`)
    console.log('='.repeat(80))

    console.log('\n📋 NEXT STEPS:')
    console.log('1. Review the generated SQL file: migrations/mysql_to_supabase.sql')
    console.log('2. Go to your Supabase Dashboard → SQL Editor')
    console.log('3. Copy and paste the SQL from the migration file')
    console.log('4. Run the SQL to create tables and insert data')
    console.log('5. Verify the data in your Supabase tables')

    if (failureCount > 0) {
      console.log(
        '\n⚠️  Some tables failed to process. Check the logs above for details.'
      )
    } else {
      console.log('\n🎉 Migration preparation completed successfully!')
    }
  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error)
    process.exit(1)
  } finally {
    // Close MySQL connection
    if (mysqlConnection) {
      await mysqlConnection.end()
      console.log('\n👋 MySQL connection closed')
    }
  }
}

// ============================================================================
// Script Entry Point
// ============================================================================

// Only run if this is the main module
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { main, migrateTable, CONFIG }


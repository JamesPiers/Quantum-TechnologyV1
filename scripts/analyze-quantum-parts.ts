/**
 * Analyze quantum_parts_list table structure and generate migration SQL
 */

import * as mysql from 'mysql2/promise'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function analyzeTable() {
  console.log('🔍 Analyzing quantum_parts_list table structure')
  console.log('='.repeat(80))

  const mysqlConfig = {
    host: process.env.MYSQL_HOST || '',
    port: parseInt(process.env.MYSQL_PORT || '25060', 10),
    database: process.env.MYSQL_DATABASE || 'defaultdb',
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    ssl: {
      rejectUnauthorized: false,
    },
  }

  let connection: mysql.Connection | null = null

  try {
    connection = await mysql.createConnection(mysqlConfig)
    console.log('✅ Connected to MySQL')

    // Get table structure
    console.log('\n📋 Table Structure:')
    const [columns] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quantum_parts_list'
      ORDER BY ORDINAL_POSITION
    `, [mysqlConfig.database])

    console.log('Columns:')
    const columnInfo = (columns as any[]).map(col => ({
      name: col.COLUMN_NAME,
      type: col.DATA_TYPE,
      nullable: col.IS_NULLABLE === 'YES',
      default: col.COLUMN_DEFAULT,
      key: col.COLUMN_KEY,
      extra: col.EXTRA,
      maxLength: col.CHARACTER_MAXIMUM_LENGTH,
      precision: col.NUMERIC_PRECISION,
      scale: col.NUMERIC_SCALE
    }))

    columnInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}${col.maxLength ? `(${col.maxLength})` : ''} ${col.nullable ? 'NULL' : 'NOT NULL'} ${col.key ? `[${col.key}]` : ''}`)
    })

    // Get sample data
    console.log('\n📦 Sample Data (first 5 rows):')
    const [sampleRows] = await connection.query('SELECT * FROM quantum_parts_list LIMIT 5')
    console.log(JSON.stringify(sampleRows, null, 2))

    // Generate PostgreSQL CREATE TABLE statement
    console.log('\n🔧 Generated PostgreSQL CREATE TABLE Statement:')
    console.log('='.repeat(80))
    
    let createTableSQL = `CREATE TABLE IF NOT EXISTS do_quantum_parts_list (\n`
    
    const columnDefs = columnInfo.map(col => {
      let pgType = ''
      
      // Map MySQL types to PostgreSQL
      switch (col.type.toLowerCase()) {
        case 'varchar':
          pgType = col.maxLength ? `VARCHAR(${col.maxLength})` : 'VARCHAR'
          break
        case 'text':
          pgType = 'TEXT'
          break
        case 'int':
        case 'integer':
          pgType = 'INTEGER'
          break
        case 'bigint':
          pgType = 'BIGINT'
          break
        case 'decimal':
          pgType = col.precision && col.scale ? `DECIMAL(${col.precision},${col.scale})` : 'DECIMAL'
          break
        case 'float':
          pgType = 'REAL'
          break
        case 'double':
          pgType = 'DOUBLE PRECISION'
          break
        case 'datetime':
        case 'timestamp':
          pgType = 'TIMESTAMP'
          break
        case 'date':
          pgType = 'DATE'
          break
        case 'time':
          pgType = 'TIME'
          break
        case 'boolean':
        case 'bool':
          pgType = 'BOOLEAN'
          break
        case 'json':
          pgType = 'JSONB'
          break
        default:
          pgType = col.type.toUpperCase()
      }
      
      let def = `  ${col.name} ${pgType}`
      if (!col.nullable) def += ' NOT NULL'
      if (col.default && col.default !== 'NULL') {
        if (col.default.includes('CURRENT_TIMESTAMP')) {
          def += ' DEFAULT CURRENT_TIMESTAMP'
        } else if (col.type.toLowerCase() === 'varchar' || col.type.toLowerCase() === 'text') {
          def += ` DEFAULT '${col.default}'`
        } else {
          def += ` DEFAULT ${col.default}`
        }
      }
      
      return def
    })
    
    createTableSQL += columnDefs.join(',\n')
    createTableSQL += '\n);'
    
    console.log(createTableSQL)
    
    // Generate data migration approach
    console.log('\n📝 Data Migration Options:')
    console.log('='.repeat(80))
    console.log('Option 1: Use the existing migration script:')
    console.log('  npm run migrate:mysql')
    console.log('')
    console.log('Option 2: Create a focused migration script for just this table')
    console.log('  (This will be created next)')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n👋 Connection closed')
    }
  }
}

// Run the analysis
if (require.main === module) {
  analyzeTable().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { analyzeTable }

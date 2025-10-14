/**
 * SQL Generator for Supabase Migrations
 * 
 * This module generates SQL migration files that can be run directly
 * in Supabase SQL Editor or via Supabase CLI.
 */

import * as fs from 'fs'
import * as path from 'path'

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

/**
 * Maps MySQL data types to PostgreSQL data types
 */
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

/**
 * Escapes SQL string literals
 */
function escapeSqlString(value: any): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (value instanceof Date) return `'${value.toISOString()}'`
  if (Buffer.isBuffer(value)) return `'\\x${value.toString('hex')}'`
  
  // Escape single quotes in strings
  const str = String(value).replace(/'/g, "''")
  return `'${str}'`
}

/**
 * Generates CREATE TABLE SQL statement
 */
export function generateCreateTableSQL(
  tableInfo: TableInfo,
  tablePrefix: string = 'azure_'
): string {
  const targetTableName = `${tablePrefix}${tableInfo.tableName}`
  
  const columnDefinitions = tableInfo.columns.map(col => {
    const pgType = mysqlTypeToPostgresType(col.Type)
    const nullable = col.Null === 'YES' ? '' : 'NOT NULL'
    
    // Handle default values
    let defaultValue = ''
    if (col.Default !== null && col.Default !== undefined) {
      if (col.Default === 'CURRENT_TIMESTAMP') {
        defaultValue = 'DEFAULT CURRENT_TIMESTAMP'
      } else {
        defaultValue = `DEFAULT ${escapeSqlString(col.Default)}`
      }
    }

    return `  "${col.Field}" ${pgType} ${nullable} ${defaultValue}`.trim()
  })

  // Add primary key constraint
  const primaryKeys = tableInfo.columns.filter(col => col.Key === 'PRI')
  if (primaryKeys.length > 0) {
    const pkColumns = primaryKeys.map(col => `"${col.Field}"`).join(', ')
    columnDefinitions.push(`  PRIMARY KEY (${pkColumns})`)
  }

  return `CREATE TABLE IF NOT EXISTS "${targetTableName}" (\n${columnDefinitions.join(',\n')}\n);`
}

/**
 * Generates INSERT SQL statements
 */
export function generateInsertSQL(
  tableInfo: TableInfo,
  tablePrefix: string = 'azure_'
): string[] {
  const targetTableName = `${tablePrefix}${tableInfo.tableName}`
  
  if (tableInfo.rows.length === 0) {
    return []
  }

  const sqlStatements: string[] = []
  const columnNames = tableInfo.columns.map(col => `"${col.Field}"`).join(', ')

  // Generate INSERT statements in batches
  const batchSize = 50 // Smaller batches for readability
  
  for (let i = 0; i < tableInfo.rows.length; i += batchSize) {
    const batch = tableInfo.rows.slice(i, i + batchSize)
    const values = batch.map(row => {
      const rowValues = tableInfo.columns.map(col => {
        const value = row[col.Field]
        return escapeSqlString(value)
      })
      return `  (${rowValues.join(', ')})`
    })

    const sql = `INSERT INTO "${targetTableName}" (${columnNames})\nVALUES\n${values.join(',\n')};`
    sqlStatements.push(sql)
  }

  return sqlStatements
}

/**
 * Generates a complete migration file with all tables
 */
export function generateMigrationFile(
  tables: TableInfo[],
  tablePrefix: string = 'azure_',
  outputPath?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const filename = outputPath || `supabase/migrations/${timestamp}_mysql_migration.sql`

  let sqlContent = `-- MySQL to Supabase Migration
-- Generated on: ${new Date().toISOString()}
-- Tables migrated: ${tables.length}
-- Row limit per table: 100

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

`

  // Add CREATE TABLE statements
  tables.forEach(tableInfo => {
    sqlContent += `\n-- Table: ${tableInfo.tableName} (${tableInfo.rows.length} rows)\n`
    sqlContent += generateCreateTableSQL(tableInfo, tablePrefix)
    sqlContent += '\n\n'
  })

  sqlContent += `
-- ============================================================================
-- DATA INSERTION
-- ============================================================================

`

  // Add INSERT statements
  tables.forEach(tableInfo => {
    const inserts = generateInsertSQL(tableInfo, tablePrefix)
    if (inserts.length > 0) {
      sqlContent += `\n-- Data for: ${tableInfo.tableName}\n`
      inserts.forEach(insert => {
        sqlContent += insert + '\n\n'
      })
    }
  })

  // Write to file
  const dir = path.dirname(filename)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filename, sqlContent, 'utf-8')

  return filename
}

/**
 * Generates individual migration files for each table
 */
export function generateTableMigrationFiles(
  tables: TableInfo[],
  tablePrefix: string = 'azure_',
  outputDir: string = 'migrations/mysql'
): string[] {
  const files: string[] = []

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  tables.forEach(tableInfo => {
    const filename = path.join(outputDir, `${tablePrefix}${tableInfo.tableName}.sql`)
    
    let sqlContent = `-- Migration for table: ${tableInfo.tableName}
-- Rows: ${tableInfo.rows.length}
-- Generated: ${new Date().toISOString()}

`
    
    sqlContent += generateCreateTableSQL(tableInfo, tablePrefix)
    sqlContent += '\n\n'
    
    const inserts = generateInsertSQL(tableInfo, tablePrefix)
    if (inserts.length > 0) {
      inserts.forEach(insert => {
        sqlContent += insert + '\n\n'
      })
    }

    fs.writeFileSync(filename, sqlContent, 'utf-8')
    files.push(filename)
  })

  return files
}

export { mysqlTypeToPostgresType, escapeSqlString }


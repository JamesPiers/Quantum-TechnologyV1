/**
 * Test MySQL Connection
 * 
 * This script tests your MySQL connection and lists available tables
 * without performing any migration. Use this to verify your credentials
 * before running the full migration.
 * 
 * Usage:
 * npx tsx scripts/test-mysql-connection.ts
 */

import * as mysql from 'mysql2/promise'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testConnection() {
  console.log('🧪 Testing MySQL Connection')
  console.log('='.repeat(80))

  // Read configuration
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

  // Validate configuration
  if (!mysqlConfig.host || !mysqlConfig.user || !mysqlConfig.password) {
    console.error('❌ MySQL configuration is incomplete.')
    console.error('Please check your .env.local file.')
    console.error('Required variables: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD')
    process.exit(1)
  }

  console.log('📋 Configuration:')
  console.log(`   Host: ${mysqlConfig.host}`)
  console.log(`   Port: ${mysqlConfig.port}`)
  console.log(`   Database: ${mysqlConfig.database}`)
  console.log(`   User: ${mysqlConfig.user}`)
  console.log(`   Password: ${'*'.repeat(mysqlConfig.password.length)}`)
  console.log(`   SSL: Enabled`)

  let connection: mysql.Connection | null = null

  try {
    // Attempt connection
    console.log('\n🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(mysqlConfig)
    console.log('✅ Successfully connected to MySQL!')

    // Test query: Get server version
    console.log('\n📊 Server Information:')
    const [versionRows] = await connection.query('SELECT VERSION() as version')
    const version = (versionRows as any[])[0].version
    console.log(`   MySQL Version: ${version}`)

    // Get database size
    const [sizeRows] = await connection.query(`
      SELECT 
        table_schema as database_name,
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables
      WHERE table_schema = ?
      GROUP BY table_schema
    `, [mysqlConfig.database])
    
    if ((sizeRows as any[]).length > 0) {
      const dbSize = (sizeRows as any[])[0].size_mb
      console.log(`   Database Size: ${dbSize} MB`)
    }

    // List all tables
    console.log('\n📋 Available Tables:')
    const [tableRows] = await connection.query('SHOW TABLES')
    const tables = (tableRows as any[]).map(row => Object.values(row)[0] as string)
    
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found in database')
    } else {
      console.log(`   Found ${tables.length} tables:\n`)
      
      // Get row count for each table
      for (const tableName of tables) {
        try {
          const [countRows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`)
          const count = (countRows as any[])[0].count
          console.log(`   ✓ ${tableName.padEnd(30)} (${count} rows)`)
        } catch (error) {
          console.log(`   ⚠ ${tableName.padEnd(30)} (unable to count rows)`)
        }
      }
    }

    // Test sample query on first table
    if (tables.length > 0) {
      const firstTable = tables[0]
      console.log(`\n📦 Sample Data from "${firstTable}" (first 3 rows):`)
      try {
        const [sampleRows] = await connection.query(`SELECT * FROM ${firstTable} LIMIT 3`)
        if ((sampleRows as any[]).length > 0) {
          console.log(JSON.stringify(sampleRows, null, 2))
        } else {
          console.log('   (Table is empty)')
        }
      } catch (error) {
        console.log(`   ⚠️  Could not fetch sample data: ${error}`)
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ CONNECTION TEST PASSED')
    console.log('='.repeat(80))
    console.log('\n✨ Your MySQL connection is working correctly!')
    console.log('You can now run the full migration with: npm run migrate:mysql')

  } catch (error: any) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ CONNECTION TEST FAILED')
    console.error('='.repeat(80))
    console.error('\nError details:')
    console.error(`   Type: ${error.code || 'Unknown'}`)
    console.error(`   Message: ${error.message}`)
    
    // Provide helpful troubleshooting tips
    console.error('\n💡 Troubleshooting Tips:')
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   • The MySQL server is not responding')
      console.error('   • Check if the host and port are correct')
      console.error('   • Verify the MySQL server is running')
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   • Connection timed out - server may be unreachable')
      console.error('   • Check your internet connection')
      console.error('   • Verify your IP is whitelisted in DigitalOcean')
      console.error('   • Check firewall settings')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   • Username or password is incorrect')
      console.error('   • Verify credentials in .env.local')
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   • Database does not exist')
      console.error('   • Check MYSQL_DATABASE in .env.local')
    } else if (error.code === 'ENOTFOUND') {
      console.error('   • Hostname could not be resolved')
      console.error('   • Check MYSQL_HOST in .env.local')
    } else {
      console.error('   • Check all credentials in .env.local')
      console.error('   • Ensure SSL is properly configured')
      console.error('   • Contact your database administrator')
    }

    process.exit(1)
  } finally {
    // Close connection
    if (connection) {
      await connection.end()
      console.log('\n👋 Connection closed')
    }
  }
}

// Run the test
if (require.main === module) {
  testConnection().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { testConnection }


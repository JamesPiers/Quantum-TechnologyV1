/**
 * Migrate quantum_parts_list data from MySQL to Supabase
 * Creates do_quantum_parts_list table and copies all data
 */

import * as mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function migrateQuantumPartsData() {
  console.log('🚀 Migrating quantum_parts_list to do_quantum_parts_list')
  console.log('='.repeat(80))

  // MySQL configuration
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

  // Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  let mysqlConnection: mysql.Connection | null = null

  try {
    // Connect to MySQL
    console.log('🔌 Connecting to MySQL...')
    mysqlConnection = await mysql.createConnection(mysqlConfig)
    console.log('✅ Connected to MySQL')

    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('do_quantum_parts_list')
      .select('count')
      .limit(1)

    if (testError && testError.code !== 'PGRST116') { // PGRST116 = relation does not exist
      throw testError
    }
    console.log('✅ Supabase connection verified')

    // Get total count from MySQL
    console.log('\n📊 Getting data statistics...')
    const [countRows] = await mysqlConnection.query('SELECT COUNT(*) as count FROM quantum_parts_list')
    const totalRows = (countRows as any[])[0].count
    console.log(`   Total rows to migrate: ${totalRows}`)

    // Check if table exists in Supabase
    const { data: existingData, error: checkError } = await supabase
      .from('do_quantum_parts_list')
      .select('id')
      .limit(1)

    if (existingData && existingData.length > 0) {
      console.log('⚠️  Table do_quantum_parts_list already contains data')
      console.log('   Please run the SQL script first to create the table, or truncate it')
      process.exit(1)
    }

    // Migrate data in batches
    const batchSize = 1000
    let migratedRows = 0
    let offset = 0

    console.log(`\n📦 Starting data migration (batch size: ${batchSize})...`)

    while (offset < totalRows) {
      console.log(`   Processing batch ${Math.floor(offset / batchSize) + 1} (rows ${offset + 1}-${Math.min(offset + batchSize, totalRows)})...`)

      // Fetch batch from MySQL
      const [rows] = await mysqlConnection.query(`
        SELECT * FROM quantum_parts_list 
        ORDER BY id 
        LIMIT ${batchSize} OFFSET ${offset}
      `)

      if ((rows as any[]).length === 0) break

      // Transform data for PostgreSQL
      const transformedRows = (rows as any[]).map(row => ({
        id: row.id,
        c: row.c || null,
        part: row.part || null,
        vp1: row.vp1 || null,
        up1: row.up1 || null,
        vp2: row.vp2 || null,
        up2: row.up2 || null,
        descr: row.descr || null,
        sup: row.sup || null,
        mfg: row.mfg || null,
        pn: row.pn || null,
        proj: row.proj || null,
        sec: row.sec || null,
        dwg: row.dwg || null,
        dwg_id: row.dwg_id || null,
        qty: row.qty || null,
        spare: row.spare || null,
        po: row.po || null,
        resp: row.resp || null,
        ord: row.ord || null,
        wk: row.wk || null,
        s: row.s || null,
        each: row.each || null,
        d: row.d || null,
        n: row.n || null,
        l: row.l || null,
        b: row.b || null,
        who: row.who || null,
        upd: row.upd || null,
        category_description: row.category_description || null,
        each_num: row.each_num ? parseFloat(row.each_num) : null,
        d_date: row.d_date || null
      }))

      // Insert batch into Supabase
      const { data, error } = await supabase
        .from('do_quantum_parts_list')
        .insert(transformedRows)

      if (error) {
        console.error(`❌ Error inserting batch:`, error)
        throw error
      }

      migratedRows += transformedRows.length
      offset += batchSize

      console.log(`   ✅ Inserted ${transformedRows.length} rows (${migratedRows}/${totalRows} total)`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY')
    console.log('='.repeat(80))
    console.log(`📊 Total rows migrated: ${migratedRows}`)
    console.log(`📊 Source table: quantum_parts_list`)
    console.log(`📊 Target table: do_quantum_parts_list`)

    // Verify migration
    console.log('\n🔍 Verifying migration...')
    const { count: supabaseCount, error: countError } = await supabase
      .from('do_quantum_parts_list')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error verifying migration:', countError)
    } else {
      console.log(`✅ Verification: ${supabaseCount} rows in Supabase`)
      if (supabaseCount === totalRows) {
        console.log('✅ Row count matches - migration successful!')
      } else {
        console.log('⚠️  Row count mismatch - please check the migration')
      }
    }

    console.log('\n🎉 Migration complete! You can now query do_quantum_parts_list in Supabase.')

  } catch (error: any) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ MIGRATION FAILED')
    console.error('='.repeat(80))
    console.error('Error details:', error.message)
    process.exit(1)
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end()
      console.log('\n👋 MySQL connection closed')
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateQuantumPartsData().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { migrateQuantumPartsData }

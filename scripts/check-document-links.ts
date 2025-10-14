/**
 * Check for document links, PDFs, Google docs, or other external resources
 * in the migrated quantum parts data
 */

import * as mysql from 'mysql2/promise'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function checkDocumentLinks() {
  console.log('🔍 Checking for document links and external resources')
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

    // Check for URLs, PDFs, Google docs in description field
    console.log('\n📄 Searching for document references in description field...')
    const [docRows] = await connection.query(`
      SELECT id, part, descr, dwg, dwg_id
      FROM quantum_parts_list 
      WHERE descr LIKE '%pdf%' 
         OR descr LIKE '%http%' 
         OR descr LIKE '%www.%'
         OR descr LIKE '%google%'
         OR descr LIKE '%drive%'
         OR descr LIKE '%docs%'
         OR descr LIKE '%sharepoint%'
         OR descr LIKE '%dropbox%'
         OR descr LIKE '%file%'
         OR descr LIKE '%document%'
         OR descr LIKE '%.pdf'
         OR descr LIKE '%.doc'
         OR descr LIKE '%.docx'
      ORDER BY id
      LIMIT 20
    `)

    console.log(`Found ${(docRows as any[]).length} rows with potential document references:`)
    console.log('')
    
    if ((docRows as any[]).length > 0) {
      (docRows as any[]).forEach(row => {
        console.log(`ID: ${row.id}`)
        console.log(`Part: ${row.part}`)
        console.log(`Drawing: ${row.dwg || 'N/A'}`)
        console.log(`Drawing ID: ${row.dwg_id || 'N/A'}`)
        console.log(`Description: ${row.descr}`)
        console.log('-'.repeat(60))
      })
    } else {
      console.log('No obvious document links found in description field.')
    }

    // Check drawing-related fields
    console.log('\n📋 Checking drawing-related fields...')
    const [drawingRows] = await connection.query(`
      SELECT id, part, dwg, dwg_id, descr
      FROM quantum_parts_list 
      WHERE dwg IS NOT NULL AND dwg != ''
         OR dwg_id IS NOT NULL AND dwg_id != ''
      ORDER BY id
      LIMIT 15
    `)

    console.log(`Found ${(drawingRows as any[]).length} rows with drawing references:`)
    console.log('')
    
    if ((drawingRows as any[]).length > 0) {
      (drawingRows as any[]).forEach(row => {
        console.log(`ID: ${row.id}`)
        console.log(`Part: ${row.part}`)
        console.log(`Drawing: ${row.dwg || 'N/A'}`)
        console.log(`Drawing ID: ${row.dwg_id || 'N/A'}`)
        console.log(`Description: ${row.descr?.substring(0, 100)}...`)
        console.log('-'.repeat(60))
      })
    } else {
      console.log('No drawing references found.')
    }

    // Check for any fields that might contain file paths or URLs
    console.log('\n🔗 Checking all text fields for URLs and file paths...')
    const [urlRows] = await connection.query(`
      SELECT id, part, descr, n, l, b
      FROM quantum_parts_list 
      WHERE descr LIKE '%http%' 
         OR descr LIKE '%www.%'
         OR descr LIKE '%://%'
         OR n LIKE '%http%'
         OR n LIKE '%www.%'
         OR n LIKE '%://%'
         OR l LIKE '%http%'
         OR l LIKE '%www.%'
         OR l LIKE '%://%'
         OR b LIKE '%http%'
         OR b LIKE '%www.%'
         OR b LIKE '%://%'
      ORDER BY id
      LIMIT 10
    `)

    console.log(`Found ${(urlRows as any[]).length} rows with potential URLs:`)
    console.log('')
    
    if ((urlRows as any[]).length > 0) {
      (urlRows as any[]).forEach(row => {
        console.log(`ID: ${row.id}`)
        console.log(`Part: ${row.part}`)
        console.log(`Description: ${row.descr || 'N/A'}`)
        console.log(`Field N: ${row.n || 'N/A'}`)
        console.log(`Field L: ${row.l || 'N/A'}`)
        console.log(`Field B: ${row.b || 'N/A'}`)
        console.log('-'.repeat(60))
      })
    } else {
      console.log('No URLs found in any text fields.')
    }

    // Check for common file extensions
    console.log('\n📎 Checking for file extensions...')
    const [fileRows] = await connection.query(`
      SELECT id, part, descr
      FROM quantum_parts_list 
      WHERE descr LIKE '%.pdf%' 
         OR descr LIKE '%.doc%'
         OR descr LIKE '%.docx%'
         OR descr LIKE '%.xls%'
         OR descr LIKE '%.xlsx%'
         OR descr LIKE '%.txt%'
         OR descr LIKE '%.zip%'
         OR descr LIKE '%.rar%'
         OR descr LIKE '%.jpg%'
         OR descr LIKE '%.png%'
         OR descr LIKE '%.dwg%'
         OR descr LIKE '%.cad%'
      ORDER BY id
      LIMIT 15
    `)

    console.log(`Found ${(fileRows as any[]).length} rows with file extensions:`)
    console.log('')
    
    if ((fileRows as any[]).length > 0) {
      (fileRows as any[]).forEach(row => {
        console.log(`ID: ${row.id}`)
        console.log(`Part: ${row.part}`)
        console.log(`Description: ${row.descr}`)
        console.log('-'.repeat(60))
      })
    } else {
      console.log('No file extensions found.')
    }

    // Summary of all fields that might contain links
    console.log('\n📊 Summary of potential document/link fields:')
    console.log('Fields to check manually:')
    console.log('- descr (description) - most likely to contain document references')
    console.log('- dwg (drawing) - drawing references')
    console.log('- dwg_id (drawing ID) - drawing identifiers')
    console.log('- n (field N) - unknown purpose, might contain notes/links')
    console.log('- l (field L) - unknown purpose, might contain links')
    console.log('- b (field B) - unknown purpose, might contain references')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n👋 Connection closed')
    }
  }
}

// Run the check
if (require.main === module) {
  checkDocumentLinks().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { checkDocumentLinks }

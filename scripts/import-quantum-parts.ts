/**
 * Import data from do_quantum_parts_list into parts table
 * This script:
 * 1. Reads from do_quantum_parts_list (read-only, no modifications)
 * 2. Creates/resolves suppliers and manufacturers
 * 3. Transforms data types and maps columns
 * 4. Inserts into parts table
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

interface ImportStats {
  totalRows: number
  processedRows: number
  successfulInserts: number
  failedInserts: number
  skippedRows: number
  suppliersCreated: number
  manufacturersCreated: number
  errors: Array<{ row: number; error: string; data?: any }>
}

interface SupplierMap {
  [name: string]: string // name -> uuid
}

interface ManufacturerMap {
  [name: string]: string // name -> uuid
}

async function importQuantumParts(options: { dryRun?: boolean; limit?: number } = {}) {
  const { dryRun = false, limit } = options

  console.log('🚀 Quantum Parts Import Script')
  console.log('='.repeat(80))
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be inserted')
    console.log('='.repeat(80))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const stats: ImportStats = {
    totalRows: 0,
    processedRows: 0,
    successfulInserts: 0,
    failedInserts: 0,
    skippedRows: 0,
    suppliersCreated: 0,
    manufacturersCreated: 0,
    errors: []
  }

  try {
    // Phase 1: Get reference data (suppliers and manufacturers)
    console.log('\n📋 Phase 1: Preparing Reference Data')
    console.log('-'.repeat(80))

    const supplierMap: SupplierMap = {}
    const manufacturerMap: ManufacturerMap = {}

    // Get unique suppliers from source
    console.log('   Fetching unique suppliers...')
    const { data: sourceSuppliers, error: supError } = await supabase
      .from('do_quantum_parts_list')
      .select('sup')

    if (supError) throw supError

    const uniqueSuppliers = new Set(
      sourceSuppliers
        .map(row => row.sup)
        .filter(sup => sup && sup.trim() !== '' && isValidSupplierName(sup))
    )

    console.log(`   Found ${uniqueSuppliers.size} unique suppliers`)

    // Get existing suppliers
    const { data: existingSuppliers, error: existSupError } = await supabase
      .from('suppliers')
      .select('id, name')

    if (existSupError) throw existSupError

    existingSuppliers?.forEach(sup => {
      supplierMap[sup.name] = sup.id
    })

    console.log(`   Existing suppliers in database: ${existingSuppliers?.length || 0}`)

    // Create missing suppliers
    if (!dryRun) {
      for (const supName of Array.from(uniqueSuppliers)) {
        if (!supplierMap[supName]) {
          const { data: newSup, error: createSupError } = await supabase
            .from('suppliers')
            .insert({ name: supName })
            .select('id, name')
            .single()

          if (createSupError) {
            console.log(`   ⚠️  Could not create supplier "${supName}": ${createSupError.message}`)
          } else if (newSup) {
            supplierMap[supName] = newSup.id
            stats.suppliersCreated++
          }
        }
      }
      console.log(`   ✅ Created ${stats.suppliersCreated} new suppliers`)
    } else {
      const toCreate = Array.from(uniqueSuppliers).filter(name => !supplierMap[name])
      console.log(`   [DRY RUN] Would create ${toCreate.length} new suppliers`)
    }

    // Get unique manufacturers from source
    console.log('   Fetching unique manufacturers...')
    const { data: sourceMfgs, error: mfgError } = await supabase
      .from('do_quantum_parts_list')
      .select('mfg')

    if (mfgError) throw mfgError

    const uniqueMfgs = new Set(
      sourceMfgs
        .map(row => row.mfg)
        .filter(mfg => mfg && mfg.trim() !== '' && isValidManufacturerName(mfg))
    )

    console.log(`   Found ${uniqueMfgs.size} unique manufacturers`)

    // Get existing manufacturers
    const { data: existingMfgs, error: existMfgError } = await supabase
      .from('manufacturers')
      .select('id, name')

    if (existMfgError) throw existMfgError

    existingMfgs?.forEach(mfg => {
      manufacturerMap[mfg.name] = mfg.id
    })

    console.log(`   Existing manufacturers in database: ${existingMfgs?.length || 0}`)

    // Create missing manufacturers
    if (!dryRun) {
      for (const mfgName of Array.from(uniqueMfgs)) {
        if (!manufacturerMap[mfgName]) {
          const { data: newMfg, error: createMfgError } = await supabase
            .from('manufacturers')
            .insert({ name: mfgName })
            .select('id, name')
            .single()

          if (createMfgError) {
            console.log(`   ⚠️  Could not create manufacturer "${mfgName}": ${createMfgError.message}`)
          } else if (newMfg) {
            manufacturerMap[mfgName] = newMfg.id
            stats.manufacturersCreated++
          }
        }
      }
      console.log(`   ✅ Created ${stats.manufacturersCreated} new manufacturers`)
    } else {
      const toCreate = Array.from(uniqueMfgs).filter(name => !manufacturerMap[name])
      console.log(`   [DRY RUN] Would create ${toCreate.length} new manufacturers`)
    }

    // Phase 2: Fetch source data
    console.log('\n📥 Phase 2: Fetching Source Data')
    console.log('-'.repeat(80))

    let allSourceRows: any[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
      const query = supabase
        .from('do_quantum_parts_list')
        .select('*')
        .range(from, from + batchSize - 1)

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        allSourceRows = allSourceRows.concat(data)
        from += batchSize
        console.log(`   Fetched ${allSourceRows.length} rows...`)
      } else {
        hasMore = false
      }

      if (data && data.length < batchSize) {
        hasMore = false
      }

      if (limit && allSourceRows.length >= limit) {
        allSourceRows = allSourceRows.slice(0, limit)
        hasMore = false
      }
    }

    stats.totalRows = allSourceRows.length
    console.log(`✅ Fetched ${stats.totalRows} rows from do_quantum_parts_list`)

    // Phase 3: Transform and insert data
    console.log('\n🔄 Phase 3: Transforming and Importing Data')
    console.log('-'.repeat(80))

    const insertBatchSize = 500
    let insertedCount = 0

    for (let i = 0; i < allSourceRows.length; i += insertBatchSize) {
      const batch = allSourceRows.slice(i, i + insertBatchSize)
      const transformedBatch: any[] = []

      for (const sourceRow of batch) {
        stats.processedRows++

        try {
          const transformed = transformRow(sourceRow, supplierMap, manufacturerMap)
          
          if (!transformed) {
            stats.skippedRows++
            continue
          }

          transformedBatch.push(transformed)
        } catch (error: any) {
          stats.failedInserts++
          stats.errors.push({
            row: sourceRow.id,
            error: error.message,
            data: sourceRow
          })
        }
      }

      // Insert batch
      if (!dryRun && transformedBatch.length > 0) {
        const { data, error: insertError } = await supabase
          .from('parts')
          .insert(transformedBatch)
          .select('id')

        if (insertError) {
          console.error(`   ❌ Batch insert failed (rows ${i}-${i + batch.length}): ${insertError.message}`)
          stats.failedInserts += transformedBatch.length
          stats.errors.push({
            row: i,
            error: `Batch insert failed: ${insertError.message}`,
            data: { batchSize: transformedBatch.length }
          })
        } else {
          stats.successfulInserts += transformedBatch.length
          insertedCount += transformedBatch.length
          console.log(`   ✅ Inserted batch: ${insertedCount}/${stats.totalRows} rows`)
        }
      } else if (dryRun) {
        stats.successfulInserts += transformedBatch.length
        console.log(`   [DRY RUN] Would insert batch: ${transformedBatch.length} rows`)
      }
    }

    // Phase 4: Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total rows in source: ${stats.totalRows}`)
    console.log(`Rows processed: ${stats.processedRows}`)
    console.log(`Successful inserts: ${stats.successfulInserts}`)
    console.log(`Failed inserts: ${stats.failedInserts}`)
    console.log(`Skipped rows: ${stats.skippedRows}`)
    console.log(`Suppliers created: ${stats.suppliersCreated}`)
    console.log(`Manufacturers created: ${stats.manufacturersCreated}`)
    console.log(`Errors encountered: ${stats.errors.length}`)

    if (stats.errors.length > 0 && stats.errors.length <= 20) {
      console.log('\n⚠️  Error Details:')
      stats.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Row ${err.row}: ${err.error}`)
      })
    } else if (stats.errors.length > 20) {
      console.log(`\n⚠️  ${stats.errors.length} errors occurred (showing first 10):`)
      stats.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. Row ${err.row}: ${err.error}`)
      })
    }

    const successRate = ((stats.successfulInserts / stats.totalRows) * 100).toFixed(1)
    console.log(`\n✅ Success rate: ${successRate}%`)

    if (!dryRun && stats.successfulInserts > 0) {
      console.log('\n🎉 Import complete! Data is now in the parts table.')
    } else if (dryRun) {
      console.log('\n✅ Dry run complete! Run without --dry-run to execute the import.')
    }

  } catch (error: any) {
    console.error('\n❌ IMPORT FAILED:', error.message)
    console.error(error)
    process.exit(1)
  }

  return stats
}

/**
 * Transform a single row from do_quantum_parts_list to parts table format
 */
function transformRow(
  source: any,
  supplierMap: SupplierMap,
  manufacturerMap: ManufacturerMap
): any | null {
  // Skip rows with missing required fields
  if (!source.part || source.part.trim() === '') {
    return null
  }

  // Fix and validate category
  let category = source.c
  if (!category || category.trim() === '') {
    category = 'x' // default to misc
  } else {
    category = fixCategory(category)
  }

  // Validate category
  const validCategories = ['m', 'e', 't', 's', 'p', 'c', 'v', 'x']
  if (!validCategories.includes(category)) {
    category = 'x' // fallback to misc
  }

  // Resolve supplier UUID
  let supplierUuid = null
  if (source.sup && source.sup.trim() !== '' && isValidSupplierName(source.sup)) {
    supplierUuid = supplierMap[source.sup] || null
  }

  // Resolve manufacturer UUID
  let manufacturerUuid = null
  if (source.mfg && source.mfg.trim() !== '' && isValidManufacturerName(source.mfg)) {
    manufacturerUuid = manufacturerMap[source.mfg] || null
  }

  // Parse numeric fields
  const vp1 = parseNumeric(source.vp1)
  const vp2 = parseNumeric(source.vp2)
  const qty = parseInt(source.qty) || 0
  const spare = parseInt(source.spare) || 0
  const wk = parseInt(source.wk) || null
  const s = Math.max(0, Math.min(9, parseInt(source.s) || 0)) // constrain to 0-9
  const each = source.each_num !== null ? parseFloat(source.each_num) : null

  // Parse date fields
  const ord = parseDate(source.ord)
  const upd = parseDate(source.upd)

  // Parse currency
  let currency = source.d || 'C'
  if (!['C', 'U'].includes(currency)) {
    currency = 'C' // default to CAD
  }

  // Parse boolean
  const b = parseBoolean(source.b)

  return {
    c: category,
    part: source.part.trim(),
    desc: source.descr || null,
    vp1,
    up1: source.up1 || null,
    vp2,
    up2: source.up2 || null,
    sup: supplierUuid,
    mfg: manufacturerUuid,
    pn: source.pn || null,
    proj: source.proj || null,
    sec: source.sec || null,
    dwg: source.dwg || null,
    id_from_dwg: source.dwg_id || null,
    qty,
    spare,
    po: source.po || null,
    re_sp: source.resp || null,
    ord,
    wk,
    s,
    each,
    d: currency,
    n: source.n || null,
    l: source.l || null,
    b,
    w: source.who || null,
    upd,
    lc: null // not in source
  }
}

/**
 * Fix common category issues
 */
function fixCategory(cat: string): string {
  const trimmed = cat.trim().toLowerCase()
  
  // Map invalid categories to valid ones
  const categoryMap: { [key: string]: string } = {
    'y': 'x', // Nitrogen Liquefier → misc
    'l': 'x', // Labour → misc
    'r': 'x', // Drawings/certification → misc
    ' ': 'x', // Empty → misc
  }

  return categoryMap[trimmed] || trimmed
}

/**
 * Check if supplier name is valid (filter out junk data)
 */
function isValidSupplierName(name: string): boolean {
  if (!name || name.trim() === '') return false
  
  const invalid = ['???', '.', '0', '2', '900']
  if (invalid.includes(name.trim())) return false
  
  // Check if it's a number (likely bad data)
  if (!isNaN(parseFloat(name)) && isFinite(parseFloat(name))) return false
  
  return true
}

/**
 * Check if manufacturer name is valid (filter out junk data)
 */
function isValidManufacturerName(name: string): boolean {
  if (!name || name.trim() === '') return false
  
  const invalid = ['?', '(check stock)']
  if (invalid.includes(name.trim())) return false
  
  // Check if it's only digits or part numbers (likely bad data)
  if (/^\d+$/.test(name.trim())) return false
  if (/^\d{4}T\d{2}$/.test(name.trim())) return false // Pattern like 3037T73
  
  return true
}

/**
 * Parse numeric value from string
 */
function parseNumeric(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

/**
 * Parse date from various formats
 */
function parseDate(value: any): string | null {
  if (!value || value === '') return null
  
  try {
    // Try parsing as date
    const date = new Date(value)
    if (isNaN(date.getTime())) return null
    
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}

/**
 * Parse boolean value
 */
function parseBoolean(value: any): boolean {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'boolean') return value
  
  const str = String(value).toLowerCase().trim()
  return ['1', 'true', 's', 'yes', 'y'].includes(str)
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitArg = args.find(arg => arg.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

  console.log('Command line arguments:', { dryRun, limit })

  importQuantumParts({ dryRun, limit }).catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { importQuantumParts }


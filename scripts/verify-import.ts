/**
 * Verify imported data in parts table
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function verifyImport() {
  console.log('🔍 Verifying Imported Data')
  console.log('='.repeat(80))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Count rows in parts table
    console.log('\n1️⃣  Checking parts table...')
    const { count: partsCount, error: partsError } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })

    if (partsError) throw partsError
    console.log(`   Total parts: ${partsCount}`)

    // 2. Count rows in source table
    console.log('\n2️⃣  Checking source table...')
    const { count: sourceCount, error: sourceError } = await supabase
      .from('do_quantum_parts_list')
      .select('*', { count: 'exact', head: true })

    if (sourceError) throw sourceError
    console.log(`   Total source rows: ${sourceCount}`)

    const importPercentage = ((partsCount! / sourceCount!) * 100).toFixed(1)
    console.log(`   Import coverage: ${importPercentage}%`)

    // 3. Check suppliers
    console.log('\n3️⃣  Checking suppliers...')
    const { count: suppliersCount, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })

    if (suppliersError) throw suppliersError
    console.log(`   Total suppliers: ${suppliersCount}`)

    // 4. Check manufacturers
    console.log('\n4️⃣  Checking manufacturers...')
    const { count: mfgsCount, error: mfgsError } = await supabase
      .from('manufacturers')
      .select('*', { count: 'exact', head: true })

    if (mfgsError) throw mfgsError
    console.log(`   Total manufacturers: ${mfgsCount}`)

    // 5. Check category distribution
    console.log('\n5️⃣  Checking category distribution...')
    
    // Fetch all categories in batches
    let allCategories: any[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('parts')
        .select('c')
        .range(from, from + batchSize - 1)

      if (batchError) throw batchError

      if (batch && batch.length > 0) {
        allCategories = allCategories.concat(batch)
        from += batchSize
      }

      if (!batch || batch.length < batchSize) {
        hasMore = false
      }
    }

    const categoryCount = new Map<string, number>()
    allCategories.forEach(part => {
      categoryCount.set(part.c, (categoryCount.get(part.c) || 0) + 1)
    })

    console.log('   Category breakdown:')
    Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const percentage = ((count / partsCount!) * 100).toFixed(1)
        console.log(`      ${cat}: ${count} (${percentage}%)`)
      })

    // 6. Sample some parts with full details
    console.log('\n6️⃣  Sample imported parts...')
    const { data: sampleParts, error: sampleError } = await supabase
      .from('v_parts_readable')
      .select('*')
      .limit(5)

    if (sampleError) throw sampleError

    sampleParts?.forEach((part, idx) => {
      console.log(`\n   Part ${idx + 1}:`)
      console.log(`      Name: ${part.part}`)
      console.log(`      Category: ${part.category_name}`)
      console.log(`      Supplier: ${part.supplier_name || 'N/A'}`)
      console.log(`      Manufacturer: ${part.manufacturer_name || 'N/A'}`)
      console.log(`      PN: ${part.part_number || 'N/A'}`)
      console.log(`      Qty: ${part.quantity}`)
      console.log(`      Price: ${part.currency_code === 'C' ? 'CAD' : 'USD'} ${part.unit_price || 'N/A'}`)
    })

    // 7. Check for parts without suppliers/manufacturers
    console.log('\n7️⃣  Checking reference data...')
    const { count: noSupplierCount, error: noSupError } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .is('sup', null)

    if (noSupError) throw noSupError

    const { count: noMfgCount, error: noMfgError } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .is('mfg', null)

    if (noMfgError) throw noMfgError

    console.log(`   Parts without supplier: ${noSupplierCount} (${((noSupplierCount! / partsCount!) * 100).toFixed(1)}%)`)
    console.log(`   Parts without manufacturer: ${noMfgCount} (${((noMfgCount! / partsCount!) * 100).toFixed(1)}%)`)

    // 8. Check for null required fields
    console.log('\n8️⃣  Checking data quality...')
    const { count: nullPartCount, error: nullPartError } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .is('part', null)

    if (nullPartError) throw nullPartError

    const { count: nullCategoryCount, error: nullCatError } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .is('c', null)

    if (nullCatError) throw nullCatError

    console.log(`   Parts with null name: ${nullPartCount} (should be 0)`)
    console.log(`   Parts with null category: ${nullCategoryCount} (should be 0)`)

    // 9. Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 VERIFICATION SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Parts imported: ${partsCount}/${sourceCount} (${importPercentage}%)`)
    console.log(`✅ Suppliers created: ${suppliersCount}`)
    console.log(`✅ Manufacturers created: ${mfgsCount}`)
    console.log(`✅ Data integrity: ${nullPartCount === 0 && nullCategoryCount === 0 ? 'PASSED' : 'FAILED'}`)
    console.log('')

    if (partsCount! > 0) {
      console.log('✅ Import verification successful!')
    } else {
      console.log('⚠️  No parts found in database')
    }

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  verifyImport().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { verifyImport }


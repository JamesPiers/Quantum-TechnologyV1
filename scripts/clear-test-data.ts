/**
 * Clear test import data to prepare for full import
 * This will delete all parts, suppliers, and manufacturers
 * BE CAREFUL - this is destructive!
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function clearTestData() {
  console.log('⚠️  Clear Test Data Script')
  console.log('='.repeat(80))
  console.log('WARNING: This will delete all data from:')
  console.log('  - parts table')
  console.log('  - suppliers table')
  console.log('  - manufacturers table')
  console.log('='.repeat(80))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Count before deletion
    const { count: partsCount } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })

    const { count: suppliersCount } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })

    const { count: mfgsCount } = await supabase
      .from('manufacturers')
      .select('*', { count: 'exact', head: true })

    console.log('\nCurrent data:')
    console.log(`  Parts: ${partsCount}`)
    console.log(`  Suppliers: ${suppliersCount}`)
    console.log(`  Manufacturers: ${mfgsCount}`)

    if (partsCount === 0 && suppliersCount === 0 && mfgsCount === 0) {
      console.log('\n✅ No data to clear. Tables are already empty.')
      return
    }

    // Delete parts first (has foreign keys)
    console.log('\n🗑️  Deleting parts...')
    const { error: partsError } = await supabase
      .from('parts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (partsError) {
      console.error('❌ Error deleting parts:', partsError.message)
      throw partsError
    }
    console.log('✅ Parts deleted')

    // Delete suppliers
    console.log('🗑️  Deleting suppliers...')
    const { error: suppliersError } = await supabase
      .from('suppliers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (suppliersError) {
      console.error('❌ Error deleting suppliers:', suppliersError.message)
      throw suppliersError
    }
    console.log('✅ Suppliers deleted')

    // Delete manufacturers
    console.log('🗑️  Deleting manufacturers...')
    const { error: mfgsError } = await supabase
      .from('manufacturers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (mfgsError) {
      console.error('❌ Error deleting manufacturers:', mfgsError.message)
      throw mfgsError
    }
    console.log('✅ Manufacturers deleted')

    // Verify
    const { count: finalPartsCount } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })

    const { count: finalSuppliersCount } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })

    const { count: finalMfgsCount } = await supabase
      .from('manufacturers')
      .select('*', { count: 'exact', head: true })

    console.log('\n' + '='.repeat(80))
    console.log('✅ CLEANUP COMPLETE')
    console.log('='.repeat(80))
    console.log('Final counts:')
    console.log(`  Parts: ${finalPartsCount}`)
    console.log(`  Suppliers: ${finalSuppliersCount}`)
    console.log(`  Manufacturers: ${finalMfgsCount}`)
    console.log('\n✅ Ready for full import!')

  } catch (error: any) {
    console.error('\n❌ Cleanup failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  clearTestData().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { clearTestData }


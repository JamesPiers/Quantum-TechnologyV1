/**
 * API route for getting filter dropdown options
 * GET /api/filters/options?field=responsible_person
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase-server'
import { ServerDB } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    
    const searchParams = request.nextUrl.searchParams
    const field = searchParams.get('field')
    
    console.log(`[Filter Options API] Fetching options for field: ${field}`)
    
    if (!field) {
      return NextResponse.json(
        { error: 'Field parameter is required' },
        { status: 400 }
      )
    }
    
    const db = await ServerDB.create()
    
    let options: { value: string; label: string }[] = []
    
    // Use efficient queries based on field type
    switch (field) {
      case 'supplier': {
        // Query suppliers table directly
        const { data: suppliers } = await db.getSuppliers()
        if (suppliers) {
          options = suppliers
            .filter(s => s.name && s.name.trim())
            .map(s => ({
              value: s.name,
              label: s.name
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        }
        break
      }
      
      case 'manufacturer': {
        // Query manufacturers table directly
        const { data: manufacturers } = await db.getManufacturers()
        if (manufacturers) {
          options = manufacturers
            .filter(m => m.name && m.name.trim())
            .map(m => ({
              value: m.name,
              label: m.name
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        }
        break
      }
      
      case 'responsible_person':
      case 'project':
      case 'section':
      case 'drawing':
      case 'drawing_id':
      case 'purchase_order':
      case 'location_code':
      case 'last_updated_by': {
        // Map API field names to database column names
        const fieldMap: Record<string, string> = {
          'responsible_person': 'responsible_person',
          'project': 'project',
          'section': 'section',
          'drawing': 'drawing',
          'drawing_id': 'drawing_id',
          'purchase_order': 'purchase_order',
          'location_code': 'location_code',
          'last_updated_by': 'last_updated_by'
        }
        
        const dbField = fieldMap[field]
        const supabase = await import('@/lib/supabase-server').then(m => m.createClient())
        const client = await supabase
        
        console.log(`[Filter Options API] Getting DISTINCT values for: ${dbField}`)
        
        // Use rpc to execute raw SQL for true DISTINCT query
        const { data: distinctValues, error } = await client
          .rpc('get_distinct_field_values', {
            table_name: 'v_parts_readable',
            field_name: dbField
          })
        
        if (error) {
          console.error(`[Filter Options API] RPC error for ${field}:`, error)
          // Fallback to regular query if RPC doesn't exist
          // Use pagination to get all unique values without timeout
          const uniqueValues = new Set<string>()
          let page = 0
          const pageSize = 1000
          let hasMore = true
          
          while (hasMore && page < 20) { // Max 20 pages = 20k rows
            const { data: fallbackData, error: fallbackError } = await client
              .from('v_parts_readable')
              .select(dbField)
              .not(dbField, 'is', null)
              .range(page * pageSize, (page + 1) * pageSize - 1)
            
            if (fallbackError) {
              console.error(`[Filter Options API] Fallback error for ${field} page ${page}:`, fallbackError)
              break
            }
            
            if (!fallbackData || fallbackData.length === 0) {
              hasMore = false
              break
            }
            
            // Extract unique values from this page
            fallbackData.forEach((row: any) => {
              const value = row[dbField]
              if (value && typeof value === 'string' && value.trim()) {
                uniqueValues.add(value.trim())
              }
            })
            
            // Check if we got a full page (if not, we're done)
            if (fallbackData.length < pageSize) {
              hasMore = false
            }
            
            page++
          }
          
          console.log(`[Filter Options API] Extracted ${uniqueValues.size} unique values for ${field} from ${page} pages`)
          
          options = Array.from(uniqueValues)
            .sort()
            .map(value => ({
              value,
              label: value
            }))
        } else {
          // RPC returns array of distinct values directly
          options = (distinctValues || [])
            .filter((value: any) => value && typeof value === 'string' && value.trim())
            .map((value: string) => value.trim())
            .sort()
            .map(value => ({
              value,
              label: value
            }))
        }
        
        console.log(`[Filter Options API] Returning ${options.length} options for ${field}:`, options.slice(0, 5))
        break
      }
      
      default:
        console.error(`[Filter Options API] Invalid field: ${field}`)
        return NextResponse.json(
          { error: `Invalid field: ${field}` },
          { status: 400 }
        )
    }
    
    console.log(`[Filter Options API] Returning ${options.length} unique options for field: ${field}`)
    
    return NextResponse.json({ options })
    
  } catch (error) {
    console.error('[Filter Options API] Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get filter options', message: errorMessage },
      { status: 500 }
    )
  }
}


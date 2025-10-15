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
    
    // Validate field name
    const validFields = [
      'supplier', 'manufacturer', 'responsible_person', 'project', 
      'section', 'drawing', 'drawing_id', 'purchase_order', 
      'location_code', 'last_updated_by'
    ]
    
    if (!validFields.includes(field)) {
      console.error(`[Filter Options API] Invalid field: ${field}`)
      return NextResponse.json(
        { error: `Invalid field: ${field}` },
        { status: 400 }
      )
    }
    
    const db = await ServerDB.create()
    
    // Get ALL parts to extract unique values
    // Using a high limit to ensure we get all data
    const { data, error } = await db.getParts({
      limit: 10000,
      offset: 0
    })
    
    if (error) {
      console.error(`[Filter Options API] Database error:`, error)
      throw new Error(`Failed to fetch parts: ${error.message}`)
    }
    
    if (!data || data.length === 0) {
      console.log(`[Filter Options API] No data returned from database`)
      return NextResponse.json({ options: [] })
    }
    
    const result = data[0]
    const parts = result.parts_data ? JSON.parse(JSON.stringify(result.parts_data)) : []
    
    console.log(`[Filter Options API] Processing ${parts.length} parts for field: ${field}`)
    
    // Debug: Show a sample part to see structure
    if (parts.length > 0) {
      console.log(`[Filter Options API] Sample part structure:`, Object.keys(parts[0]))
      console.log(`[Filter Options API] Sample ${field} value:`, parts[0][field === 'supplier' ? 'supplier_name' : field === 'manufacturer' ? 'manufacturer_name' : field])
    }
    
    // Extract unique values based on the field
    const uniqueValues = new Set<string>()
    
    parts.forEach((part: any, index: number) => {
      let value = ''
      
      switch (field) {
        case 'supplier':
          value = part.supplier_name
          break
        case 'manufacturer':
          value = part.manufacturer_name
          break
        case 'responsible_person':
          value = part.responsible_person
          break
        case 'project':
          value = part.project
          break
        case 'section':
          value = part.section
          break
        case 'drawing':
          value = part.drawing
          break
        case 'drawing_id':
          value = part.drawing_id
          break
        case 'purchase_order':
          value = part.purchase_order
          break
        case 'location_code':
          value = part.location_code
          break
        case 'last_updated_by':
          value = part.last_updated_by
          break
      }
      
      if (value && value.trim()) {
        uniqueValues.add(value.trim())
      }
      
      // Debug first 3 parts for the requested field
      if (index < 3) {
        console.log(`[Filter Options API] Part ${index} ${field} value:`, value || '(empty)')
      }
    })
    
    // Sort and format options
    const options = Array.from(uniqueValues)
      .sort()
      .map(value => ({
        value,
        label: value
      }))
    
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


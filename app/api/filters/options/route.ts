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
    
    if (!field) {
      return NextResponse.json(
        { error: 'Field parameter is required' },
        { status: 400 }
      )
    }
    
    const db = await ServerDB.create()
    
    // Get ALL parts (no limit) to extract unique values
    const { data, error } = await db.getParts({
      limit: 10000, // High limit to get all parts
      offset: 0
    })
    
    if (error) {
      throw new Error(`Failed to fetch parts: ${error.message}`)
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ options: [] })
    }
    
    const result = data[0]
    const parts = result.parts_data ? JSON.parse(JSON.stringify(result.parts_data)) : []
    
    // Extract unique values based on the field
    const uniqueValues = new Set<string>()
    
    parts.forEach((part: any) => {
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
        default:
          return NextResponse.json(
            { error: 'Invalid field' },
            { status: 400 }
          )
      }
      
      if (value && value.trim()) {
        uniqueValues.add(value.trim())
      }
    })
    
    // Sort and format options
    const options = Array.from(uniqueValues)
      .sort()
      .map(value => ({
        value,
        label: value
      }))
    
    return NextResponse.json({ options })
    
  } catch (error) {
    console.error('Filter options API error:', error)
    
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


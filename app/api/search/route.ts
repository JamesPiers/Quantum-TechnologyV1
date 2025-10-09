/**
 * API route for searching parts with filters and pagination
 * GET /api/search
 */

import { NextRequest, NextResponse } from 'next/server'
import { SearchPartsSchema, SearchResults } from '@/lib/schemas'
import { searchParts, getSearchFacets } from '@/lib/search'
import { requireAuth } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()
    
    // Parse search parameters
    const searchParams = request.nextUrl.searchParams
    const params = {
      po: searchParams.get('po') || undefined,
      customer: searchParams.get('customer') || undefined, 
      part: searchParams.get('part') || undefined,
      manufacturer: searchParams.get('manufacturer') || undefined,
      supplier: searchParams.get('supplier') || undefined,
      status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined,
      project: searchParams.get('project') || undefined,
      category: searchParams.get('category') as any || undefined,
      limit: searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!), 500) : 50,
      offset: searchParams.get('offset') ? Math.max(parseInt(searchParams.get('offset')!), 0) : 0
    }

    // Validate parameters
    const validatedParams = SearchPartsSchema.parse(params)
    
    // Perform search
    const results = await searchParts(validatedParams)
    
    // Return results
    return NextResponse.json(results)

  } catch (error) {
    console.error('Search API error:', error)
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Search failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Get search facets/filters
 * GET /api/search/facets
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()
    
    // Parse request body for base filters
    let baseFilters = {}
    try {
      const body = await request.json()
      baseFilters = body
    } catch {
      // No body provided, use empty filters
    }
    
    // Get search facets
    const facets = await getSearchFacets(baseFilters)
    
    return NextResponse.json(facets)

  } catch (error) {
    console.error('Search facets API error:', error)
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get search facets', message: error.message },
      { status: 500 }
    )
  }
}

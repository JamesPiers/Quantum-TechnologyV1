/**
 * API route for CSV export of parts data
 * GET /api/exports/csv
 */

import { NextRequest, NextResponse } from 'next/server'
import { CSVExportSchema } from '@/lib/schemas'
import { searchParts, formatPartsForCSV } from '@/lib/search'
import { requireAuth } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()
    
    // Parse export parameters (same as search but without pagination)
    const searchParams = request.nextUrl.searchParams
    const params = {
      po: searchParams.get('po') || undefined,
      customer: searchParams.get('customer') || undefined,
      part: searchParams.get('part') || undefined,
      manufacturer: searchParams.get('manufacturer') || undefined,
      supplier: searchParams.get('supplier') || undefined,
      status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined,
      project: searchParams.get('project') || undefined,
      category: searchParams.get('category') as any || undefined
    }

    // Validate parameters
    const validatedParams = CSVExportSchema.parse(params)
    
    // Perform search with high limit to get all matching records
    const searchResults = await searchParts({
      ...validatedParams,
      limit: 10000, // Large limit to get all results
      offset: 0
    })
    
    console.log(`Exporting ${searchResults.parts.length} parts to CSV for user ${user.id}`)
    
    // Convert to CSV format
    const csvContent = formatPartsForCSV(searchResults.parts)
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `quantum-parts-export-${timestamp}.csv`
    
    // Log audit event
    try {
      const { ServerDB } = await import('@/lib/supabase-server')
      const db = new ServerDB()
      await db.logAuditEvent({
        user_id: user.id,
        entity: 'parts_export',
        action: 'csv_export',
        payload: {
          filters: validatedParams,
          record_count: searchResults.parts.length,
          filename
        }
      })
    } catch (auditError) {
      console.warn('Failed to log CSV export audit event:', auditError)
    }
    
    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('CSV export API error:', error)
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid export parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'CSV export failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Get export template CSV (empty CSV with proper headers)
 * GET /api/exports/csv/template
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()
    
    // Create empty parts array to get just the headers
    const csvHeaders = formatPartsForCSV([])
    
    // Return CSV template
    return new NextResponse(csvHeaders, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="quantum-parts-import-template.csv"',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('CSV template API error:', error)
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'CSV template generation failed', message: error.message },
      { status: 500 }
    )
  }
}

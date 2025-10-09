/**
 * API route for PDF ingest processing
 * POST /api/parts/ingest
 */

import { NextRequest, NextResponse } from 'next/server'
import { PDFIngestRequestSchema, PDFIngestReport } from '@/lib/schemas'
import { requireAuth, ServerDB } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()
    
    // Parse request body
    const body = await request.json()
    const { filePaths } = PDFIngestRequestSchema.parse(body)
    
    console.log(`Processing ${filePaths.length} PDF files for user ${user.id}`)
    
    // Initialize results
    const reports: PDFIngestReport[] = []
    const errors: string[] = []
    
    // Process each file
    for (const filePath of filePaths) {
      try {
        console.log(`Calling Edge Function for file: ${filePath}`)
        
        // Call the Supabase Edge Function for each file
        const supabase = createServiceRoleClient()
        
        const { data, error } = await supabase.functions.invoke('pdf_ingest', {
          body: {
            path: filePath,
            uploader_user_id: user.id
          }
        })
        
        if (error) {
          console.error(`Edge function error for ${filePath}:`, error)
          errors.push(`Failed to process ${filePath}: ${error.message}`)
          
          // Create a failure report
          reports.push({
            partsInserted: 0,
            partsUpdated: 0,
            posCreated: 0,
            warnings: [],
            errors: [error.message]
          })
        } else {
          console.log(`Successfully processed ${filePath}:`, data)
          reports.push(data as PDFIngestReport)
        }
        
      } catch (fileError) {
        console.error(`Error processing file ${filePath}:`, fileError)
        errors.push(`Failed to process ${filePath}: ${fileError.message}`)
        
        reports.push({
          partsInserted: 0,
          partsUpdated: 0,
          posCreated: 0,
          warnings: [],
          errors: [fileError.message]
        })
      }
    }
    
    // Combine all reports into a summary
    const combinedReport: PDFIngestReport = {
      partsInserted: reports.reduce((sum, r) => sum + r.partsInserted, 0),
      partsUpdated: reports.reduce((sum, r) => sum + r.partsUpdated, 0),
      posCreated: reports.reduce((sum, r) => sum + r.posCreated, 0),
      warnings: reports.flatMap(r => r.warnings),
      errors: reports.flatMap(r => r.errors || [])
    }
    
    // Add any general errors
    if (errors.length > 0) {
      combinedReport.errors = combinedReport.errors || []
      combinedReport.errors.push(...errors)
    }
    
    // Log audit event for the batch
    try {
      const db = new ServerDB()
      await db.logAuditEvent({
        user_id: user.id,
        entity: 'pdf_batch_ingest',
        action: 'import',
        payload: {
          file_paths: filePaths,
          combined_report: combinedReport
        }
      })
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }
    
    console.log('Combined ingest report:', combinedReport)
    
    // Return the combined report
    return NextResponse.json(combinedReport)

  } catch (error) {
    console.error('PDF ingest API error:', error)
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'PDF ingest failed', 
        message: error.message,
        partsInserted: 0,
        partsUpdated: 0,
        posCreated: 0,
        warnings: [],
        errors: [error.message]
      },
      { status: 500 }
    )
  }
}

/**
 * Get ingest status for a user's recent uploads
 * GET /api/parts/ingest
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()
    
    // Get recent ingest records for this user
    const db = new ServerDB()
    const supabase = createServiceRoleClient()
    
    const { data: ingestRecords, error } = await supabase
      .from('raw_ingest')
      .select('*')
      .eq('uploader_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      throw new Error(`Failed to fetch ingest records: ${error.message}`)
    }
    
    return NextResponse.json({
      ingest_records: ingestRecords || []
    })

  } catch (error) {
    console.error('Get ingest status API error:', error)
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get ingest status', message: error.message },
      { status: 500 }
    )
  }
}

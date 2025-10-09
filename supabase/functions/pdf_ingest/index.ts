/**
 * Supabase Edge Function for PDF processing and data ingestion
 * Runs on Deno runtime with access to Supabase client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// PDF processing utilities (simplified for Deno)
interface PDFIngestRequest {
  path: string
  uploader_user_id: string
}

interface PDFIngestReport {
  partsInserted: number
  partsUpdated: number
  posCreated: number
  warnings: string[]
  errors?: string[]
}

interface ParsedPDFData {
  poNumber?: string
  customerNumber?: string
  supplierName?: string
  manufacturerName?: string
  orderDate?: string
  currency?: 'C' | 'U'
  project?: string
  lineItems: ParsedLineItem[]
  rawText: string
}

interface ParsedLineItem {
  partNumber?: string
  description?: string
  quantity?: number
  unitPrice?: number
  currency?: 'C' | 'U'
  category?: string
  drawing?: string
  project?: string
}

// Simple PDF text extraction (in production, you'd use a proper PDF library)
async function extractTextFromPDF(fileData: Uint8Array): Promise<string> {
  // TODO: Implement proper PDF text extraction
  // For now, return a mock extraction that demonstrates the parsing logic
  
  // This is a placeholder that simulates extracted PDF text
  // In production, you would use libraries like pdf-parse or pdfjs-dist
  const mockPDFText = `
    PURCHASE ORDER
    PO Number: PO-538-003
    Date: 2024-03-15
    
    Supplier: Advanced Components Ltd.
    Customer No: CUST-001
    
    Line Items:
    Part#: VALVE-SS-1/4    Description: Stainless Steel Ball Valve 1/4"    Qty: 5    Price: $125.00
    Part#: GAUGE-VAC-001   Description: Vacuum Gauge 0-30 inHg            Qty: 2    Price: $89.50
    Part#: TUBE-SS-025     Description: SS Tubing 1/4" OD                  Qty: 50   Price: $12.75
    
    Total: $1,462.50 CAD
  `
  
  return mockPDFText
}

// PDF parsing logic using our OCR mapping patterns
function parsePDFText(rawText: string): ParsedPDFData {
  const parsed: ParsedPDFData = {
    lineItems: [],
    rawText
  }
  
  // Extract PO number
  const poMatch = rawText.match(/PO\s*(?:Number)?:?\s*([A-Z0-9\-]+)/i)
  if (poMatch) parsed.poNumber = poMatch[1]
  
  // Extract customer number
  const customerMatch = rawText.match(/Customer\s*(?:No\.?|#)?:?\s*([A-Z0-9\-]+)/i)
  if (customerMatch) parsed.customerNumber = customerMatch[1]
  
  // Extract supplier
  const supplierMatch = rawText.match(/Supplier:?\s*([A-Za-z0-9\s\.,&\-']+?)(?:\n|$)/i)
  if (supplierMatch) parsed.supplierName = supplierMatch[1].trim()
  
  // Extract date
  const dateMatch = rawText.match(/Date:?\s*(\d{4}-\d{1,2}-\d{1,2})/i)
  if (dateMatch) parsed.orderDate = dateMatch[1]
  
  // Extract currency (default to CAD)
  const currencyMatch = rawText.match(/(USD|CAD)/i)
  parsed.currency = currencyMatch && currencyMatch[1].toUpperCase() === 'USD' ? 'U' : 'C'
  
  // Extract line items using regex
  const lineItemRegex = /Part#:\s*([A-Z0-9\-\/\._]+)\s+Description:\s*([^Q]+?)\s+Qty:\s*(\d+)\s+Price:\s*\$?([\d,]+\.?\d*)/gi
  let match
  
  while ((match = lineItemRegex.exec(rawText)) !== null) {
    const lineItem: ParsedLineItem = {
      partNumber: match[1].trim(),
      description: match[2].trim(),
      quantity: parseInt(match[3]) || 0,
      unitPrice: parseFloat(match[4].replace(/,/g, '')) || 0,
      currency: parsed.currency,
      category: inferCategory(match[2].trim() + ' ' + match[1].trim()),
      project: parsed.project
    }
    
    parsed.lineItems.push(lineItem)
  }
  
  return parsed
}

// Infer category from description/part number
function inferCategory(text: string): string {
  const lowerText = text.toLowerCase()
  
  const categoryKeywords = {
    'v': ['vacuum', 'pump', 'gauge', 'turbo', 'roughing'],
    'p': ['valve', 'fitting', 'coupling', 'hose', 'pipe'],
    'm': ['steel', 'tubing', 'tube', 'material', 'ss'],
    'e': ['cable', 'wire', 'electrical', 'power'],
    't': ['controller', 'sensor', 'electronic', 'pcb'],
    's': ['system', 'assembly', 'chamber', 'unit'],
    'c': ['compressor', 'blower', 'motor'],
    'x': ['misc', 'other', 'tool', 'accessory']
  }
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category
      }
    }
  }
  
  return 'x' // default to misc
}

// Main Edge Function handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request
    const { path, uploader_user_id }: PDFIngestRequest = await req.json()
    
    if (!path) {
      throw new Error('File path is required')
    }

    console.log(`Processing PDF: ${path} for user: ${uploader_user_id}`)

    // Create raw ingest record
    const { data: ingestRecord, error: ingestError } = await supabaseClient
      .from('raw_ingest')
      .insert({
        file_path: path,
        uploader_user_id,
        processing_status: 'processing'
      })
      .select()
      .single()

    if (ingestError) {
      throw new Error(`Failed to create ingest record: ${ingestError.message}`)
    }

    let report: PDFIngestReport = {
      partsInserted: 0,
      partsUpdated: 0,
      posCreated: 0,
      warnings: [],
      errors: []
    }

    try {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('incoming-pdfs')
        .download(path)

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`)
      }

      // Convert to Uint8Array for processing
      const fileBuffer = new Uint8Array(await fileData.arrayBuffer())
      
      // Extract text from PDF
      const rawText = await extractTextFromPDF(fileBuffer)
      
      // Parse the extracted text
      const parsedData = parsePDFText(rawText)
      
      console.log('Parsed data:', JSON.stringify(parsedData, null, 2))

      // Update ingest record with parsed content
      await supabaseClient
        .from('raw_ingest')
        .update({
          parsed_content: parsedData,
          processing_status: 'processing'
        })
        .eq('id', ingestRecord.id)

      // Upsert suppliers and manufacturers
      const suppliersToUpsert: any[] = []
      const manufacturersToUpsert: any[] = []
      const customersToUpsert: any[] = []

      if (parsedData.supplierName) {
        suppliersToUpsert.push({
          name: parsedData.supplierName,
          notes: `Auto-created from PDF import on ${new Date().toISOString()}`
        })
      }

      if (parsedData.manufacturerName && parsedData.manufacturerName !== parsedData.supplierName) {
        manufacturersToUpsert.push({
          name: parsedData.manufacturerName,
          notes: `Auto-created from PDF import on ${new Date().toISOString()}`
        })
      }

      if (parsedData.customerNumber) {
        customersToUpsert.push({
          customer_number: parsedData.customerNumber,
          name: `Customer ${parsedData.customerNumber}`,
          notes: `Auto-created from PDF import on ${new Date().toISOString()}`
        })
      }

      // Upsert entities
      let supplierId = null
      let manufacturerId = null
      let customerId = null

      if (suppliersToUpsert.length > 0) {
        const { data: supplierData, error: supplierError } = await supabaseClient
          .from('suppliers')
          .upsert(suppliersToUpsert[0], { onConflict: 'name' })
          .select()
          .single()

        if (supplierError) {
          report.warnings.push(`Failed to upsert supplier: ${supplierError.message}`)
        } else {
          supplierId = supplierData.id
        }
      }

      if (manufacturersToUpsert.length > 0) {
        const { data: manufacturerData, error: manufacturerError } = await supabaseClient
          .from('manufacturers')
          .upsert(manufacturersToUpsert[0], { onConflict: 'name' })
          .select()
          .single()

        if (manufacturerError) {
          report.warnings.push(`Failed to upsert manufacturer: ${manufacturerError.message}`)
        } else {
          manufacturerId = manufacturerData.id
        }
      }

      if (customersToUpsert.length > 0) {
        const { data: customerData, error: customerError } = await supabaseClient
          .from('customers')
          .upsert(customersToUpsert[0], { onConflict: 'customer_number' })
          .select()
          .single()

        if (customerError) {
          report.warnings.push(`Failed to upsert customer: ${customerError.message}`)
        } else {
          customerId = customerData.id
        }
      }

      // Create purchase order if we have PO data
      let purchaseOrderId = null
      if (parsedData.poNumber) {
        const { data: poData, error: poError } = await supabaseClient
          .from('purchase_orders')
          .upsert({
            po_number: parsedData.poNumber,
            supplier_id: supplierId,
            customer_id: customerId,
            order_date: parsedData.orderDate,
            currency: parsedData.currency || 'C',
            notes: `Imported from PDF: ${path}`
          }, { onConflict: 'po_number' })
          .select()
          .single()

        if (poError) {
          report.warnings.push(`Failed to create/update PO: ${poError.message}`)
        } else {
          purchaseOrderId = poData.id
          report.posCreated = 1
        }
      }

      // Insert parts
      for (const lineItem of parsedData.lineItems) {
        try {
          const partData = {
            c: lineItem.category || 'x',
            part: lineItem.partNumber || `UNKNOWN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            desc: lineItem.description,
            qty: lineItem.quantity || 0,
            po: parsedData.poNumber,
            proj: lineItem.project || parsedData.project,
            each: lineItem.unitPrice,
            d: lineItem.currency || 'C',
            pn: lineItem.partNumber,
            dwg: lineItem.drawing,
            ord: parsedData.orderDate,
            s: 1, // Default to "Quoted" status
            sup: supplierId,
            mfg: manufacturerId,
            n: `Imported from PDF on ${new Date().toISOString()}`
          }

          const { data: partResult, error: partError } = await supabaseClient
            .from('parts')
            .insert(partData)
            .select()
            .single()

          if (partError) {
            report.warnings.push(`Failed to insert part ${lineItem.partNumber}: ${partError.message}`)
          } else {
            report.partsInserted++

            // Create PO line item if we have a PO
            if (purchaseOrderId && partResult) {
              await supabaseClient
                .from('po_line_items')
                .insert({
                  purchase_order_id: purchaseOrderId,
                  part_id: partResult.id,
                  quantity: lineItem.quantity || 0,
                  unit_price: lineItem.unitPrice,
                  currency: lineItem.currency || 'C'
                })
            }
          }
        } catch (error) {
          report.warnings.push(`Error processing line item ${lineItem.partNumber}: ${error.message}`)
        }
      }

      // Log audit event
      if (uploader_user_id) {
        await supabaseClient
          .from('audit_events')
          .insert({
            user_id: uploader_user_id,
            entity: 'pdf_ingest',
            entity_id: ingestRecord.id,
            action: 'import',
            payload: {
              file_path: path,
              parts_inserted: report.partsInserted,
              pos_created: report.posCreated
            }
          })
      }

      // Update ingest record with completion
      await supabaseClient
        .from('raw_ingest')
        .update({
          ingest_report: report,
          processing_status: 'completed'
        })
        .eq('id', ingestRecord.id)

      console.log('PDF processing completed:', report)

    } catch (processingError) {
      console.error('PDF processing error:', processingError)
      
      report.errors = report.errors || []
      report.errors.push(processingError.message)

      // Update ingest record with error
      await supabaseClient
        .from('raw_ingest')
        .update({
          processing_status: 'failed',
          error_message: processingError.message,
          ingest_report: report
        })
        .eq('id', ingestRecord.id)
    }

    // Return the ingest report
    return new Response(
      JSON.stringify(report),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        partsInserted: 0,
        partsUpdated: 0,
        posCreated: 0,
        warnings: [],
        errors: [error.message]
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

/* To deploy this function using the Supabase CLI:
 * 
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Link to project: supabase link --project-ref YOUR_PROJECT_REF
 * 4. Deploy: supabase functions deploy pdf_ingest
 * 
 * The function will be available at:
 * https://YOUR_PROJECT_REF.supabase.co/functions/v1/pdf_ingest
 */

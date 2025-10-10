/**
 * OCR mapping utilities for parsing PDF purchase orders and quotes
 * Maps extracted text tokens to database columns according to Column Rules
 */

import { CreatePart, CreateSupplier, CreateManufacturer, CreateCustomer, Category, Currency, StatusCode } from './schemas'

// Common regex patterns for PDF text extraction
export const OCR_PATTERNS = {
  // Purchase order patterns
  PO_NUMBER: [
    /PO\s*#?:?\s*([A-Z0-9\-]+)/gi,
    /Purchase\s*Order\s*#?:?\s*([A-Z0-9\-]+)/gi,
    /Order\s*Number:?\s*([A-Z0-9\-]+)/gi
  ],
  
  // Customer patterns
  CUSTOMER_NUMBER: [
    /Customer\s*(?:No\.?|#|Number):?\s*([A-Z0-9\-]+)/gi,
    /Cust\s*#:?\s*([A-Z0-9\-]+)/gi,
    /Account\s*#:?\s*([A-Z0-9\-]+)/gi
  ],
  
  // Supplier/Manufacturer patterns
  SUPPLIER_NAME: [
    /Supplier:?\s*([A-Za-z0-9\s\.,&\-']+?)(?:\n|$|\||;)/gi,
    /Vendor:?\s*([A-Za-z0-9\s\.,&\-']+?)(?:\n|$|\||;)/gi,
    /From:?\s*([A-Za-z0-9\s\.,&\-']+?)(?:\n|$|\||;)/gi
  ],
  
  MFG_NAME: [
    /Manufacturer:?\s*([A-Za-z0-9\s\.,&\-']+?)(?:\n|$|\||;)/gi,
    /Mfg:?\s*([A-Za-z0-9\s\.,&\-']+?)(?:\n|$|\||;)/gi,
    /Brand:?\s*([A-Za-z0-9\s\.,&\-']+?)(?:\n|$|\||;)/gi
  ],
  
  // Part number patterns
  PART_NUMBER: [
    /Part\s*#?:?\s*([A-Z0-9\-\/\._]+)/gi,
    /PN:?\s*([A-Z0-9\-\/\._]+)/gi,
    /Item:?\s*([A-Z0-9\-\/\._]+)/gi,
    /Model:?\s*([A-Z0-9\-\/\._]+)/gi
  ],
  
  // Pricing patterns
  UNIT_PRICE: [
    /Unit\s*Price[:\s]*\$?([\d,]+\.?\d*)/gi,
    /Each[:\s]*\$?([\d,]+\.?\d*)/gi,
    /Price[:\s]*\$?([\d,]+\.?\d*)/gi,
    /Cost[:\s]*\$?([\d,]+\.?\d*)/gi
  ],
  
  // Quantity patterns
  QUANTITY: [
    /Qty[:\s]*([\d,]+)/gi,
    /Quantity[:\s]*([\d,]+)/gi,
    /QTY[:\s]*([\d,]+)/gi
  ],
  
  // Description patterns
  DESCRIPTION: [
    /Description:?\s*([A-Za-z0-9\s\.,\-\/\(\)'"]+?)(?:\n|$|\||;)/gi,
    /DESC:?\s*([A-Za-z0-9\s\.,\-\/\(\)'"]+?)(?:\n|$|\||;)/gi
  ],
  
  // Date patterns
  ORDER_DATE: [
    /Order\s*Date:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /Date:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/gi
  ],
  
  // Currency patterns
  CURRENCY: [
    /Currency:?\s*(USD|CAD|US|CA)/gi,
    /\$(USD|CAD)/gi
  ],
  
  // Project/Drawing patterns
  PROJECT: [
    /Project:?\s*([A-Z0-9\-]+)/gi,
    /Proj:?\s*([A-Z0-9\-]+)/gi,
    /Job:?\s*([A-Z0-9\-]+)/gi
  ],
  
  DRAWING: [
    /Drawing:?\s*([A-Z0-9\-\.]+)/gi,
    /DWG:?\s*([A-Z0-9\-\.]+)/gi,
    /Print:?\s*([A-Z0-9\-\.]+)/gi
  ]
} as const

// Line item extraction patterns for tabular data
export const LINE_ITEM_PATTERNS = {
  // Common table headers to identify line item sections
  TABLE_HEADERS: [
    /(?:Item|Part|PN)\s+(?:Description|DESC)\s+(?:Qty|Quantity)\s+(?:Unit\s*Price|Each|Price)/gi,
    /(?:Line|#)\s+(?:Part|Item)\s+(?:Desc|Description)\s+(?:Qty)\s+(?:Price)/gi
  ],
  
  // Line item row patterns (flexible for different formats)
  LINE_ITEM_ROW: [
    /^(\d+)\s+([A-Z0-9\-\/\._]+)\s+([^0-9]+?)\s+(\d+)\s+\$?([\d,]+\.?\d*)/gm,
    /([A-Z0-9\-\/\._]+)\s+([^0-9]+?)\s+(\d+)\s+\$?([\d,]+\.?\d*)/gm
  ]
}

// Category mapping heuristics based on part description/name
export const CATEGORY_MAPPING = {
  keywords: {
    m: ['steel', 'aluminum', 'material', 'tube', 'tubing', 'pipe', 'sheet', 'plate', 'rod', 'bar'],
    e: ['cable', 'wire', 'power', 'electrical', 'connector', 'terminal', 'junction'],
    t: ['controller', 'plc', 'sensor', 'electronic', 'pcb', 'circuit', 'processor', 'module'],
    s: ['system', 'assembly', 'unit', 'chamber', 'housing', 'enclosure', 'frame'],
    p: ['fitting', 'valve', 'pipe', 'hose', 'coupling', 'adapter', 'plumbing'],
    c: ['pump', 'compressor', 'blower', 'fan', 'motor'],
    v: ['vacuum', 'turbo', 'roughing', 'scroll', 'diaphragm', 'gauge', 'manifold'],
    x: ['misc', 'other', 'tool', 'consumable', 'accessory', 'hardware']
  }
} as const

/**
 * Extract structured data from raw PDF text
 */
export interface ParsedPDFData {
  poNumber?: string
  customerNumber?: string
  supplierName?: string
  manufacturerName?: string
  orderDate?: string
  currency?: Currency
  project?: string
  lineItems: ParsedLineItem[]
  rawText: string
}

export interface ParsedLineItem {
  partNumber?: string
  description?: string
  quantity?: number
  unitPrice?: number
  currency?: Currency
  category?: Category
  drawing?: string
  project?: string
}

/**
 * Main PDF parsing function - extracts structured data from raw text
 */
export function parsePDFText(rawText: string): ParsedPDFData {
  const parsed: ParsedPDFData = {
    lineItems: [],
    rawText
  }
  
  // Extract header information
  parsed.poNumber = extractFirstMatch(rawText, OCR_PATTERNS.PO_NUMBER)
  parsed.customerNumber = extractFirstMatch(rawText, OCR_PATTERNS.CUSTOMER_NUMBER)
  parsed.supplierName = extractFirstMatch(rawText, OCR_PATTERNS.SUPPLIER_NAME)
  parsed.manufacturerName = extractFirstMatch(rawText, OCR_PATTERNS.MFG_NAME)
  parsed.orderDate = extractFirstMatch(rawText, OCR_PATTERNS.ORDER_DATE)
  parsed.project = extractFirstMatch(rawText, OCR_PATTERNS.PROJECT)
  
  // Extract currency
  const currencyMatch = extractFirstMatch(rawText, OCR_PATTERNS.CURRENCY)
  if (currencyMatch) {
    parsed.currency = currencyMatch.toUpperCase().includes('USD') ? 'U' : 'C'
  }
  
  // Extract line items
  parsed.lineItems = extractLineItems(rawText, parsed)
  
  return parsed
}

/**
 * Extract line items from text (tries multiple patterns)
 */
function extractLineItems(text: string, context: ParsedPDFData): ParsedLineItem[] {
  const lineItems: ParsedLineItem[] = []
  
  // Try different line item extraction patterns
  for (const pattern of LINE_ITEM_PATTERNS.LINE_ITEM_ROW) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const lineItem: ParsedLineItem = {
        partNumber: match[1] || match[2], // Different capture groups depending on pattern
        description: match[2] || match[3],
        quantity: parseInt(match[3] || match[4]) || 0,
        unitPrice: parseFloat((match[4] || match[5] || '0').replace(/,/g, '')) || 0,
        currency: context.currency || 'C',
        project: context.project
      }
      
      // Guess category based on description
      lineItem.category = inferCategory(lineItem.description || lineItem.partNumber || '')
      
      lineItems.push(lineItem)
    }
  }
  
  // If no structured line items found, try fallback extraction
  if (lineItems.length === 0) {
    const fallbackItems = extractFallbackLineItems(text, context)
    lineItems.push(...fallbackItems)
  }
  
  return lineItems
}

/**
 * Fallback line item extraction for less structured PDFs
 */
function extractFallbackLineItems(text: string, context: ParsedPDFData): ParsedLineItem[] {
  const lineItems: ParsedLineItem[] = []
  
  // If we have basic PO info but no line items, create a placeholder
  if (context.poNumber) {
    // Try to extract any part numbers, quantities, and prices separately
    const partNumbers = extractAllMatches(text, OCR_PATTERNS.PART_NUMBER)
    const quantities = extractAllMatches(text, OCR_PATTERNS.QUANTITY)
    const prices = extractAllMatches(text, OCR_PATTERNS.UNIT_PRICE)
    const descriptions = extractAllMatches(text, OCR_PATTERNS.DESCRIPTION)
    
    // Create line items from available data
    const maxItems = Math.max(partNumbers.length, quantities.length, prices.length, 1)
    
    for (let i = 0; i < maxItems; i++) {
      const lineItem: ParsedLineItem = {
        partNumber: partNumbers[i] || `PART-${i + 1}`,
        description: descriptions[i] || 'Extracted from PDF',
        quantity: parseInt(quantities[i] || '1') || 1,
        unitPrice: parseFloat((prices[i] || '0').replace(/,/g, '')) || 0,
        currency: context.currency || 'C',
        project: context.project,
        category: 'x' // Default to misc for extracted items
      }
      
      // Try to infer category
      lineItem.category = inferCategory(lineItem.description || lineItem.partNumber || '')
      
      lineItems.push(lineItem)
    }
  }
  
  return lineItems
}

/**
 * Infer part category from description/part number text
 */
function inferCategory(text: string): Category {
  const lowerText = text.toLowerCase()
  
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING.keywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category as Category
      }
    }
  }
  
  return 'x' // Default to misc/other
}

/**
 * Extract first match from multiple patterns
 */
function extractFirstMatch(text: string, patterns: readonly RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match && match[1]) {
      pattern.lastIndex = 0 // Reset regex state
      return match[1].trim()
    }
    pattern.lastIndex = 0 // Reset regex state
  }
  return undefined
}

/**
 * Extract all matches from multiple patterns
 */
function extractAllMatches(text: string, patterns: readonly RegExp[]): string[] {
  const matches: string[] = []
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        matches.push(match[1].trim())
      }
    }
    pattern.lastIndex = 0 // Reset regex state
  }
  
  return matches
}

/**
 * Convert parsed data to database-ready parts
 */
export function mapParsedDataToParts(parsed: ParsedPDFData): Partial<CreatePart>[] {
  return parsed.lineItems.map(item => ({
    c: item.category || 'x',
    part: item.partNumber || `UNKNOWN-${Date.now()}`,
    desc: item.description,
    qty: item.quantity || 0,
    po: parsed.poNumber,
    proj: item.project || parsed.project,
    each: item.unitPrice,
    d: item.currency || 'C',
    pn: item.partNumber,
    dwg: item.drawing,
    ord: parsed.orderDate ? formatDateForDB(parsed.orderDate) : undefined,
    s: 1, // Default to "Quoted" status
    n: `Imported from PDF on ${new Date().toISOString()}`
  }))
}

/**
 * Convert date string to YYYY-MM-DD format for database
 */
function formatDateForDB(dateStr: string): string {
  try {
    // Handle various date formats
    const date = new Date(dateStr.replace(/[\/\-]/g, '/'))
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0] // Return today if parsing fails
    }
    return date.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Extract unique suppliers and manufacturers for upserting
 */
export function extractEntitiesForUpsert(parsed: ParsedPDFData): {
  suppliers: Partial<CreateSupplier>[]
  manufacturers: Partial<CreateManufacturer>[]
  customers: Partial<CreateCustomer>[]
} {
  const suppliers: Partial<CreateSupplier>[] = []
  const manufacturers: Partial<CreateManufacturer>[] = []
  const customers: Partial<CreateCustomer>[] = []
  
  if (parsed.supplierName) {
    suppliers.push({
      name: parsed.supplierName,
      notes: `Auto-created from PDF import on ${new Date().toISOString()}`
    })
  }
  
  if (parsed.manufacturerName && parsed.manufacturerName !== parsed.supplierName) {
    manufacturers.push({
      name: parsed.manufacturerName,
      notes: `Auto-created from PDF import on ${new Date().toISOString()}`
    })
  }
  
  if (parsed.customerNumber) {
    customers.push({
      customer_number: parsed.customerNumber,
      name: `Customer ${parsed.customerNumber}`,
      notes: `Auto-created from PDF import on ${new Date().toISOString()}`
    })
  }
  
  return { suppliers, manufacturers, customers }
}

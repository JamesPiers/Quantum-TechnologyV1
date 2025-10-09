/**
 * Zod schemas and TypeScript types for Quantum Technology Parts Management System
 * Maps to database schema and Column Rules from requirements
 */

import { z } from 'zod'

// Database row types (basic types for database interactions)
export const DatabaseId = z.string().uuid()

// Enums and constants
export const CategoryEnum = z.enum(['m', 'e', 't', 's', 'p', 'c', 'v', 'x'])
export const CurrencyEnum = z.enum(['C', 'U'])
export const StatusCodeEnum = z.number().int().min(0).max(9)

export const CategoryLabels = {
  m: 'Material',
  e: 'Electrical', 
  t: 'Electronics',
  s: 'Systems',
  p: 'Plumbing',
  c: 'Compressors',
  v: 'Vacuum',
  x: 'Misc/Other'
} as const

export const CurrencyLabels = {
  C: 'CAD',
  U: 'USD'
} as const

export const LocationCodes = {
  IW: 'Internal Warehouse',
  CP: 'Customer Premises', 
  QW: 'Quantum Warehouse',
  CD: 'Customer Dock',
  NC: 'Not Classified'
} as const

// Core entity schemas
export const ManufacturerSchema = z.object({
  id: DatabaseId,
  name: z.string().min(1, 'Manufacturer name is required'),
  website: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const SupplierSchema = z.object({
  id: DatabaseId,
  name: z.string().min(1, 'Supplier name is required'),
  contact_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const CustomerSchema = z.object({
  id: DatabaseId,
  customer_number: z.string().min(1, 'Customer number is required'),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const StatusCodeSchema = z.object({
  code: StatusCodeEnum,
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Main Parts schema mapping to Column Rules
export const PartSchema = z.object({
  id: DatabaseId,
  
  // Core identification (Column Rules mapping)
  c: CategoryEnum, // Category: m(material), e(electrical), t(electronics), s(systems), p(plumbing), c(compressors), v(vacuum), x(misc/other)
  part: z.string().min(1, 'Part code is required'), // PART column - primary short name/code
  desc: z.string().nullable().optional(), // DESC column - detailed description
  
  // Value parameters
  vp1: z.number().nullable().optional(), // VP1 column - Value parameter 1
  up1: z.string().nullable().optional(), // UP1 column - Units for VP1
  vp2: z.number().nullable().optional(), // VP2 column - Value parameter 2  
  up2: z.string().nullable().optional(), // UP2 column - Units for VP2
  
  // Relationships
  sup: DatabaseId.nullable().optional(), // SUP column - Supplier FK
  mfg: DatabaseId.nullable().optional(), // MFG column - Manufacturer FK
  pn: z.string().nullable().optional(), // PN column - Supplier/manufacturer part number
  
  // Project information
  proj: z.string().nullable().optional(), // PROJ column - Project code (e.g., 538)
  sec: z.string().nullable().optional(), // SEC column - Project section
  dwg: z.string().nullable().optional(), // DWG column - Drawing reference
  id_from_dwg: z.string().nullable().optional(), // ID column - Identifier from drawing
  
  // Quantities
  qty: z.number().int().min(0).default(0), // QTY column - Quantity (not including spares)
  spare: z.number().int().min(0).default(0), // SPARE column - Spares quantity
  
  // Purchase information
  po: z.string().nullable().optional(), // PO column - Purchase order number
  re_sp: z.string().nullable().optional(), // RE SP column - Responsible person initials
  ord: z.string().date().nullable().optional(), // ORD column - Date ordered (YYYYMMDD format in source)
  wk: z.number().int().min(0).nullable().optional(), // WK column - Lead time in weeks
  s: StatusCodeEnum.default(0), // S column - Status code 0-9
  
  // Pricing
  each: z.number().min(0).nullable().optional(), // EACH column - Price per unit
  d: CurrencyEnum.default('C'), // D column - Currency: C=CAD, U=USD
  
  // Additional information
  n: z.string().nullable().optional(), // N column - Notes
  l: z.string().url().nullable().optional(), // L column - Link/URL for part entry
  b: z.boolean().default(false), // B column - Budget line ("S" in source means section pricing estimate)
  w: z.string().nullable().optional(), // W column - Who last updated (initials)
  upd: z.string().date().nullable().optional(), // UPD column - Date updated (YYYYMMDD format in source)
  lc: z.string().nullable().optional(), // LC column - Location/Warehouse codes: IW, CP, QW, CD, NC
  
  // Standard audit fields
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Readable parts view schema (with expanded/humanized fields)
export const PartReadableSchema = z.object({
  id: DatabaseId,
  category_code: CategoryEnum,
  category_name: z.string(),
  part: z.string(),
  description: z.string().nullable(),
  value_param_1: z.number().nullable(),
  units_1: z.string().nullable(),
  value_param_2: z.number().nullable(),
  units_2: z.string().nullable(),
  supplier_name: z.string().nullable(),
  supplier_id: DatabaseId.nullable(),
  manufacturer_name: z.string().nullable(),
  manufacturer_id: DatabaseId.nullable(),
  part_number: z.string().nullable(),
  project: z.string().nullable(),
  section: z.string().nullable(),
  drawing: z.string().nullable(),
  drawing_id: z.string().nullable(),
  quantity: z.number().int(),
  spare_quantity: z.number().int(),
  total_quantity: z.number().int(),
  purchase_order: z.string().nullable(),
  responsible_person: z.string().nullable(),
  order_date: z.string().date().nullable(),
  lead_time_weeks: z.number().int().nullable(),
  status_code: StatusCodeEnum,
  status_label: z.string(),
  status_description: z.string().nullable(),
  unit_price: z.number().nullable(),
  currency_code: CurrencyEnum,
  currency_name: z.string(),
  line_total: z.number(),
  notes: z.string().nullable(),
  link: z.string().nullable(),
  is_budget_item: z.boolean(),
  last_updated_by: z.string().nullable(),
  last_update_date: z.string().date().nullable(),
  location_code: z.string().nullable(),
  location_name: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Purchase order schemas
export const PurchaseOrderSchema = z.object({
  id: DatabaseId,
  po_number: z.string().min(1, 'PO number is required'),
  supplier_id: DatabaseId.nullable().optional(),
  customer_id: DatabaseId.nullable().optional(),
  order_date: z.string().date().nullable().optional(),
  notes: z.string().nullable().optional(),
  currency: CurrencyEnum.default('C'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const POLineItemSchema = z.object({
  id: DatabaseId,
  purchase_order_id: DatabaseId,
  part_id: DatabaseId.nullable().optional(),
  quantity: z.number().int().min(0).default(0),
  unit_price: z.number().min(0).nullable().optional(),
  currency: CurrencyEnum.default('C'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const POSummarySchema = z.object({
  id: DatabaseId,
  po_number: z.string(),
  order_date: z.string().date().nullable(),
  supplier_name: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_number: z.string().nullable(),
  currency: CurrencyEnum,
  line_item_count: z.number().int(),
  total_amount: z.number(),
  earliest_part_order_date: z.string().date().nullable(),
  latest_part_order_date: z.string().date().nullable(),
  unique_parts_count: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Audit and raw ingest schemas
export const AuditEventSchema = z.object({
  id: DatabaseId,
  user_id: DatabaseId.nullable().optional(),
  entity: z.string().min(1),
  entity_id: DatabaseId.nullable().optional(),
  action: z.string().min(1),
  payload: z.record(z.any()).nullable().optional(),
  created_at: z.string().datetime()
})

export const RawIngestSchema = z.object({
  id: DatabaseId,
  file_path: z.string().min(1),
  uploader_user_id: DatabaseId.nullable().optional(),
  parsed_content: z.record(z.any()).nullable().optional(),
  ingest_report: z.record(z.any()).nullable().optional(),
  processing_status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  error_message: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Form schemas (for user input validation)
export const CreateManufacturerSchema = ManufacturerSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const CreateSupplierSchema = SupplierSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const CreatePartSchema = PartSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const UpdatePartSchema = CreatePartSchema.partial()

// Search schemas
export const SearchPartsSchema = z.object({
  po: z.string().optional(),
  customer: z.string().optional(),
  part: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  status: StatusCodeEnum.optional(),
  project: z.string().optional(),
  category: CategoryEnum.optional(),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0)
})

export const SearchResultsSchema = z.object({
  parts: z.array(PartReadableSchema),
  total_count: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  total_pages: z.number().int()
})

// PDF ingest schemas
export const PDFIngestRequestSchema = z.object({
  filePaths: z.array(z.string().min(1)).min(1, 'At least one file path is required')
})

export const PDFIngestReportSchema = z.object({
  partsInserted: z.number().int().min(0),
  partsUpdated: z.number().int().min(0),
  posCreated: z.number().int().min(0),
  warnings: z.array(z.string()),
  errors: z.array(z.string()).optional()
})

// CSV export schema
export const CSVExportSchema = SearchPartsSchema.omit({ limit: true, offset: true })

// TypeScript types derived from schemas
export type DatabaseId = z.infer<typeof DatabaseId>
export type Category = z.infer<typeof CategoryEnum>
export type Currency = z.infer<typeof CurrencyEnum>
export type StatusCode = z.infer<typeof StatusCodeEnum>

export type Manufacturer = z.infer<typeof ManufacturerSchema>
export type Supplier = z.infer<typeof SupplierSchema>
export type Customer = z.infer<typeof CustomerSchema>
export type StatusCodeData = z.infer<typeof StatusCodeSchema>
export type Part = z.infer<typeof PartSchema>
export type PartReadable = z.infer<typeof PartReadableSchema>
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>
export type POLineItem = z.infer<typeof POLineItemSchema>
export type POSummary = z.infer<typeof POSummarySchema>
export type AuditEvent = z.infer<typeof AuditEventSchema>
export type RawIngest = z.infer<typeof RawIngestSchema>

export type CreateManufacturer = z.infer<typeof CreateManufacturerSchema>
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>
export type CreatePart = z.infer<typeof CreatePartSchema>
export type UpdatePart = z.infer<typeof UpdatePartSchema>

export type SearchParts = z.infer<typeof SearchPartsSchema>
export type SearchResults = z.infer<typeof SearchResultsSchema>
export type PDFIngestRequest = z.infer<typeof PDFIngestRequestSchema>
export type PDFIngestReport = z.infer<typeof PDFIngestReportSchema>
export type CSVExport = z.infer<typeof CSVExportSchema>

// Legacy PartRecord type for backward compatibility with Column Rules
export type PartRecord = Part

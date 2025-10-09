/**
 * Search utilities for parts and related data
 */

import { SearchParts, SearchResults, PartReadable } from './schemas'
import { ServerDB } from './supabase-server'

/**
 * Main search function for parts with pagination and filtering
 */
export async function searchParts(params: SearchParts): Promise<SearchResults> {
  const db = new ServerDB()
  
  const { data, error } = await db.getParts({
    po: params.po,
    customer: params.customer,
    part: params.part,
    manufacturer: params.manufacturer,
    supplier: params.supplier,
    status: params.status,
    project: params.project,
    category: params.category,
    limit: params.limit,
    offset: params.offset
  })
  
  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    return {
      parts: [],
      total_count: 0,
      page: Math.floor(params.offset / params.limit) + 1,
      limit: params.limit,
      total_pages: 0
    }
  }
  
  const result = data[0]
  const parts = result.parts_data ? JSON.parse(JSON.stringify(result.parts_data)) : []
  const totalCount = result.total_count || 0
  
  return {
    parts: parts as PartReadable[],
    total_count: totalCount,
    page: Math.floor(params.offset / params.limit) + 1,
    limit: params.limit,
    total_pages: Math.ceil(totalCount / params.limit)
  }
}

/**
 * Get search facets (counts for filters)
 */
export async function getSearchFacets(baseFilters?: Partial<SearchParts>) {
  const db = new ServerDB()
  
  // Get unique manufacturers
  const { data: manufacturers } = await db.getManufacturers()
  
  // Get unique suppliers
  const { data: suppliers } = await db.getSuppliers()
  
  // Get status codes
  const { data: statusCodes } = await db.getStatusCodes()
  
  // Get unique categories and projects from parts
  // Note: This is a simplified version - in production you'd want to count based on current filters
  const { data: partsData } = await db.getParts({ limit: 1000 })
  
  let categories: { code: string; name: string; count: number }[] = []
  let projects: { code: string; count: number }[] = []
  let pos: { po: string; count: number }[] = []
  
  if (partsData && partsData.length > 0 && partsData[0].parts_data) {
    const parts = JSON.parse(JSON.stringify(partsData[0].parts_data)) as PartReadable[]
    
    // Count categories
    const categoryCount = new Map<string, number>()
    const projectCount = new Map<string, number>()
    const poCount = new Map<string, number>()
    
    parts.forEach(part => {
      // Categories
      const catKey = `${part.category_code}:${part.category_name}`
      categoryCount.set(catKey, (categoryCount.get(catKey) || 0) + 1)
      
      // Projects
      if (part.project) {
        projectCount.set(part.project, (projectCount.get(part.project) || 0) + 1)
      }
      
      // POs
      if (part.purchase_order) {
        poCount.set(part.purchase_order, (poCount.get(part.purchase_order) || 0) + 1)
      }
    })
    
    categories = Array.from(categoryCount.entries()).map(([key, count]) => {
      const [code, name] = key.split(':')
      return { code, name, count }
    })
    
    projects = Array.from(projectCount.entries()).map(([code, count]) => ({
      code, count
    }))
    
    pos = Array.from(poCount.entries()).map(([po, count]) => ({
      po, count
    }))
  }
  
  return {
    manufacturers: manufacturers?.map(m => ({ id: m.id, name: m.name })) || [],
    suppliers: suppliers?.map(s => ({ id: s.id, name: s.name })) || [],
    statusCodes: statusCodes?.map(sc => ({ 
      code: sc.code, 
      label: sc.label, 
      description: sc.description 
    })) || [],
    categories,
    projects,
    purchaseOrders: pos
  }
}

/**
 * Quick search across multiple fields
 */
export async function quickSearch(query: string, limit = 20): Promise<PartReadable[]> {
  if (!query.trim()) return []
  
  const searchParams: SearchParts = {
    part: query,
    limit,
    offset: 0
  }
  
  const results = await searchParts(searchParams)
  return results.parts
}

/**
 * Search suggestions/autocomplete
 */
export async function getSearchSuggestions(field: 'part' | 'po' | 'manufacturer' | 'supplier' | 'project', query: string) {
  if (!query.trim() || query.length < 2) return []
  
  const db = new ServerDB()
  
  switch (field) {
    case 'manufacturer': {
      const { data } = await db.getManufacturers()
      return data?.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10).map(m => ({ value: m.name, label: m.name })) || []
    }
    
    case 'supplier': {
      const { data } = await db.getSuppliers()
      return data?.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10).map(s => ({ value: s.name, label: s.name })) || []
    }
    
    case 'part':
    case 'po':
    case 'project': {
      // For these fields, we'd need to search the parts table
      // This is a simplified version - you could optimize with specific indexes
      const searchParam = {
        [field]: query,
        limit: 10,
        offset: 0
      } as SearchParts
      
      const results = await searchParts(searchParam)
      
      const suggestions = new Set<string>()
      results.parts.forEach(part => {
        let value = ''
        switch (field) {
          case 'part':
            value = part.part
            break
          case 'po':
            value = part.purchase_order || ''
            break
          case 'project':
            value = part.project || ''
            break
        }
        if (value && value.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(value)
        }
      })
      
      return Array.from(suggestions).slice(0, 10).map(value => ({ value, label: value }))
    }
    
    default:
      return []
  }
}

/**
 * Advanced search with multiple filters
 */
export interface AdvancedSearchFilters {
  // Text filters
  partCode?: string
  partNumber?: string
  description?: string
  purchaseOrder?: string
  project?: string
  
  // Dropdown filters
  category?: string
  status?: number
  manufacturerId?: string
  supplierId?: string
  customerId?: string
  
  // Range filters
  quantityMin?: number
  quantityMax?: number
  priceMin?: number
  priceMax?: number
  leadTimeMin?: number
  leadTimeMax?: number
  
  // Date filters
  orderDateFrom?: string
  orderDateTo?: string
  updateDateFrom?: string
  updateDateTo?: string
  
  // Boolean filters
  budgetItemsOnly?: boolean
  sparesIncluded?: boolean
  
  // Location filter
  location?: string
  
  // Pagination
  page?: number
  limit?: number
  
  // Sorting
  sortBy?: 'part' | 'updated_at' | 'order_date' | 'unit_price' | 'quantity'
  sortOrder?: 'asc' | 'desc'
}

export async function advancedSearch(filters: AdvancedSearchFilters): Promise<SearchResults> {
  // Convert advanced filters to basic search params
  // This is a simplified version - you'd want to extend the RPC function for more advanced filtering
  
  const searchParams: SearchParts = {
    part: filters.partCode || filters.partNumber || filters.description,
    po: filters.purchaseOrder,
    project: filters.project,
    category: filters.category as any,
    status: filters.status,
    limit: filters.limit || 50,
    offset: ((filters.page || 1) - 1) * (filters.limit || 50)
  }
  
  // For manufacturer/supplier, we'd need to resolve IDs to names
  if (filters.manufacturerId) {
    const db = new ServerDB()
    const { data: manufacturers } = await db.getManufacturers()
    const manufacturer = manufacturers?.find(m => m.id === filters.manufacturerId)
    if (manufacturer) {
      searchParams.manufacturer = manufacturer.name
    }
  }
  
  if (filters.supplierId) {
    const db = new ServerDB()
    const { data: suppliers } = await db.getSuppliers()
    const supplier = suppliers?.find(s => s.id === filters.supplierId)
    if (supplier) {
      searchParams.supplier = supplier.name
    }
  }
  
  return await searchParts(searchParams)
}

/**
 * Export search results to CSV format
 */
export function formatPartsForCSV(parts: PartReadable[]): string {
  const headers = [
    'ID',
    'Category',
    'Part Code',
    'Description', 
    'Part Number',
    'Quantity',
    'Spare Qty',
    'Unit Price',
    'Currency',
    'Line Total',
    'PO Number',
    'Project',
    'Section',
    'Drawing',
    'Supplier',
    'Manufacturer',
    'Status',
    'Order Date',
    'Lead Time (Weeks)',
    'Location',
    'Responsible Person',
    'Notes',
    'Last Updated',
    'Updated By'
  ]
  
  const rows = parts.map(part => [
    part.id,
    part.category_name,
    part.part,
    part.description || '',
    part.part_number || '',
    part.quantity,
    part.spare_quantity,
    part.unit_price || '',
    part.currency_name,
    part.line_total,
    part.purchase_order || '',
    part.project || '',
    part.section || '',
    part.drawing || '',
    part.supplier_name || '',
    part.manufacturer_name || '',
    part.status_label,
    part.order_date || '',
    part.lead_time_weeks || '',
    part.location_name || '',
    part.responsible_person || '',
    part.notes || '',
    part.last_update_date || '',
    part.last_updated_by || ''
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  
  return csvContent
}

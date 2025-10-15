/**
 * Search utilities for parts and related data
 */

import { SearchParts, SearchResults, PartReadable } from './schemas'
import { ServerDB } from './supabase-server'

/**
 * Main search function for parts with pagination, filtering, and sorting
 */
export async function searchParts(params: SearchParts): Promise<SearchResults> {
  const db = await ServerDB.create()
  
  // Use basic fields for database query
  const { data, error } = await db.getParts({
    po: params.po,
    customer: params.customer,
    part: params.part,
    manufacturer: params.manufacturer,
    supplier: params.supplier,
    status: params.status,
    project: params.project,
    category: params.category,
    limit: 1000, // Get more results for client-side filtering
    offset: 0
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
  let parts = result.parts_data ? JSON.parse(JSON.stringify(result.parts_data)) as PartReadable[] : []
  
  // Apply enhanced client-side filtering
  if (parts.length > 0) {
    // Text filters
    if (params.resp) {
      parts = parts.filter(part => 
        part.responsible_person?.toLowerCase().includes(params.resp!.toLowerCase())
      )
    }
    
    if (params.description) {
      parts = parts.filter(part => 
        part.description?.toLowerCase().includes(params.description!.toLowerCase())
      )
    }
    
    if (params.part_number) {
      parts = parts.filter(part => 
        part.part_number?.toLowerCase().includes(params.part_number!.toLowerCase())
      )
    }
    
    if (params.section) {
      parts = parts.filter(part => 
        part.section?.toLowerCase().includes(params.section!.toLowerCase())
      )
    }
    
    if (params.drawing) {
      parts = parts.filter(part => 
        part.drawing?.toLowerCase().includes(params.drawing!.toLowerCase())
      )
    }
    
    if (params.drawing_id) {
      parts = parts.filter(part => 
        part.drawing_id?.toLowerCase().includes(params.drawing_id!.toLowerCase())
      )
    }
    
    if (params.notes) {
      parts = parts.filter(part => 
        part.notes?.toLowerCase().includes(params.notes!.toLowerCase())
      )
    }
    
    if (params.last_updated_by) {
      parts = parts.filter(part => 
        part.last_updated_by?.toLowerCase().includes(params.last_updated_by!.toLowerCase())
      )
    }
    
    // Dropdown filters
    if (params.currency) {
      parts = parts.filter(part => part.currency_code === params.currency)
    }
    
    if (params.location_code) {
      parts = parts.filter(part => part.location_code === params.location_code)
    }
    
    // Range filters
    if (params.quantity_min) {
      const min = parseInt(params.quantity_min)
      if (!isNaN(min)) {
        parts = parts.filter(part => part.quantity >= min)
      }
    }
    
    if (params.quantity_max) {
      const max = parseInt(params.quantity_max)
      if (!isNaN(max)) {
        parts = parts.filter(part => part.quantity <= max)
      }
    }
    
    if (params.price_min) {
      const min = parseFloat(params.price_min)
      if (!isNaN(min)) {
        parts = parts.filter(part => part.unit_price !== null && part.unit_price >= min)
      }
    }
    
    if (params.price_max) {
      const max = parseFloat(params.price_max)
      if (!isNaN(max)) {
        parts = parts.filter(part => part.unit_price !== null && part.unit_price <= max)
      }
    }
    
    // Date filters
    if (params.order_date_from) {
      parts = parts.filter(part => 
        part.order_date && part.order_date >= params.order_date_from!
      )
    }
    
    if (params.order_date_to) {
      parts = parts.filter(part => 
        part.order_date && part.order_date <= params.order_date_to!
      )
    }
    
    // Boolean filters
    if (params.budget_items_only === 'true') {
      parts = parts.filter(part => part.is_budget_item === true)
    } else if (params.budget_items_only === 'false') {
      parts = parts.filter(part => part.is_budget_item === false)
    }
    
    if (params.has_spares === 'true') {
      parts = parts.filter(part => part.spare_quantity > 0)
    } else if (params.has_spares === 'false') {
      parts = parts.filter(part => part.spare_quantity === 0)
    }
  }
  
  // Client-side sorting
  if (params.sort && params.order && parts.length > 0) {
    parts = [...parts].sort((a, b) => {
      const sortField = params.sort!
      let aValue = (a as any)[sortField]
      let bValue = (b as any)[sortField]
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return params.order === 'asc' ? 1 : -1
      if (bValue == null) return params.order === 'asc' ? -1 : 1
      
      // Convert to comparable types
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()
      
      if (params.order === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
    })
  }
  
  // Apply pagination after filtering and sorting
  const totalCount = parts.length
  const startIndex = params.offset
  const endIndex = startIndex + params.limit
  const paginatedParts = parts.slice(startIndex, endIndex)
  
  return {
    parts: paginatedParts,
    total_count: totalCount,
    page: Math.floor(params.offset / params.limit) + 1,
    limit: params.limit,
    total_pages: Math.ceil(totalCount / params.limit)
  }
}

/**
 * Get search facets (counts for filters)
 */
export async function getSearchFacets(_baseFilters?: Partial<SearchParts>) {
  const db = await ServerDB.create()
  
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
  
  const db = await ServerDB.create()
  
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
  search?: string
  partCode?: string
  partNumber?: string
  description?: string
  purchaseOrder?: string
  project?: string
  section?: string
  drawing?: string
  drawingId?: string
  responsiblePerson?: string
  notes?: string
  lastUpdatedBy?: string
  
  // Dropdown filters
  category?: string
  status?: number
  manufacturerId?: string
  supplierId?: string
  customerId?: string
  currency?: string
  locationCode?: string
  
  // Range filters
  quantityMin?: number
  quantityMax?: number
  spareQuantityMin?: number
  spareQuantityMax?: number
  priceMin?: number
  priceMax?: number
  leadTimeMin?: number
  leadTimeMax?: number
  valueParam1Min?: number
  valueParam1Max?: number
  valueParam2Min?: number
  valueParam2Max?: number
  
  // Date filters
  orderDateFrom?: string
  orderDateTo?: string
  updateDateFrom?: string
  updateDateTo?: string
  
  // Boolean filters
  budgetItemsOnly?: boolean
  hasSpares?: boolean
  
  // Pagination
  page?: number
  limit?: number
  offset?: number
  
  // Sorting
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function advancedSearch(filters: AdvancedSearchFilters): Promise<SearchResults> {
  // Convert advanced filters to basic search params with sorting
  const searchParams: SearchParts & { sort?: string; order?: 'asc' | 'desc' } = {
    part: filters.search || filters.partCode || filters.partNumber || filters.description,
    po: filters.purchaseOrder,
    project: filters.project,
    category: filters.category as any,
    status: filters.status,
    limit: filters.limit || 50,
    offset: filters.offset || ((filters.page || 1) - 1) * (filters.limit || 50),
    sort: filters.sortBy,
    order: filters.sortOrder
  }
  
  // For manufacturer/supplier, we'd need to resolve IDs to names
  if (filters.manufacturerId) {
    const db = await ServerDB.create()
    const { data: manufacturers } = await db.getManufacturers()
    const manufacturer = manufacturers?.find(m => m.id === filters.manufacturerId)
    if (manufacturer) {
      searchParams.manufacturer = manufacturer.name
    }
  }
  
  if (filters.supplierId) {
    const db = await ServerDB.create()
    const { data: suppliers } = await db.getSuppliers()
    const supplier = suppliers?.find(s => s.id === filters.supplierId)
    if (supplier) {
      searchParams.supplier = supplier.name
    }
  }
  
  // Get basic results first
  let results = await searchParts(searchParams)
  
  // Apply additional client-side filtering for advanced filters not supported by the backend
  if (results.parts.length > 0) {
    let filteredParts = results.parts
    
    // Text filters
    if (filters.section) {
      filteredParts = filteredParts.filter(part => 
        part.section?.toLowerCase().includes(filters.section!.toLowerCase())
      )
    }
    
    if (filters.drawing) {
      filteredParts = filteredParts.filter(part => 
        part.drawing?.toLowerCase().includes(filters.drawing!.toLowerCase())
      )
    }
    
    if (filters.drawingId) {
      filteredParts = filteredParts.filter(part => 
        part.drawing_id?.toLowerCase().includes(filters.drawingId!.toLowerCase())
      )
    }
    
    if (filters.responsiblePerson) {
      filteredParts = filteredParts.filter(part => 
        part.responsible_person?.toLowerCase().includes(filters.responsiblePerson!.toLowerCase())
      )
    }
    
    if (filters.notes) {
      filteredParts = filteredParts.filter(part => 
        part.notes?.toLowerCase().includes(filters.notes!.toLowerCase())
      )
    }
    
    if (filters.lastUpdatedBy) {
      filteredParts = filteredParts.filter(part => 
        part.last_updated_by?.toLowerCase().includes(filters.lastUpdatedBy!.toLowerCase())
      )
    }
    
    // Currency filter
    if (filters.currency) {
      filteredParts = filteredParts.filter(part => part.currency_code === filters.currency)
    }
    
    // Location filter
    if (filters.locationCode) {
      filteredParts = filteredParts.filter(part => part.location_code === filters.locationCode)
    }
    
    // Range filters
    if (filters.quantityMin !== undefined) {
      filteredParts = filteredParts.filter(part => part.quantity >= filters.quantityMin!)
    }
    
    if (filters.quantityMax !== undefined) {
      filteredParts = filteredParts.filter(part => part.quantity <= filters.quantityMax!)
    }
    
    if (filters.spareQuantityMin !== undefined) {
      filteredParts = filteredParts.filter(part => part.spare_quantity >= filters.spareQuantityMin!)
    }
    
    if (filters.spareQuantityMax !== undefined) {
      filteredParts = filteredParts.filter(part => part.spare_quantity <= filters.spareQuantityMax!)
    }
    
    if (filters.priceMin !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.unit_price !== null && part.unit_price >= filters.priceMin!
      )
    }
    
    if (filters.priceMax !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.unit_price !== null && part.unit_price <= filters.priceMax!
      )
    }
    
    if (filters.leadTimeMin !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.lead_time_weeks !== null && part.lead_time_weeks >= filters.leadTimeMin!
      )
    }
    
    if (filters.leadTimeMax !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.lead_time_weeks !== null && part.lead_time_weeks <= filters.leadTimeMax!
      )
    }
    
    if (filters.valueParam1Min !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.value_param_1 !== null && part.value_param_1 >= filters.valueParam1Min!
      )
    }
    
    if (filters.valueParam1Max !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.value_param_1 !== null && part.value_param_1 <= filters.valueParam1Max!
      )
    }
    
    if (filters.valueParam2Min !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.value_param_2 !== null && part.value_param_2 >= filters.valueParam2Min!
      )
    }
    
    if (filters.valueParam2Max !== undefined) {
      filteredParts = filteredParts.filter(part => 
        part.value_param_2 !== null && part.value_param_2 <= filters.valueParam2Max!
      )
    }
    
    // Date filters
    if (filters.orderDateFrom) {
      filteredParts = filteredParts.filter(part => 
        part.order_date && part.order_date >= filters.orderDateFrom!
      )
    }
    
    if (filters.orderDateTo) {
      filteredParts = filteredParts.filter(part => 
        part.order_date && part.order_date <= filters.orderDateTo!
      )
    }
    
    if (filters.updateDateFrom) {
      filteredParts = filteredParts.filter(part => 
        part.last_update_date && part.last_update_date >= filters.updateDateFrom!
      )
    }
    
    if (filters.updateDateTo) {
      filteredParts = filteredParts.filter(part => 
        part.last_update_date && part.last_update_date <= filters.updateDateTo!
      )
    }
    
    // Boolean filters
    if (filters.budgetItemsOnly === true) {
      filteredParts = filteredParts.filter(part => part.is_budget_item === true)
    } else if (filters.budgetItemsOnly === false) {
      filteredParts = filteredParts.filter(part => part.is_budget_item === false)
    }
    
    if (filters.hasSpares === true) {
      filteredParts = filteredParts.filter(part => part.spare_quantity > 0)
    } else if (filters.hasSpares === false) {
      filteredParts = filteredParts.filter(part => part.spare_quantity === 0)
    }
    
    // Update results with filtered parts
    results = {
      ...results,
      parts: filteredParts,
      total_count: filteredParts.length,
      total_pages: Math.ceil(filteredParts.length / (filters.limit || 50))
    }
  }
  
  return results
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

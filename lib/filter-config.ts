/**
 * Filter field configuration for dynamic filtering system
 */

import { CategoryLabels, CurrencyLabels, LocationCodes } from './schemas'

export type FilterFieldType = 
  | 'text' 
  | 'select' 
  | 'multiselect' 
  | 'date' 
  | 'daterange' 
  | 'number' 
  | 'numberrange' 
  | 'boolean'

export interface FilterFieldOption {
  value: string | number
  label: string
  description?: string
}

export interface FilterFieldConfig {
  key: string
  label: string
  type: FilterFieldType
  placeholder?: string
  description?: string
  options?: FilterFieldOption[]
  minValue?: number
  maxValue?: number
  defaultValue?: any
  searchable?: boolean // For select fields
  async?: boolean // For options that need to be loaded async
}

export const FILTER_FIELDS: Record<string, FilterFieldConfig> = {
  // Basic text search
  search: {
    key: 'search',
    label: 'General Search',
    type: 'text',
    placeholder: 'Search part code, description, MPN...',
    description: 'Search across multiple fields'
  },
  
  // Identification fields
  part: {
    key: 'part',
    label: 'Part Code',
    type: 'text',
    placeholder: 'Enter part code...'
  },
  
  part_number: {
    key: 'part_number',
    label: 'Part Number (MPN)',
    type: 'text',
    placeholder: 'Enter manufacturer part number...'
  },
  
  description: {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'Enter description keywords...'
  },
  
  // Category and classification
  category: {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: Object.entries(CategoryLabels).map(([code, label]) => ({
      value: code,
      label: `${label} (${code})`
    })),
    searchable: true
  },
  
  // Project information
  project: {
    key: 'project',
    label: 'Project',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type project...'
  },
  
  section: {
    key: 'section',
    label: 'Section',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type section...'
  },
  
  drawing: {
    key: 'drawing',
    label: 'Drawing',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type drawing...'
  },
  
  drawing_id: {
    key: 'drawing_id',
    label: 'Drawing ID',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type drawing ID...'
  },
  
  // Purchase information
  purchase_order: {
    key: 'purchase_order',
    label: 'Purchase Order',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type PO number...'
  },
  
  responsible_person: {
    key: 'responsible_person',
    label: 'Responsible Person',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type person...'
  },
  
  // Supplier and manufacturer (async loaded)
  supplier: {
    key: 'supplier',
    label: 'Supplier',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type supplier...'
  },
  
  manufacturer: {
    key: 'manufacturer',
    label: 'Manufacturer',
    type: 'select',
    async: true,
    searchable: true,
    placeholder: 'Select or type manufacturer...'
  },
  
  // Status
  status: {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 0, label: 'Unknown' },
      { value: 1, label: 'Quoted' },
      { value: 2, label: 'Ordered' },
      { value: 3, label: 'Shipped' },
      { value: 4, label: 'Received' },
      { value: 5, label: 'Installed' },
      { value: 6, label: 'Backorder' },
      { value: 7, label: 'Cancelled' },
      { value: 8, label: 'Returned' },
      { value: 9, label: 'Archived' }
    ],
    searchable: true
  },
  
  // Quantities
  quantity: {
    key: 'quantity',
    label: 'Quantity',
    type: 'numberrange',
    minValue: 0,
    placeholder: 'Min - Max quantity'
  },
  
  spare_quantity: {
    key: 'spare_quantity',
    label: 'Spare Quantity',
    type: 'numberrange',
    minValue: 0,
    placeholder: 'Min - Max spare quantity'
  },
  
  // Pricing
  unit_price: {
    key: 'unit_price',
    label: 'Unit Price',
    type: 'numberrange',
    minValue: 0,
    placeholder: 'Min - Max price'
  },
  
  currency: {
    key: 'currency',
    label: 'Currency',
    type: 'select',
    options: Object.entries(CurrencyLabels).map(([code, label]) => ({
      value: code,
      label: `${label} (${code})`
    }))
  },
  
  // Dates
  order_date: {
    key: 'order_date',
    label: 'Order Date',
    type: 'daterange',
    description: 'Filter by order date range'
  },
  
  last_update_date: {
    key: 'last_update_date',
    label: 'Last Updated',
    type: 'daterange',
    description: 'Filter by last update date'
  },
  
  // Lead time
  lead_time_weeks: {
    key: 'lead_time_weeks',
    label: 'Lead Time (Weeks)',
    type: 'numberrange',
    minValue: 0,
    placeholder: 'Min - Max weeks'
  },
  
  // Location
  location_code: {
    key: 'location_code',
    label: 'Location',
    type: 'select',
    options: Object.entries(LocationCodes).map(([code, label]) => ({
      value: code,
      label: `${label} (${code})`
    })),
    searchable: true
  },
  
  // Boolean fields
  is_budget_item: {
    key: 'is_budget_item',
    label: 'Budget Items Only',
    type: 'boolean',
    description: 'Show only budget line items'
  },
  
  has_spares: {
    key: 'has_spares',
    label: 'Has Spare Parts',
    type: 'boolean',
    description: 'Show only items with spare quantities > 0'
  },
  
  // Value parameters
  value_param_1: {
    key: 'value_param_1',
    label: 'Value Parameter 1',
    type: 'numberrange',
    placeholder: 'Min - Max value'
  },
  
  value_param_2: {
    key: 'value_param_2',
    label: 'Value Parameter 2',
    type: 'numberrange',
    placeholder: 'Min - Max value'
  },
  
  // Text fields for additional info
  notes: {
    key: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Search in notes...'
  },
  
  last_updated_by: {
    key: 'last_updated_by',
    label: 'Updated By',
    type: 'text',
    placeholder: 'Enter initials...'
  }
}

// Common filter field groups for quick selection
export const FILTER_FIELD_GROUPS = {
  essential: {
    label: 'Essential Filters',
    description: 'Most commonly used filters',
    fields: ['search', 'category', 'status', 'project', 'supplier']
  },
  identification: {
    label: 'Part Identification', 
    description: 'Fields for identifying specific parts',
    fields: ['part', 'part_number', 'description', 'drawing', 'drawing_id']
  },
  procurement: {
    label: 'Procurement Info',
    description: 'Purchase and supplier related fields',
    fields: ['purchase_order', 'supplier', 'manufacturer', 'status', 'order_date', 'responsible_person']
  },
  quantities: {
    label: 'Quantities & Pricing',
    description: 'Quantity and cost related fields',
    fields: ['quantity', 'spare_quantity', 'unit_price', 'currency', 'is_budget_item']
  },
  project: {
    label: 'Project Details',
    description: 'Project and drawing information',
    fields: ['project', 'section', 'drawing', 'drawing_id', 'location_code']
  },
  advanced: {
    label: 'Advanced Filters',
    description: 'Less commonly used but powerful filters',
    fields: ['lead_time_weeks', 'value_param_1', 'value_param_2', 'notes', 'last_updated_by', 'last_update_date']
  }
} as const

// Default filter preferences for new users
export const DEFAULT_FILTER_PREFERENCES = {
  activeFields: ['search', 'category', 'status', 'project', 'supplier'],
  layout: 'grid' as 'grid' | 'stack',
  showFieldGroups: true,
  autoApply: false
}

// Sorting configuration
export interface SortConfig {
  key: string
  label: string
  sortable: boolean
  defaultOrder?: 'asc' | 'desc'
}

export const SORT_FIELDS: Record<string, SortConfig> = {
  part: { key: 'part', label: 'Part Code', sortable: true, defaultOrder: 'asc' },
  description: { key: 'description', label: 'Description', sortable: true, defaultOrder: 'asc' },
  category_name: { key: 'category_name', label: 'Category', sortable: true, defaultOrder: 'asc' },
  supplier_name: { key: 'supplier_name', label: 'Supplier', sortable: true, defaultOrder: 'asc' },
  manufacturer_name: { key: 'manufacturer_name', label: 'Manufacturer', sortable: true, defaultOrder: 'asc' },
  part_number: { key: 'part_number', label: 'MPN', sortable: true, defaultOrder: 'asc' },
  quantity: { key: 'quantity', label: 'Quantity', sortable: true, defaultOrder: 'desc' },
  unit_price: { key: 'unit_price', label: 'Unit Price', sortable: true, defaultOrder: 'desc' },
  order_date: { key: 'order_date', label: 'Order Date', sortable: true, defaultOrder: 'desc' },
  status_label: { key: 'status_label', label: 'Status', sortable: true, defaultOrder: 'asc' },
  project: { key: 'project', label: 'Project', sortable: true, defaultOrder: 'asc' },
  purchase_order: { key: 'purchase_order', label: 'PO', sortable: true, defaultOrder: 'asc' },
  updated_at: { key: 'updated_at', label: 'Last Updated', sortable: true, defaultOrder: 'desc' }
}

/**
 * Load dropdown options for async filter fields
 * Fetches ALL unique values from the database for a given field
 */
export async function loadFilterOptions(fieldKey: string): Promise<{ value: string; label: string }[]> {
  try {
    console.log(`[loadFilterOptions] Fetching options for: ${fieldKey}`)
    
    // Use dedicated filter options API endpoint
    const response = await fetch(`/api/filters/options?field=${fieldKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    })
    
    console.log(`[loadFilterOptions] Response status for ${fieldKey}:`, response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[loadFilterOptions] Failed to load options for ${fieldKey}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return []
    }
    
    const data = await response.json()
    
    if (data.error) {
      console.error(`[loadFilterOptions] API error for ${fieldKey}:`, data.error)
      return []
    }
    
    const options = data.options || []
    console.log(`[loadFilterOptions] Loaded ${options.length} options for ${fieldKey}`)
    
    return options
    
  } catch (error) {
    console.error(`[loadFilterOptions] Exception loading options for ${fieldKey}:`, error)
    return []
  }
}

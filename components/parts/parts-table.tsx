/**
 * Parts data table with search and pagination
 */

import { searchParts } from '@/lib/search'
import { SearchPartsSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ResizablePartsTable } from './resizable-parts-table'

interface PartsTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function PartsTable({ searchParams }: PartsTableProps) {
  // Parse all search parameters including enhanced filters and sorting
  const params = {
    // Basic search fields
    po: typeof searchParams.po === 'string' ? searchParams.po : undefined,
    customer: typeof searchParams.customer === 'string' ? searchParams.customer : undefined,
    part: typeof searchParams.part === 'string' ? searchParams.part : undefined,
    manufacturer: typeof searchParams.manufacturer === 'string' ? searchParams.manufacturer : undefined,
    supplier: typeof searchParams.supplier === 'string' ? searchParams.supplier : undefined,
    status: typeof searchParams.status === 'string' ? parseInt(searchParams.status) : undefined,
    project: typeof searchParams.project === 'string' ? searchParams.project : undefined,
    category: typeof searchParams.category === 'string' ? searchParams.category : undefined,
    
    // Enhanced filter fields
    resp: typeof searchParams.resp === 'string' ? searchParams.resp : undefined,
    description: typeof searchParams.description === 'string' ? searchParams.description : undefined,
    part_number: typeof searchParams.part_number === 'string' ? searchParams.part_number : undefined,
    section: typeof searchParams.section === 'string' ? searchParams.section : undefined,
    drawing: typeof searchParams.drawing === 'string' ? searchParams.drawing : undefined,
    drawing_id: typeof searchParams.drawing_id === 'string' ? searchParams.drawing_id : undefined,
    notes: typeof searchParams.notes === 'string' ? searchParams.notes : undefined,
    currency: typeof searchParams.currency === 'string' ? searchParams.currency : undefined,
    location_code: typeof searchParams.location_code === 'string' ? searchParams.location_code : undefined,
    last_updated_by: typeof searchParams.last_updated_by === 'string' ? searchParams.last_updated_by : undefined,
    
    // Range filters
    quantity_min: typeof searchParams.quantity_min === 'string' ? searchParams.quantity_min : undefined,
    quantity_max: typeof searchParams.quantity_max === 'string' ? searchParams.quantity_max : undefined,
    price_min: typeof searchParams.price_min === 'string' ? searchParams.price_min : undefined,
    price_max: typeof searchParams.price_max === 'string' ? searchParams.price_max : undefined,
    
    // Date filters
    order_date_from: typeof searchParams.order_date_from === 'string' ? searchParams.order_date_from : undefined,
    order_date_to: typeof searchParams.order_date_to === 'string' ? searchParams.order_date_to : undefined,
    
    // Boolean filters
    budget_items_only: typeof searchParams.budget_items_only === 'string' ? searchParams.budget_items_only : undefined,
    has_spares: typeof searchParams.has_spares === 'string' ? searchParams.has_spares : undefined,
    
    // Sorting
    sort: typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
    order: typeof searchParams.order === 'string' ? searchParams.order as 'asc' | 'desc' : undefined,
    
    // Pagination
    limit: 50,
    offset: 0
  }
  
  try {
    const validatedParams = SearchPartsSchema.parse(params)
    const results = await searchParts(validatedParams)
    
    if (results.parts.length === 0) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-500">No parts found matching your criteria.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/parts">Clear Filters</Link>
          </Button>
        </div>
      )
    }
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Showing {results.parts.length} of {results.total_count} parts
          </p>
        </div>
        
        <ResizablePartsTable parts={results.parts} />
      </div>
    )
  } catch (error) {
    console.error('Error loading parts:', error)
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading parts. Please try again.</p>
      </div>
    )
  }
}

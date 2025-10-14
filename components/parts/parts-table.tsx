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
  // Parse search parameters
  const params = {
    po: typeof searchParams.po === 'string' ? searchParams.po : undefined,
    customer: typeof searchParams.customer === 'string' ? searchParams.customer : undefined,
    part: typeof searchParams.part === 'string' ? searchParams.part : undefined,
    manufacturer: typeof searchParams.manufacturer === 'string' ? searchParams.manufacturer : undefined,
    supplier: typeof searchParams.supplier === 'string' ? searchParams.supplier : undefined,
    status: typeof searchParams.status === 'string' ? parseInt(searchParams.status) : undefined,
    project: typeof searchParams.project === 'string' ? searchParams.project : undefined,
    category: typeof searchParams.category === 'string' ? searchParams.category : undefined,
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

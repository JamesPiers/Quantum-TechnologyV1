/**
 * Parts data table with search and pagination
 */

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { searchParts } from '@/lib/search'
import { formatCurrency, formatCategory, formatStatus } from '@/lib/format'
import { SearchPartsSchema } from '@/lib/schemas'
import { Eye, Edit } from 'lucide-react'
import Link from 'next/link'

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
    category: typeof searchParams.category === 'string' ? searchParams.category as any : undefined,
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
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.parts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">
                    {part.part}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{part.description || 'No description'}</p>
                      {part.part_number && (
                        <p className="text-xs text-gray-500">PN: {part.part_number}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {part.category_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span>{part.quantity}</span>
                      {part.spare_quantity > 0 && (
                        <span className="text-xs text-gray-500">
                          (+{part.spare_quantity} spare)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {part.unit_price ? (
                      formatCurrency(part.unit_price, part.currency_code)
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {part.supplier_name || (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={part.status_code === 4 ? 'default' : 'secondary'}
                      className={
                        part.status_code === 6 ? 'bg-orange-100 text-orange-800' :
                        part.status_code === 4 ? 'bg-green-100 text-green-800' :
                        part.status_code === 7 ? 'bg-red-100 text-red-800' : ''
                      }
                    >
                      {part.status_label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/parts/${part.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/parts/${part.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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

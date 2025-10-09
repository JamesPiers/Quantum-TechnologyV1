/**
 * Parts management page with search, filtering, and data table
 */

import { Suspense } from 'react'
import { PartsTable } from '@/components/parts/parts-table'
import { PartsFilters } from '@/components/parts/parts-filters'
import { PartsHeader } from '@/components/parts/parts-header'
import { Card } from '@/components/ui/card'

export default function PartsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PartsHeader />
      
      {/* Filters */}
      <Card className="p-6">
        <PartsFilters />
      </Card>
      
      {/* Parts Table */}
      <Card>
        <Suspense fallback={<PartsTableSkeleton />}>
          <PartsTable searchParams={searchParams} />
        </Suspense>
      </Card>
    </div>
  )
}

function PartsTableSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {/* Table header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        
        {/* Table rows skeleton */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded animate-pulse">
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

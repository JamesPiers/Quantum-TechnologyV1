/**
 * Manufacturers management page
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function ManufacturersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manufacturers</h1>
          <p className="text-gray-500 mt-1">
            Manage manufacturer information and relationships
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Manufacturer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search manufacturers..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">Filters</Button>
        </div>
      </Card>

      {/* Manufacturers Table */}
      <Card className="p-6">
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No manufacturers found</p>
          <p className="text-sm mt-2">Get started by adding your first manufacturer</p>
        </div>
      </Card>
    </div>
  )
}


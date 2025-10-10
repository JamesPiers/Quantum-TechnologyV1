/**
 * Parts filtering component
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { CategoryLabels } from '@/lib/schemas'

export function PartsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    project: searchParams.get('project') || '',
    supplier: searchParams.get('supplier') || ''
  })
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const applyFilters = () => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === 'search') {
          params.set('part', value) // Map search to part parameter
        } else {
          params.set(key, value)
        }
      }
    })
    
    router.push(`/parts?${params.toString()}`)
  }
  
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      project: '',
      supplier: ''
    })
    router.push('/parts')
  }
  
  const hasActiveFilters = Object.values(filters).some(value => value !== '')
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Part code, description..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={filters.category || undefined} 
            onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CategoryLabels).map(([code, label]) => (
                <SelectItem key={code} value={code}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={filters.status || undefined} 
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="0">Unknown</SelectItem>
              <SelectItem value="1">Quoted</SelectItem>
              <SelectItem value="2">Ordered</SelectItem>
              <SelectItem value="3">Shipped</SelectItem>
              <SelectItem value="4">Received</SelectItem>
              <SelectItem value="5">Installed</SelectItem>
              <SelectItem value="6">Backorder</SelectItem>
              <SelectItem value="7">Cancelled</SelectItem>
              <SelectItem value="8">Returned</SelectItem>
              <SelectItem value="9">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Project */}
        <div className="space-y-2">
          <Label htmlFor="project">Project</Label>
          <Input
            id="project"
            placeholder="Project code..."
            value={filters.project}
            onChange={(e) => handleFilterChange('project', e.target.value)}
          />
        </div>
        
        {/* Supplier */}
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            placeholder="Supplier name..."
            value={filters.supplier}
            onChange={(e) => handleFilterChange('supplier', e.target.value)}
          />
        </div>
      </div>
      
      {/* Apply Filters Button */}
      <div className="flex justify-end">
        <Button onClick={applyFilters}>
          <Search className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}

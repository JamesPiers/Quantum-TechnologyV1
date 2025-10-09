/**
 * Quick search component for dashboard
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' 
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
import { Search, ArrowRight } from 'lucide-react'

export function QuickSearch() {
  const router = useRouter()
  const [searchType, setSearchType] = useState('part')
  const [searchValue, setSearchValue] = useState('')
  
  const searchTypes = [
    { value: 'part', label: 'Part Number/Code' },
    { value: 'po', label: 'Purchase Order' },
    { value: 'customer', label: 'Customer Number' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'supplier', label: 'Supplier' }
  ]
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchValue.trim()) return
    
    // Build search URL with parameters
    const params = new URLSearchParams()
    params.set(searchType, searchValue.trim())
    
    router.push(`/parts?${params.toString()}`)
  }
  
  const handleQuickSearchButtons = (type: string, value: string) => {
    const params = new URLSearchParams()
    params.set(type, value)
    router.push(`/parts?${params.toString()}`)
  }
  
  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search-type">Search By</Label>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="search-value">Search Term</Label>
            <div className="flex gap-2">
              <Input
                id="search-value"
                placeholder={`Enter ${searchTypes.find(t => t.value === searchType)?.label.toLowerCase()}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Button type="submit" disabled={!searchValue.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Quick Search Buttons */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Searches</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickSearchButtons('status', '6')}
            className="justify-start"
          >
            Backorder Items
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickSearchButtons('category', 'v')}
            className="justify-start"
          >
            Vacuum Parts
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickSearchButtons('project', '538')}
            className="justify-start"
          >
            Project 538
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/parts')}
            className="justify-start"
          >
            All Parts
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Parts page header with title and actions
 */

'use client'

import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Download, 
  Upload, 
  MoreHorizontal,
  FileText,
  Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PartsHeader() {
  const router = useRouter()
  
  const handleExport = () => {
    // Build current search params for export
    const params = new URLSearchParams(window.location.search)
    window.open(`/api/exports/csv?${params.toString()}`, '_blank')
  }
  
  const handleImport = () => {
    router.push('/parts/import')
  }
  
  const handleAddPart = () => {
    router.push('/parts/new')
  }
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parts Inventory</h1>
        <p className="text-gray-600 mt-1">
          Manage your parts inventory, suppliers, and purchase information
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Primary Actions */}
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        
        <Button variant="outline" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        
        <Button onClick={handleAddPart}>
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
        
        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/reports/parts')}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/parts/bulk-edit')}>
              <Filter className="h-4 w-4 mr-2" />
              Bulk Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

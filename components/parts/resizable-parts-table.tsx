/**
 * Resizable parts table with user-adjustable column widths and sortable headers
 * Persists column width preferences to localStorage
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { formatCurrency } from '@/lib/format'
import { PartReadable } from '@/lib/schemas'
import { Eye, Edit, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { SORT_FIELDS } from '@/lib/filter-config'
import Link from 'next/link'

interface ResizablePartsTableProps {
  parts: PartReadable[]
}

interface ColumnConfig {
  key: string
  label: string
  defaultWidth: number
  minWidth: number
  sortable?: boolean
}

const COLUMNS: ColumnConfig[] = [
  { key: 'part', label: 'Part Code', defaultWidth: 150, minWidth: 100, sortable: true },
  { key: 'description', label: 'Description', defaultWidth: 300, minWidth: 150, sortable: true },
  { key: 'category', label: 'Category', defaultWidth: 120, minWidth: 100, sortable: true },
  { key: 'supplier', label: 'Supplier', defaultWidth: 150, minWidth: 100, sortable: true },
  { key: 'manufacturer', label: 'Manufacturer', defaultWidth: 150, minWidth: 100, sortable: true },
  { key: 'mpn', label: 'MPN', defaultWidth: 150, minWidth: 100, sortable: true },
  { key: 'dwg', label: 'DWG', defaultWidth: 120, minWidth: 80, sortable: true },
  { key: 'dwg_id', label: 'DWG ID', defaultWidth: 100, minWidth: 80, sortable: true },
  { key: 'proj', label: 'Project', defaultWidth: 100, minWidth: 80, sortable: true },
  { key: 'sec', label: 'Section', defaultWidth: 100, minWidth: 80, sortable: true },
  { key: 'po', label: 'PO', defaultWidth: 120, minWidth: 80, sortable: true },
  { key: 'resp', label: 'Resp.', defaultWidth: 80, minWidth: 60, sortable: true },
  { key: 'quantity', label: 'Quantity', defaultWidth: 100, minWidth: 80, sortable: true },
  { key: 'unit_price', label: 'Unit Price', defaultWidth: 120, minWidth: 100, sortable: true },
  { key: 'currency', label: 'Currency', defaultWidth: 90, minWidth: 70, sortable: true },
  { key: 'order_date', label: 'Order Date', defaultWidth: 120, minWidth: 100, sortable: true },
  { key: 'status', label: 'Status', defaultWidth: 120, minWidth: 100, sortable: true },
  { key: 'actions', label: 'Actions', defaultWidth: 100, minWidth: 100, sortable: false },
]

const STORAGE_KEY = 'parts-table-column-widths'

export function ResizablePartsTable({ parts }: ResizablePartsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Initialize with default widths
    const defaults: Record<string, number> = {}
    COLUMNS.forEach(col => {
      defaults[col.key] = col.defaultWidth
    })
    return defaults
  })

  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)
  
  // Get current sort state from URL parameters
  const currentSort = searchParams.get('sort')
  const currentOrder = searchParams.get('order') as 'asc' | 'desc'

  // Load saved column widths from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setColumnWidths(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Error loading column widths:', error)
    }
  }, [])

  // Save column widths to localStorage
  const saveColumnWidths = (widths: Record<string, number>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widths))
    } catch (error) {
      console.error('Error saving column widths:', error)
    }
  }
  
  // Handle column sorting
  const handleSort = (columnKey: string) => {
    const column = COLUMNS.find(col => col.key === columnKey)
    if (!column?.sortable) return
    
    // Map column keys to sortable field names
    const sortFieldMap: Record<string, string> = {
      'part': 'part',
      'description': 'description',
      'category': 'category_name',
      'supplier': 'supplier_name',
      'manufacturer': 'manufacturer_name',
      'mpn': 'part_number',
      'proj': 'project',
      'po': 'purchase_order',
      'quantity': 'quantity',
      'unit_price': 'unit_price',
      'order_date': 'order_date',
      'status': 'status_label'
    }
    
    const sortField = sortFieldMap[columnKey] || columnKey
    
    // Determine new sort order
    let newOrder: 'asc' | 'desc' = 'asc'
    if (currentSort === sortField) {
      newOrder = currentOrder === 'asc' ? 'desc' : 'asc'
    } else {
      // Use default order from SORT_FIELDS if available
      const sortConfig = SORT_FIELDS[sortField]
      newOrder = sortConfig?.defaultOrder || 'asc'
    }
    
    // Update URL with sort parameters
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortField)
    params.set('order', newOrder)
    
    router.push(`/parts?${params.toString()}`)
  }
  
  // Get sort icon for column
  const getSortIcon = (columnKey: string) => {
    const column = COLUMNS.find(col => col.key === columnKey)
    if (!column?.sortable) return null
    
    const sortFieldMap: Record<string, string> = {
      'part': 'part',
      'description': 'description',
      'category': 'category_name',
      'supplier': 'supplier_name',
      'manufacturer': 'manufacturer_name',
      'mpn': 'part_number',
      'proj': 'project',
      'po': 'purchase_order',
      'quantity': 'quantity',
      'unit_price': 'unit_price',
      'order_date': 'order_date',
      'status': 'status_label'
    }
    
    const sortField = sortFieldMap[columnKey] || columnKey
    
    if (currentSort === sortField) {
      return currentOrder === 'asc' ? 
        <ArrowUp className="h-4 w-4" /> : 
        <ArrowDown className="h-4 w-4" />
    }
    
    return <ArrowUpDown className="h-4 w-4 opacity-50" />
  }

  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(columnKey)
    startXRef.current = e.clientX
    startWidthRef.current = columnWidths[columnKey]
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizingColumn) return

      const diff = e.clientX - startXRef.current
      const newWidth = Math.max(
        COLUMNS.find(c => c.key === resizingColumn)?.minWidth || 80,
        startWidthRef.current + diff
      )

      setColumnWidths(prev => {
        const updated = { ...prev, [resizingColumn]: newWidth }
        saveColumnWidths(updated)
        return updated
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizingColumn(null)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, resizingColumn])

  const renderCell = (part: PartReadable, columnKey: string) => {
    switch (columnKey) {
      case 'part':
        return <span className="font-medium">{part.part}</span>

      case 'description':
        return (
          <span className="text-sm line-clamp-2" title={part.description || 'No description'}>
            {part.description || 'No description'}
          </span>
        )

      case 'category':
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            {part.category_name}
          </Badge>
        )

      case 'supplier':
        return part.supplier_name || <span className="text-gray-400">-</span>

      case 'manufacturer':
        return part.manufacturer_name || <span className="text-gray-400">-</span>

      case 'mpn':
        return part.part_number || <span className="text-gray-400">-</span>

      case 'dwg':
        return part.drawing || <span className="text-gray-400">-</span>

      case 'dwg_id':
        return part.drawing_id || <span className="text-gray-400">-</span>

      case 'proj':
        return part.project || <span className="text-gray-400">-</span>

      case 'sec':
        return part.section || <span className="text-gray-400">-</span>

      case 'po':
        return part.purchase_order || <span className="text-gray-400">-</span>

      case 'resp':
        return part.responsible_person || <span className="text-gray-400">-</span>

      case 'quantity':
        return (
          <div>
            <span>{part.quantity}</span>
            {part.spare_quantity > 0 && (
              <span className="text-xs text-gray-500 block">
                +{part.spare_quantity} spare
              </span>
            )}
          </div>
        )

      case 'unit_price':
        return part.unit_price ? (
          formatCurrency(part.unit_price, part.currency_code)
        ) : (
          <span className="text-gray-400">-</span>
        )

      case 'currency':
        return <span className="text-sm">{part.currency_name}</span>

      case 'order_date':
        return part.order_date ? (
          <span className="text-sm whitespace-nowrap">{part.order_date}</span>
        ) : (
          <span className="text-gray-400">-</span>
        )

      case 'status':
        return (
          <Badge 
            variant={part.status_code === 4 ? 'default' : 'secondary'}
            className={`whitespace-nowrap ${
              part.status_code === 6 ? 'bg-orange-100 text-orange-800' :
              part.status_code === 4 ? 'bg-green-100 text-green-800' :
              part.status_code === 7 ? 'bg-red-100 text-red-800' : ''
            }`}
          >
            {part.status_label}
          </Badge>
        )

      case 'actions':
        return (
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
        )

      default:
        return null
    }
  }

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead 
                key={column.key}
                style={{ 
                  width: columnWidths[column.key],
                  minWidth: column.minWidth,
                  maxWidth: columnWidths[column.key],
                  position: 'relative'
                }}
                className="select-none"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className={`flex items-center gap-2 ${
                      column.sortable ? 'cursor-pointer hover:text-blue-600' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, column.key)}
                    style={{ 
                      backgroundColor: resizingColumn === column.key ? '#3b82f6' : '#d1d5db'
                    }}
                  />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id}>
              {COLUMNS.map((column) => (
                <TableCell 
                  key={column.key}
                  style={{ 
                    width: columnWidths[column.key],
                    minWidth: column.minWidth,
                    maxWidth: columnWidths[column.key],
                  }}
                  className="overflow-hidden"
                >
                  {renderCell(part, column.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


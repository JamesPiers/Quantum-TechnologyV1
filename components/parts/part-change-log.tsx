/**
 * Part change log component
 * Collapsible audit log showing all changes made to the part
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Clock, User } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  changes: Record<string, any>
  created_at: string
}

interface PartChangeLogProps {
  auditLog: AuditLogEntry[]
  partId: string
}

export function PartChangeLog({ auditLog, partId }: PartChangeLogProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const formatFieldName = (field: string): string => {
    // Convert field names to readable format
    const fieldMap: Record<string, string> = {
      'part': 'Part Code',
      'desc': 'Description',
      'c': 'Category',
      'pn': 'Part Number',
      'mfg': 'Manufacturer',
      'sup': 'Supplier',
      'qty': 'Quantity',
      'spare': 'Spare Quantity',
      'each': 'Unit Price',
      'd': 'Currency',
      'po': 'Purchase Order',
      'ord': 'Order Date',
      's': 'Status',
      'proj': 'Project',
      'sec': 'Section',
      'dwg': 'Drawing',
      'id_from_dwg': 'Drawing ID',
      'vp1': 'Value Param 1',
      'up1': 'Units 1',
      'vp2': 'Value Param 2',
      'up2': 'Units 2',
      'wk': 'Lead Time (weeks)',
      're_sp': 'Responsible Person',
      'n': 'Notes',
      'l': 'Link',
      'lc': 'Location Code',
      'b': 'Budget Item',
      'w': 'Updated By',
      'upd': 'Update Date',
    }
    return fieldMap[field] || field
  }
  
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }
  
  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'create': { label: 'Created', variant: 'default' },
      'update': { label: 'Updated', variant: 'secondary' },
      'delete': { label: 'Deleted', variant: 'outline' },
      'price_change': { label: 'Price Changed', variant: 'secondary' },
    }
    const config = actionMap[action] || { label: action, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-gray-500" />
          <h2 className="text-xl font-semibold">Change Log</h2>
          {auditLog.length > 0 && (
            <Badge variant="outline">{auditLog.length} change{auditLog.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          {isExpanded ? (
            <>
              Collapse
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Expand
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4">
          {auditLog.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No changes recorded yet.</p>
              <p className="text-sm mt-2">Changes will be logged here when the part is edited.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead className="w-[150px]">Changed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap align-top">
                        <div>{new Date(entry.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {getActionBadge(entry.action)}
                      </TableCell>
                      <TableCell className="align-top">
                        {Object.keys(entry.changes).length > 0 ? (
                          <div className="space-y-2 text-sm">
                            {Object.entries(entry.changes).map(([field, change]: [string, any]) => (
                              <div key={field} className="border-l-2 border-gray-200 pl-3">
                                <div className="font-medium text-gray-700">
                                  {formatFieldName(field)}
                                </div>
                                <div className="flex items-center gap-2 text-xs mt-1">
                                  <span className="text-red-600 line-through">
                                    {change.old ? formatValue(change.old) : '—'}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-green-600 font-medium">
                                    {formatValue(change.new)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No detailed changes recorded</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {entry.user_id ? (
                              <span className="font-mono text-xs">{entry.user_id.slice(0, 8)}...</span>
                            ) : (
                              <span className="text-gray-400">System</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}


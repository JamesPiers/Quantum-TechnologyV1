/**
 * Related parts component
 * Shows other parts with the same part code (duplicates or variants)
 */

'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface RelatedPart {
  id: string
  part: string
  description: string | null
  supplier_name: string | null
  manufacturer_name: string | null
  part_number: string | null
  project: string | null
  purchase_order: string | null
  status_label: string
  created_at: string
  updated_at: string
}

interface RelatedPartsProps {
  parts: RelatedPart[]
  currentPartId: string
}

export function RelatedParts({ parts, currentPartId }: RelatedPartsProps) {
  const otherParts = parts.filter(p => p.id !== currentPartId)
  
  if (otherParts.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {otherParts.length} other part{otherParts.length !== 1 ? 's' : ''} with the same code
      </p>
      
      <div className="space-y-2">
        {otherParts.map((part) => (
          <div
            key={part.id}
            className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {part.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {part.project && (
                    <Badge variant="outline" className="text-xs">
                      {part.project}
                    </Badge>
                  )}
                  {part.purchase_order && (
                    <Badge variant="outline" className="text-xs">
                      PO: {part.purchase_order}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/parts/${part.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              {part.manufacturer_name && (
                <div>Mfg: {part.manufacturer_name}</div>
              )}
              {part.supplier_name && (
                <div>Supplier: {part.supplier_name}</div>
              )}
              {part.part_number && (
                <div>MPN: {part.part_number}</div>
              )}
              <div className="text-gray-400">
                Updated: {new Date(part.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


/**
 * Part detail header component
 * Shows part code, description, and key status information
 */

'use client'

import { PartReadable } from '@/lib/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PartDetailHeaderProps {
  part: PartReadable
}

export function PartDetailHeader({ part }: PartDetailHeaderProps) {
  const router = useRouter()
  
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{part.part}</h1>
          <Badge variant="outline" className="text-sm">
            {part.category_name}
          </Badge>
          <Badge 
            variant={part.status_code === 4 ? 'default' : 'secondary'}
            className={`${
              part.status_code === 6 ? 'bg-orange-100 text-orange-800' :
              part.status_code === 4 ? 'bg-green-100 text-green-800' :
              part.status_code === 7 ? 'bg-red-100 text-red-800' : ''
            }`}
          >
            {part.status_label}
          </Badge>
        </div>
        
        {part.description && (
          <p className="text-lg text-gray-600 max-w-3xl">{part.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {part.manufacturer_name && (
            <span>Manufacturer: <span className="font-medium text-gray-700">{part.manufacturer_name}</span></span>
          )}
          {part.part_number && (
            <span>MPN: <span className="font-medium text-gray-700">{part.part_number}</span></span>
          )}
          {part.supplier_name && (
            <span>Supplier: <span className="font-medium text-gray-700">{part.supplier_name}</span></span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {part.link && (
          <Button variant="outline" asChild>
            <a href={part.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Link
            </a>
          </Button>
        )}
        <Button onClick={() => router.push(`/parts/${part.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Part
        </Button>
      </div>
    </div>
  )
}


/**
 * Part edit page - edit part details with validation and change tracking
 */

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import { ServerDB } from '@/lib/supabase-server'
import { PartEditForm } from '@/components/parts/part-edit-form'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PartEditPageProps {
  params: Promise<{ id: string }>
}

export default async function PartEditPage({ params }: PartEditPageProps) {
  const { id } = await params
  
  const db = await ServerDB.create()
  
  // Fetch part data
  const { data: part, error: partError } = await db.getPartById(id)
  
  if (partError || !part) {
    notFound()
  }
  
  // Fetch suppliers and manufacturers for dropdowns
  const [suppliersResult, manufacturersResult, statusCodesResult] = await Promise.all([
    db.getSuppliers(),
    db.getManufacturers(),
    db.getStatusCodes()
  ])
  
  const suppliers = suppliersResult.data || []
  const manufacturers = manufacturersResult.data || []
  const statusCodes = statusCodesResult.data || []
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href={`/parts/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Part Details
          </Link>
        </Button>
      </div>
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Edit Part</h1>
        <p className="text-gray-600 mt-2">
          Make changes to <span className="font-medium">{part.part}</span>. 
          All changes will be logged in the change history.
        </p>
      </div>
      
      {/* Edit Form */}
      <Card className="p-6">
        <PartEditForm 
          part={part}
          suppliers={suppliers}
          manufacturers={manufacturers}
          statusCodes={statusCodes}
        />
      </Card>
    </div>
  )
}


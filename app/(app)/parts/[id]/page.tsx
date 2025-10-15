/**
 * Part detail view page - comprehensive view of a single part
 * Shows all part information, price history, POs, documents, and change log
 */

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ServerDB } from '@/lib/supabase-server'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PartDetailHeader } from '@/components/parts/part-detail-header'
import { PartDetailInfo } from '@/components/parts/part-detail-info'
import { PartPriceHistory } from '@/components/parts/part-price-history'
import { PartPurchaseOrders } from '@/components/parts/part-purchase-orders'
import { PartDocuments } from '@/components/parts/part-documents'
import { PartChangeLog } from '@/components/parts/part-change-log'
import { RelatedParts } from '@/components/parts/related-parts'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PartDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PartDetailPage({ params }: PartDetailPageProps) {
  const { id } = await params
  
  const db = await ServerDB.create()
  
  // Fetch part data
  const { data: part, error: partError } = await db.getPartById(id)
  
  if (partError || !part) {
    notFound()
  }
  
  // Fetch related data in parallel
  const [priceHistoryResult, posResult, auditLogResult, relatedPartsResult] = await Promise.all([
    db.getPartPriceHistory(id),
    db.getPartPurchaseOrders(id),
    db.getPartAuditLog(id),
    db.getRelatedParts(part.part)
  ])
  
  const priceHistory = priceHistoryResult.data || []
  const purchaseOrders = posResult.data || []
  const auditLog = auditLogResult.data || []
  const relatedParts = relatedPartsResult.data || []
  
  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href="/parts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Parts
          </Link>
        </Button>
      </div>
      
      {/* Part Header */}
      <PartDetailHeader part={part} />
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Part Details Card */}
          <Card className="p-6">
            <PartDetailInfo part={part} />
          </Card>
          
          {/* Tabs for History, POs, Documents */}
          <Card className="p-6">
            <Tabs defaultValue="purchase-orders" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="purchase-orders">
                  Purchase Orders ({purchaseOrders.length})
                </TabsTrigger>
                <TabsTrigger value="price-history">
                  Price History ({priceHistory.length})
                </TabsTrigger>
                <TabsTrigger value="documents">
                  Documents
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="purchase-orders" className="mt-4">
                <PartPurchaseOrders purchaseOrders={purchaseOrders} />
              </TabsContent>
              
              <TabsContent value="price-history" className="mt-4">
                <PartPriceHistory priceHistory={priceHistory} />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-4">
                <Suspense fallback={<div>Loading documents...</div>}>
                  <PartDocuments part={part} />
                </Suspense>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Right Column - Related Parts (1/3 width on large screens) */}
        <div className="space-y-6">
          {relatedParts.length > 1 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Related Parts</h3>
              <RelatedParts parts={relatedParts} currentPartId={id} />
            </Card>
          )}
        </div>
      </div>
      
      {/* Change Log - Collapsible at bottom */}
      <PartChangeLog auditLog={auditLog} partId={id} />
    </div>
  )
}


/**
 * Part purchase orders component
 * Shows all purchase orders that include this part
 */

'use client'

import { formatCurrency } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface PurchaseOrderEntry {
  po_id: string | null
  po_number: string
  order_date: string | null
  supplier_name: string | null
  supplier_id: string | null
  quantity: number
  unit_price: number | null
  currency: string
  line_total: number
  status_code: number
  status_label: string
  created_at: string
}

interface PartPurchaseOrdersProps {
  purchaseOrders: PurchaseOrderEntry[]
}

export function PartPurchaseOrders({ purchaseOrders }: PartPurchaseOrdersProps) {
  if (purchaseOrders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No purchase orders found for this part.</p>
      </div>
    )
  }
  
  // Calculate totals
  const totalQuantity = purchaseOrders.reduce((sum, po) => sum + po.quantity, 0)
  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.line_total, 0)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {purchaseOrders.length} purchase order{purchaseOrders.length !== 1 ? 's' : ''} 
          {' • '}
          Total Qty: <span className="font-medium">{totalQuantity}</span>
          {' • '}
          Total Value: <span className="font-medium">{formatCurrency(totalValue, 'C')}</span>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.map((po, index) => (
              <TableRow key={po.po_id || `${po.po_number}-${index}`}>
                <TableCell className="font-medium">
                  {po.po_number}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {po.order_date ? (
                    new Date(po.order_date).toLocaleDateString()
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {po.supplier_name || <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="text-right">{po.quantity}</TableCell>
                <TableCell className="text-right">
                  {po.unit_price ? (
                    formatCurrency(po.unit_price, po.currency as 'C' | 'U')
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(po.line_total, po.currency as 'C' | 'U')}
                </TableCell>
                <TableCell>
                  {po.status_label !== 'N/A' ? (
                    <Badge 
                      variant={po.status_code === 4 ? 'default' : 'secondary'}
                      className={`whitespace-nowrap ${
                        po.status_code === 6 ? 'bg-orange-100 text-orange-800' :
                        po.status_code === 4 ? 'bg-green-100 text-green-800' :
                        po.status_code === 7 ? 'bg-red-100 text-red-800' : ''
                      }`}
                    >
                      {po.status_label}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {po.po_id && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/purchase-orders/${po.po_id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


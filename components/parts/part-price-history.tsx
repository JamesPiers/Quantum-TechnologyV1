/**
 * Part price history component
 * Shows the history of price changes for a part
 */

'use client'

import { formatCurrency } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PriceHistoryEntry {
  id: string
  changed_at: string
  changed_by: string | null
  old_price: number | null
  new_price: number
  currency: string
  notes: string | null
}

interface PartPriceHistoryProps {
  priceHistory: PriceHistoryEntry[]
}

export function PartPriceHistory({ priceHistory }: PartPriceHistoryProps) {
  if (priceHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No price history available for this part.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Showing {priceHistory.length} price change{priceHistory.length !== 1 ? 's' : ''}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Old Price</TableHead>
              <TableHead>New Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Changed By</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceHistory.map((entry) => {
              const priceDiff = entry.old_price 
                ? entry.new_price - entry.old_price 
                : null
              const percentChange = entry.old_price && priceDiff
                ? (priceDiff / entry.old_price) * 100
                : null
              
              return (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(entry.changed_at).toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {new Date(entry.changed_at).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.old_price ? (
                      formatCurrency(entry.old_price, entry.currency as 'C' | 'U')
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(entry.new_price, entry.currency as 'C' | 'U')}
                  </TableCell>
                  <TableCell>
                    {priceDiff !== null ? (
                      <div className="flex items-center gap-2">
                        {priceDiff > 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-red-600" />
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              +{formatCurrency(priceDiff, entry.currency as 'C' | 'U')}
                            </Badge>
                          </>
                        ) : priceDiff < 0 ? (
                          <>
                            <TrendingDown className="h-4 w-4 text-green-600" />
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {formatCurrency(priceDiff, entry.currency as 'C' | 'U')}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <Minus className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">No change</span>
                          </>
                        )}
                        {percentChange !== null && (
                          <span className="text-xs text-gray-500">
                            ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Initial price</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.changed_by || <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    {entry.notes || <span className="text-gray-400">—</span>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


/**
 * Dashboard statistics cards
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' 
import { Package, Truck, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { ServerDB } from '@/lib/supabase-server'
import { formatCurrency, formatNumber } from '@/lib/format'

async function getStats() {
  try {
    const db = await ServerDB.create()
    
    // Get basic counts
    const [partsResult, suppliersResult, manufacturersResult, posResult] = await Promise.all([
      db.getParts({ limit: 1 }),
      db.getSuppliers(),
      db.getManufacturers(), 
      db.getPurchaseOrders()
    ])
    
    // Type assertion for RPC result structure
    const rpcData = partsResult.data as Array<{ parts_data: any; total_count: number }> | null
    
    // Calculate totals and trends (simplified for demo)
    const totalParts = rpcData?.[0]?.total_count || 0
    const totalSuppliers = suppliersResult.data?.length || 0
    const totalManufacturers = manufacturersResult.data?.length || 0
    const totalPOs = posResult.data?.length || 0
    
    // Calculate spending (mock calculation for demo)
    const totalSpending = totalPOs * 2500 // Average PO value
    
    return {
      totalParts,
      totalSuppliers,
      totalManufacturers,
      totalPOs,
      totalSpending,
      // Mock trend data
      partsGrowth: 12,
      suppliersGrowth: 5,
      spendingGrowth: -3,
      poGrowth: 8
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values on error
    return {
      totalParts: 0,
      totalSuppliers: 0,
      totalManufacturers: 0,
      totalPOs: 0,
      totalSpending: 0,
      partsGrowth: 0,
      suppliersGrowth: 0,
      spendingGrowth: 0,
      poGrowth: 0
    }
  }
}

export async function DashboardStats() {
  const stats = await getStats()
  
  const statCards = [
    {
      title: 'Total Parts',
      value: formatNumber(stats.totalParts),
      icon: Package,
      trend: stats.partsGrowth,
      color: 'blue'
    },
    {
      title: 'Suppliers',
      value: formatNumber(stats.totalSuppliers),
      icon: Truck,
      trend: stats.suppliersGrowth,
      color: 'green'
    },
    {
      title: 'Purchase Orders',
      value: formatNumber(stats.totalPOs),
      icon: ShoppingCart,
      trend: stats.poGrowth,
      color: 'purple'
    },
    {
      title: 'Total Spending',
      value: formatCurrency(stats.totalSpending),
      icon: DollarSign,
      trend: stats.spendingGrowth,
      color: 'orange'
    }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {stat.trend !== 0 && (
                  <>
                    {stat.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <Badge 
                      variant="secondary" 
                      className={
                        stat.trend > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {stat.trend > 0 ? '+' : ''}{stat.trend}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stat.title}
              </p>
            </div>
            
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                {stat.trend > 0 ? 'Increased' : stat.trend < 0 ? 'Decreased' : 'No change'} from last month
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

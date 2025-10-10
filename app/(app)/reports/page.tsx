/**
 * Reports and analytics page
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Calendar, TrendingUp, Package, DollarSign, ShoppingCart } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">
            View insights and generate reports
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Parts</p>
              <p className="text-2xl font-bold mt-1">0</p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                No data yet
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold mt-1">$0.00</p>
              <p className="text-sm text-gray-500 mt-1">
                Inventory value
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Active POs</p>
              <p className="text-2xl font-bold mt-1">0</p>
              <p className="text-sm text-gray-500 mt-1">
                Purchase orders
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Inventory Reports</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Parts by Category
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Low Stock Items
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Inventory Valuation
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Purchase Order Reports</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              PO History
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Supplier Performance
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Spending Analysis
            </Button>
          </div>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trends & Analytics</h3>
        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-lg font-medium">Analytics Dashboard</p>
          <p className="text-sm mt-2">Charts and graphs will appear here once you have data</p>
        </div>
      </Card>
    </div>
  )
}


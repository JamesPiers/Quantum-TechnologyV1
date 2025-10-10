/**
 * Dashboard page with overview cards and quick actions
 */

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Truck, 
  ShoppingCart, 
  TrendingUp, 
  Upload, 
  Search,
  FileText,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickSearch } from '@/components/dashboard/quick-search'
import { PDFUpload } from '@/components/dashboard/pdf-upload'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to your parts management overview
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Search Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Quick Search
              </CardTitle>
              <CardDescription>
                Search parts by PO, customer, manufacturer, or part number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickSearch />
            </CardContent>
          </Card>

          {/* PDF Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Purchase Orders
              </CardTitle>
              <CardDescription>
                Upload PDF purchase orders and quotes for automatic processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFUpload />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest parts additions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ActivitySkeleton />}>
                <RecentActivity />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary Cards */}
        <div className="space-y-6">
          {/* Alerts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    5 items on backorder
                  </p>
                  <p className="text-xs text-orange-700">
                    Requires attention
                  </p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  High
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    12 parts low stock
                  </p>
                  <p className="text-xs text-yellow-700">
                    Review inventory
                  </p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Medium
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    3 new suppliers added
                  </p>
                  <p className="text-xs text-blue-700">
                    This week
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Info
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Parts Added</span>
                </div>
                <span className="text-lg font-semibold">127</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">POs Processed</span>
                </div>
                <span className="text-lg font-semibold">23</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Total Spend</span>
                </div>
                <span className="text-lg font-semibold">$45,230</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Trend</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  +12%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>
                Frequently used features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                View All Parts
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Truck className="h-4 w-4 mr-2" />
                Manage Suppliers
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase Orders
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Loading skeletons
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

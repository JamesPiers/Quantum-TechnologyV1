/**
 * Recent activity component for dashboard
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Upload, 
  Edit, 
  Plus, 
  ArrowRight,
  Clock
} from 'lucide-react'
import { ServerDB } from '@/lib/supabase-server'
import { formatRelativeTime, formatCurrency } from '@/lib/format'
import Link from 'next/link'

async function getRecentActivity() {
  try {
    const db = new ServerDB()
    
    // Get recent parts (last 20)
    const partsResult = await db.getParts({ 
      limit: 20,
      offset: 0 
    })
    
    const recentParts = partsResult.data?.[0]?.parts_data 
      ? JSON.parse(JSON.stringify(partsResult.data[0].parts_data)).slice(0, 10)
      : []
    
    // Transform to activity items
    const activities = recentParts.map((part: any) => ({
      id: part.id,
      type: 'part_added',
      title: `Part ${part.part} added`,
      description: `${part.description || 'No description'} - ${part.category_name}`,
      timestamp: part.created_at,
      metadata: {
        part_code: part.part,
        category: part.category_name,
        supplier: part.supplier_name,
        price: part.unit_price,
        currency: part.currency_code
      }
    }))
    
    // Add mock activities for other types
    const mockActivities = [
      {
        id: 'activity-1',
        type: 'pdf_upload',
        title: 'PDF processed successfully',
        description: 'PO-538-003.pdf - 3 parts extracted',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        metadata: {
          filename: 'PO-538-003.pdf',
          parts_count: 3
        }
      },
      {
        id: 'activity-2', 
        type: 'supplier_added',
        title: 'New supplier added',
        description: 'Advanced Components Ltd. - Contact: John Smith',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        metadata: {
          supplier_name: 'Advanced Components Ltd.',
          contact: 'John Smith'
        }
      }
    ]
    
    // Combine and sort by timestamp
    const allActivities = [...mockActivities, ...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
    
    return allActivities
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'part_added':
    case 'part_updated':
      return Package
    case 'pdf_upload':
      return Upload
    case 'supplier_added':
    case 'manufacturer_added':
      return Plus
    default:
      return Edit
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'part_added':
      return 'bg-blue-100 text-blue-600'
    case 'part_updated':
      return 'bg-yellow-100 text-yellow-600'
    case 'pdf_upload':
      return 'bg-green-100 text-green-600'
    case 'supplier_added':
    case 'manufacturer_added':
      return 'bg-purple-100 text-purple-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export async function RecentActivity() {
  const activities = await getRecentActivity()
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No recent activity</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type)
          const colorClass = getActivityColor(activity.type)
          
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                
                {/* Additional metadata based on type */}
                {activity.type === 'part_added' && activity.metadata.price && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {formatCurrency(activity.metadata.price, activity.metadata.currency)}
                    </Badge>
                    {activity.metadata.supplier && (
                      <Badge variant="outline" className="text-xs">
                        {activity.metadata.supplier}
                      </Badge>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
              
              {/* Action button for some activity types */}
              {(activity.type === 'part_added' || activity.type === 'part_updated') && (
                <Link href={`/parts?search=${activity.metadata.part_code}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </div>
      
      {/* View All Button */}
      <div className="border-t pt-4">
        <Link href="/activity">
          <Button variant="outline" className="w-full">
            View All Activity
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

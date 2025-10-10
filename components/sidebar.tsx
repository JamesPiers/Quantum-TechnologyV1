/**
 * Sidebar navigation component
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Package, 
  Users, 
  Truck, 
  ShoppingCart, 
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react'

interface SidebarProps {
  user: any
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and quick actions'
  },
  {
    name: 'Parts',
    href: '/parts',
    icon: Package,
    description: 'Parts inventory and management'
  },
  {
    name: 'Suppliers',
    href: '/suppliers',
    icon: Truck,
    description: 'Supplier contacts and management'
  },
  {
    name: 'Manufacturers',
    href: '/manufacturers',
    icon: Users,
    description: 'Manufacturer information'
  },
  {
    name: 'Purchase Orders',
    href: '/purchase-orders',
    icon: ShoppingCart,
    description: 'PO tracking and management'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Analytics and reporting'
  }
]

const bottomNavigation = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Application settings'
  },
  {
    name: 'Help',
    href: '/help',
    icon: HelpCircle,
    description: 'Documentation and support'
  }
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  
  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === 'admin' || 
                  user?.app_metadata?.role === 'admin' ||
                  user?.app_metadata?.user_role === 'admin'

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo and Brand */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-200">
        <Image
          src="/Quantum-Logo-Blue.png"
          alt="Quantum Technology Logo"
          width={150}
          height={40}
          className="object-contain"
          priority
        />
        {isAdmin && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Admin
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100',
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:text-gray-900'
                )}
              >
                <item.icon 
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100',
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              <item.icon 
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {isAdmin ? 'Administrator' : 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

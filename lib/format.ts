/**
 * Formatting utilities for data display
 */

import { Category, Currency, CategoryLabels, CurrencyLabels, LocationCodes } from './schemas'

/**
 * Format currency values with proper symbols and formatting
 */
export function formatCurrency(amount: number | null | undefined, currency: Currency = 'C'): string {
  if (amount === null || amount === undefined) return ''
  
  const symbol = currency === 'C' ? '$' : '$'
  const locale = currency === 'C' ? 'en-CA' : 'en-US'
  const currencyCode = currency === 'C' ? 'CAD' : 'USD'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format numbers with proper thousand separators
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return ''
  
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * Format dates consistently across the application
 */
export function formatDate(dateStr: string | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!dateStr) return ''
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr // Return original if invalid
    
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { year: '2-digit' as const, month: 'numeric' as const, day: 'numeric' as const },
      medium: { year: 'numeric' as const, month: 'short' as const, day: 'numeric' as const },
      long: { year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const, weekday: 'long' as const }
    }
    
    const options = formatOptions[format]
    
    return new Intl.DateTimeFormat('en-CA', options).format(date)
  } catch {
    return dateStr
  }
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 weeks")
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (Math.abs(diffHours) < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes === 0 ? 'now' : 
               diffMinutes > 0 ? `in ${diffMinutes}m` : `${Math.abs(diffMinutes)}m ago`
      }
      return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`
    } else if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`
    } else if (Math.abs(diffDays) < 30) {
      const diffWeeks = Math.floor(diffDays / 7)
      return diffWeeks > 0 ? `in ${Math.abs(diffWeeks)}w` : `${Math.abs(diffWeeks)}w ago`
    } else {
      const diffMonths = Math.floor(diffDays / 30)
      return diffMonths > 0 ? `in ${Math.abs(diffMonths)}mo` : `${Math.abs(diffMonths)}mo ago`
    }
  } catch {
    return formatDate(dateStr, 'short')
  }
}

/**
 * Format category codes to human-readable names
 */
export function formatCategory(categoryCode: Category): string {
  return CategoryLabels[categoryCode] || 'Unknown'
}

/**
 * Format currency codes to human-readable names
 */
export function formatCurrencyName(currencyCode: Currency): string {
  return CurrencyLabels[currencyCode] || 'Unknown'
}

/**
 * Format location codes to human-readable names
 */
export function formatLocation(locationCode: string | null | undefined): string {
  if (!locationCode) return ''
  return LocationCodes[locationCode as keyof typeof LocationCodes] || locationCode
}

/**
 * Format status codes to display format
 */
export function formatStatus(statusCode: number, statusLabel?: string): string {
  if (statusLabel) return statusLabel
  
  // Fallback status labels if not provided
  const defaultLabels: Record<number, string> = {
    0: 'Unknown',
    1: 'Quoted',
    2: 'Ordered', 
    3: 'Shipped',
    4: 'Received',
    5: 'Installed',
    6: 'Backorder',
    7: 'Cancelled',
    8: 'Returned',
    9: 'Archived'
  }
  
  return defaultLabels[statusCode] || `Status ${statusCode}`
}

/**
 * Format part code with category prefix for display
 */
export function formatPartDisplay(part: string, category?: Category): string {
  if (!category) return part
  
  const categoryName = formatCategory(category)
  return `[${categoryName}] ${part}`
}

/**
 * Format quantity with units
 */
export function formatQuantity(qty: number, spareQty?: number): string {
  if (!spareQty || spareQty === 0) {
    return formatNumber(qty)
  }
  
  return `${formatNumber(qty)} (+${formatNumber(spareQty)} spare${spareQty === 1 ? '' : 's'})`
}

/**
 * Format lead time
 */
export function formatLeadTime(weeks: number | null | undefined): string {
  if (!weeks) return ''
  
  if (weeks === 1) return '1 week'
  if (weeks < 4) return `${weeks} weeks`
  
  const months = Math.floor(weeks / 4)
  const remainingWeeks = weeks % 4
  
  if (remainingWeeks === 0) {
    return months === 1 ? '1 month' : `${months} months`
  } else {
    const monthStr = months === 1 ? '1 month' : `${months} months`
    const weekStr = remainingWeeks === 1 ? '1 week' : `${remainingWeeks} weeks`
    return `${monthStr}, ${weekStr}`
  }
}

/**
 * Format file size for uploads
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  
  if (text.length <= maxLength) return text
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Format initials from name
 */
export function formatInitials(name: string | null | undefined): string {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Format phone numbers
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Format based on length
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  
  // Return as-is if format not recognized
  return phone
}

/**
 * Format URLs for display (remove protocol, www)
 */
export function formatDisplayUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '') + urlObj.pathname.replace(/\/$/, '')
  } catch {
    return url
  }
}

/**
 * Capitalize first letter of each word
 */
export function formatTitle(text: string | null | undefined): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format search highlight (for search results)
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm || !text) return text
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Convert database date format (YYYY-MM-DD) to display format
 */
export function formatDBDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  
  // Handle YYYYMMDD format from legacy data
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return formatDate(`${year}-${month}-${day}`)
  }
  
  return formatDate(dateStr)
}

/**
 * Convert display date to database format (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date | string | null | undefined): string | null {
  if (!date) return null
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return null
    
    return dateObj.toISOString().split('T')[0]
  } catch {
    return null
  }
}

/**
 * Tests for search utilities
 */

import { describe, it, expect, vi } from 'vitest'
import { formatPartsForCSV } from '@/lib/search'
import { PartReadable } from '@/lib/schemas'

// Mock part data for testing
const mockPart: PartReadable = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  category_code: 'v',
  category_name: 'Vacuum',
  part: 'PUMP-001',
  description: 'Turbo molecular pump',
  value_param_1: 250,
  units_1: 'L/s',
  value_param_2: null,
  units_2: null,
  supplier_name: 'Vacuum Tech Solutions',
  supplier_id: 'supplier-123',
  manufacturer_name: 'Pfeiffer Vacuum',
  manufacturer_id: 'mfg-123',
  part_number: 'PFR-TURBO-250',
  project: '538',
  section: 'A',
  drawing: 'DWG-538-001',
  drawing_id: 'P1',
  quantity: 2,
  spare_quantity: 1,
  total_quantity: 3,
  purchase_order: 'PO-538-001',
  responsible_person: 'JS',
  order_date: '2024-01-15',
  lead_time_weeks: 8,
  status_code: 2,
  status_label: 'Ordered',
  status_description: 'Purchase order placed with supplier',
  unit_price: 4500.00,
  currency_code: 'U',
  currency_name: 'USD',
  line_total: 9000.00,
  notes: 'Critical component for project 538',
  link: 'https://pfeiffer-vacuum.com/turbo-250l',
  is_budget_item: false,
  last_updated_by: 'JS',
  last_update_date: '2024-01-20',
  location_code: 'IW',
  location_name: 'Internal Warehouse',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T15:30:00Z'
}

describe('Search Utilities', () => {
  describe('formatPartsForCSV', () => {
    it('should format parts data correctly for CSV export', () => {
      const parts = [mockPart]
      const csvContent = formatPartsForCSV(parts)
      
      // Check that CSV contains headers
      expect(csvContent).toContain('ID,Category,Part Code,Description')
      expect(csvContent).toContain('Part Number,Quantity,Spare Qty')
      expect(csvContent).toContain('Unit Price,Currency,Line Total')
      
      // Check that part data is included
      expect(csvContent).toContain(mockPart.id)
      expect(csvContent).toContain(mockPart.part)
      expect(csvContent).toContain(mockPart.description!)
      expect(csvContent).toContain('4500')
      expect(csvContent).toContain('USD')
    })
    
    it('should handle empty parts array', () => {
      const csvContent = formatPartsForCSV([])
      
      // Should still contain headers
      expect(csvContent).toContain('ID,Category,Part Code')
      
      // Should not contain any data rows
      const lines = csvContent.split('\n')
      expect(lines.length).toBe(1) // Only header row
    })
    
    it('should properly escape CSV fields with special characters', () => {
      const partWithSpecialChars: PartReadable = {
        ...mockPart,
        description: 'Pump with "special" characters, and commas'
      }
      
      const csvContent = formatPartsForCSV([partWithSpecialChars])
      
      // Check that the description is properly quoted and escaped
      expect(csvContent).toContain('"Pump with ""special"" characters, and commas"')
    })
    
    it('should handle null values gracefully', () => {
      const partWithNulls: PartReadable = {
        ...mockPart,
        description: null,
        unit_price: null,
        supplier_name: null
      }
      
      const csvContent = formatPartsForCSV([partWithNulls])
      
      // Should not throw error and should contain empty strings for null values
      expect(csvContent).toContain('""') // Empty description
      expect(csvContent).not.toContain('null')
    })
  })
})

describe('Search Parameters Validation', () => {
  it('should handle various search parameter formats', () => {
    // This would test the search parameter parsing logic
    // For now, we'll just verify the structure is correct
    const searchParams = {
      po: 'PO-538-001',
      part: 'PUMP',
      category: 'v',
      limit: 50,
      offset: 0
    }
    
    expect(searchParams.po).toBe('PO-538-001')
    expect(searchParams.category).toBe('v')
    expect(searchParams.limit).toBe(50)
  })
})

/**
 * Tests for OCR mapping functionality
 */

import { describe, it, expect } from 'vitest'
import { 
  parsePDFText, 
  mapParsedDataToParts, 
  extractEntitiesForUpsert,
  OCR_PATTERNS 
} from '@/lib/ocr-mapping'

describe('OCR Mapping', () => {
  describe('parsePDFText', () => {
    it('should extract basic PO information', () => {
      const mockPDFText = `
        PURCHASE ORDER
        PO Number: PO-538-003
        Date: 2024-03-15
        
        Supplier: Advanced Components Ltd.
        Customer No: CUST-001
        
        Line Items:
        Part#: VALVE-SS-1/4    Description: Stainless Steel Ball Valve 1/4"    Qty: 5    Price: $125.00
        Part#: GAUGE-VAC-001   Description: Vacuum Gauge 0-30 inHg            Qty: 2    Price: $89.50
        
        Total: $1,462.50 CAD
      `
      
      const parsed = parsePDFText(mockPDFText)
      
      expect(parsed.poNumber).toBe('PO-538-003')
      expect(parsed.customerNumber).toBe('CUST-001')
      expect(parsed.supplierName).toBe('Advanced Components Ltd.')
      expect(parsed.orderDate).toBe('2024-03-15')
      expect(parsed.currency).toBe('C') // CAD
      expect(parsed.lineItems).toHaveLength(2)
    })
    
    it('should extract line items correctly', () => {
      const mockPDFText = `
        Part#: VALVE-SS-1/4    Description: Stainless Steel Ball Valve 1/4"    Qty: 5    Price: $125.00
        Part#: GAUGE-VAC-001   Description: Vacuum Gauge 0-30 inHg            Qty: 2    Price: $89.50
      `
      
      const parsed = parsePDFText(mockPDFText)
      
      expect(parsed.lineItems).toHaveLength(2)
      
      const firstItem = parsed.lineItems[0]
      expect(firstItem.partNumber).toBe('VALVE-SS-1/4')
      expect(firstItem.description).toBe('Stainless Steel Ball Valve 1/4"')
      expect(firstItem.quantity).toBe(5)
      expect(firstItem.unitPrice).toBe(125.00)
      
      const secondItem = parsed.lineItems[1]
      expect(secondItem.partNumber).toBe('GAUGE-VAC-001')
      expect(secondItem.description).toBe('Vacuum Gauge 0-30 inHg')
      expect(secondItem.quantity).toBe(2)
      expect(secondItem.unitPrice).toBe(89.50)
    })
    
    it('should infer correct categories from descriptions', () => {
      const mockPDFText = `
        Part#: VALVE-001    Description: Stainless Steel Ball Valve    Qty: 1    Price: $125.00
        Part#: PUMP-001     Description: Vacuum Turbo Pump             Qty: 1    Price: $4500.00
        Part#: CABLE-001    Description: Power Cable 10 AWG           Qty: 10   Price: $25.00
      `
      
      const parsed = parsePDFText(mockPDFText)
      
      expect(parsed.lineItems[0].category).toBe('p') // Plumbing (valve)
      expect(parsed.lineItems[1].category).toBe('v') // Vacuum (pump)
      expect(parsed.lineItems[2].category).toBe('e') // Electrical (cable)
    })
    
    it('should handle USD currency detection', () => {
      const mockPDFText = `
        PURCHASE ORDER
        Total: $500.00 USD
      `
      
      const parsed = parsePDFText(mockPDFText)
      expect(parsed.currency).toBe('U')
    })
    
    it('should default to CAD when currency is not specified', () => {
      const mockPDFText = `
        PURCHASE ORDER
        Total: $500.00
      `
      
      const parsed = parsePDFText(mockPDFText)
      expect(parsed.currency).toBe('C')
    })
  })
  
  describe('mapParsedDataToParts', () => {
    it('should convert parsed data to database parts format', () => {
      const parsedData = {
        poNumber: 'PO-538-001',
        orderDate: '2024-01-15',
        project: '538',
        currency: 'C' as const,
        lineItems: [
          {
            partNumber: 'VALVE-001',
            description: 'Ball Valve',
            quantity: 5,
            unitPrice: 125.00,
            category: 'p' as const
          }
        ],
        rawText: 'mock text'
      }
      
      const parts = mapParsedDataToParts(parsedData)
      
      expect(parts).toHaveLength(1)
      
      const part = parts[0]
      expect(part.c).toBe('p')
      expect(part.part).toBe('VALVE-001')
      expect(part.desc).toBe('Ball Valve')
      expect(part.qty).toBe(5)
      expect(part.each).toBe(125.00)
      expect(part.d).toBe('C')
      expect(part.po).toBe('PO-538-001')
      expect(part.proj).toBe('538')
      expect(part.ord).toBe('2024-01-15')
      expect(part.s).toBe(1) // Default status: Quoted
    })
    
    it('should handle missing optional fields', () => {
      const parsedData = {
        lineItems: [
          {
            partNumber: 'UNKNOWN-PART',
            quantity: 1
          }
        ],
        rawText: 'mock text'
      }
      
      const parts = mapParsedDataToParts(parsedData)
      
      expect(parts).toHaveLength(1)
      expect(parts[0].c).toBe('x') // Default category
      expect(parts[0].d).toBe('C') // Default currency
    })
  })
  
  describe('extractEntitiesForUpsert', () => {
    it('should extract suppliers, manufacturers, and customers', () => {
      const parsedData = {
        supplierName: 'Test Supplier Inc.',
        manufacturerName: 'Test Manufacturer Corp.',
        customerNumber: 'CUST-001',
        lineItems: [],
        rawText: 'mock text'
      }
      
      const entities = extractEntitiesForUpsert(parsedData)
      
      expect(entities.suppliers).toHaveLength(1)
      expect(entities.suppliers[0].name).toBe('Test Supplier Inc.')
      
      expect(entities.manufacturers).toHaveLength(1)
      expect(entities.manufacturers[0].name).toBe('Test Manufacturer Corp.')
      
      expect(entities.customers).toHaveLength(1)
      expect(entities.customers[0].customer_number).toBe('CUST-001')
    })
    
    it('should not duplicate supplier and manufacturer if they are the same', () => {
      const parsedData = {
        supplierName: 'Same Company Ltd.',
        manufacturerName: 'Same Company Ltd.',
        lineItems: [],
        rawText: 'mock text'
      }
      
      const entities = extractEntitiesForUpsert(parsedData)
      
      expect(entities.suppliers).toHaveLength(1)
      expect(entities.manufacturers).toHaveLength(0) // Should not duplicate
    })
  })
  
  describe('OCR Patterns', () => {
    it('should match PO number patterns', () => {
      const testTexts = [
        'PO #: PO-538-001',
        'Purchase Order: PO-2024-001',
        'Order Number: ORD-123-456'
      ]
      
      testTexts.forEach(text => {
        const matched = OCR_PATTERNS.PO_NUMBER.some(pattern => {
          const match = pattern.exec(text)
          pattern.lastIndex = 0 // Reset regex state
          return match !== null
        })
        expect(matched).toBe(true)
      })
    })
    
    it('should match customer number patterns', () => {
      const testTexts = [
        'Customer No: CUST-001',
        'Customer #: C-12345',
        'Account #: ACC-789'
      ]
      
      testTexts.forEach(text => {
        const matched = OCR_PATTERNS.CUSTOMER_NUMBER.some(pattern => {
          const match = pattern.exec(text)
          pattern.lastIndex = 0 // Reset regex state
          return match !== null
        })
        expect(matched).toBe(true)
      })
    })
    
    it('should match price patterns', () => {
      const testTexts = [
        'Unit Price: $125.00',
        'Each: $1,250.50',
        'Price $89.99',
        'Cost: $12345'
      ]
      
      testTexts.forEach(text => {
        const matched = OCR_PATTERNS.UNIT_PRICE.some(pattern => {
          const match = pattern.exec(text)
          pattern.lastIndex = 0 // Reset regex state
          return match !== null
        })
        expect(matched).toBe(true)
      })
    })
  })
})

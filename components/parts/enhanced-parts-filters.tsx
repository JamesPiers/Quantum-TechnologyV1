/**
 * Enhanced parts filtering component with dynamic field selection
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select'
import { ComboBox, ComboBoxOption } from '@/components/ui/combo-box'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  Search, 
  X, 
  Settings, 
  Plus,
  Calendar,
  Hash,
  Type,
  Filter
} from 'lucide-react'
import { 
  FILTER_FIELDS, 
  FILTER_FIELD_GROUPS, 
  DEFAULT_FILTER_PREFERENCES,
  loadFilterOptions,
  type FilterFieldConfig 
} from '@/lib/filter-config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STORAGE_KEY = 'parts-filter-preferences'

interface FilterPreferences {
  activeFields: string[]
  layout: 'grid' | 'stack'
  showFieldGroups: boolean
  autoApply: boolean
}

interface FilterValue {
  [key: string]: string | number | boolean | [string, string] | [number, number] | undefined
}

export function EnhancedPartsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Filter preferences state
  const [preferences, setPreferences] = useState<FilterPreferences>(DEFAULT_FILTER_PREFERENCES)
  
  // Filter values state
  const [filters, setFilters] = useState<FilterValue>({})
  
  // Async options state
  const [asyncOptions, setAsyncOptions] = useState<Record<string, ComboBoxOption[]>>({})
  
  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setPreferences(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Error loading filter preferences:', error)
    }
  }, [])
  
  // Initialize filters from URL parameters
  useEffect(() => {
    const initialFilters: FilterValue = {}
    
    // Map URL parameters to filter values
    const paramMap = {
      search: 'part',
      part: 'part',
      part_number: 'part_number',
      description: 'description',
      category: 'category',
      status: 'status',
      project: 'project',
      supplier: 'supplier',
      manufacturer: 'manufacturer',
      purchase_order: 'po',
      responsible_person: 'resp'
    }
    
    Object.entries(paramMap).forEach(([filterKey, urlKey]) => {
      const value = searchParams.get(urlKey)
      if (value) {
        if (filterKey === 'status') {
          initialFilters[filterKey] = parseInt(value)
        } else {
          initialFilters[filterKey] = value
        }
      }
    })
    
    setFilters(initialFilters)
  }, [searchParams])
  
  // Load async options for active fields
  useEffect(() => {
    const loadAsyncFieldOptions = async () => {
      const asyncFields = preferences.activeFields.filter(fieldKey => {
        const config = FILTER_FIELDS[fieldKey]
        return config?.async === true
      })
      
      const optionsPromises = asyncFields.map(async (fieldKey) => {
        try {
          const options = await loadFilterOptions(fieldKey)
          return { fieldKey, options }
        } catch (error) {
          console.error(`Error loading options for ${fieldKey}:`, error)
          return { fieldKey, options: [] }
        }
      })
      
      const results = await Promise.all(optionsPromises)
      const newAsyncOptions: Record<string, ComboBoxOption[]> = {}
      
      results.forEach(({ fieldKey, options }) => {
        newAsyncOptions[fieldKey] = options
      })
      
      setAsyncOptions(prev => ({ ...prev, ...newAsyncOptions }))
    }
    
    loadAsyncFieldOptions()
  }, [preferences.activeFields])
  
  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: FilterPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
      setPreferences(newPreferences)
    } catch (error) {
      console.error('Error saving filter preferences:', error)
    }
  }, [])
  
  // Handle filter value changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === '' || value === undefined ? undefined : value 
    }))
    
    if (preferences.autoApply) {
      // Debounced auto-apply logic would go here
    }
  }
  
  // Apply filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams()
    
    // Map filter values to URL parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        // Handle range filters
        if (Array.isArray(value)) {
          const [min, max] = value
          if (min !== undefined && min !== '') {
            params.set(`${key}_min`, String(min))
          }
          if (max !== undefined && max !== '') {
            params.set(`${key}_max`, String(max))
          }
          return
        }
        
        // Handle special field mappings
        switch (key) {
          case 'search':
            params.set('part', String(value))
            break
          case 'purchase_order':
            params.set('po', String(value))
            break
          case 'responsible_person':
            params.set('resp', String(value))
            break
          case 'drawing_id':
            params.set('drawing_id', String(value))
            break
          case 'location_code':
            params.set('location_code', String(value))
            break
          case 'last_updated_by':
            params.set('last_updated_by', String(value))
            break
          case 'is_budget_item':
            params.set('budget_items_only', String(value))
            break
          case 'has_spares':
            params.set('has_spares', String(value))
            break
          case 'order_date':
            if (Array.isArray(value) && value.length === 2) {
              if (value[0]) params.set('order_date_from', String(value[0]))
              if (value[1]) params.set('order_date_to', String(value[1]))
            }
            break
          case 'last_update_date':
            if (Array.isArray(value) && value.length === 2) {
              if (value[0]) params.set('update_date_from', String(value[0]))
              if (value[1]) params.set('update_date_to', String(value[1]))
            }
            break
          default:
            params.set(key, String(value))
        }
      }
    })
    
    router.push(`/parts?${params.toString()}`)
  }
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({})
    router.push('/parts')
  }
  
  // Add a field to active filters
  const addField = (fieldKey: string) => {
    const newActiveFields = [...preferences.activeFields, fieldKey]
    savePreferences({ ...preferences, activeFields: newActiveFields })
  }
  
  // Remove a field from active filters
  const removeField = (fieldKey: string) => {
    const newActiveFields = preferences.activeFields.filter(f => f !== fieldKey)
    savePreferences({ ...preferences, activeFields: newActiveFields })
    
    // Also clear the filter value
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[fieldKey]
      return newFilters
    })
  }
  
  // Get available fields for selection (not currently active)
  const availableFieldOptions: MultiSelectOption[] = Object.entries(FILTER_FIELDS)
    .filter(([key]) => !preferences.activeFields.includes(key))
    .map(([key, config]) => ({
      value: key,
      label: config.label,
      description: config.description
    }))
  
  // Get field group options
  const fieldGroupOptions: MultiSelectOption[] = Object.entries(FILTER_FIELD_GROUPS)
    .map(([key, group]) => ({
      value: key,
      label: group.label,
      description: group.description
    }))
  
  // Apply field group selection
  const applyFieldGroup = (groupKeys: string[]) => {
    const newFields = new Set(preferences.activeFields)
    
    groupKeys.forEach(groupKey => {
      const group = FILTER_FIELD_GROUPS[groupKey as keyof typeof FILTER_FIELD_GROUPS]
      if (group) {
        group.fields.forEach(field => newFields.add(field))
      }
    })
    
    savePreferences({ ...preferences, activeFields: Array.from(newFields) })
  }
  
  // Render individual filter input
  const renderFilterInput = (fieldKey: string, config: FilterFieldConfig) => {
    const value = filters[fieldKey]
    
    switch (config.type) {
      case 'text':
        return (
          <Input
            placeholder={config.placeholder}
            value={String(value || '')}
            onChange={(e) => handleFilterChange(fieldKey, e.target.value)}
          />
        )
      
      case 'select':
        // Handle async fields with ComboBox
        if (config.async) {
          const options = asyncOptions[fieldKey] || []
          return (
            <ComboBox
              options={options}
              value={String(value || '')}
              onValueChange={(newValue) => handleFilterChange(fieldKey, newValue === '' ? undefined : newValue)}
              placeholder={config.placeholder || `Select ${config.label.toLowerCase()}...`}
              allowCustomValue={true}
            />
          )
        }
        
        // Handle regular select fields
        return (
          <Select
            value={String(value || '')}
            onValueChange={(newValue) => handleFilterChange(fieldKey, newValue === 'all' ? undefined : newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={config.placeholder || `Select ${config.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {config.label.toLowerCase()}</SelectItem>
              {config.options?.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={config.placeholder}
            value={String(value || '')}
            min={config.minValue}
            max={config.maxValue}
            onChange={(e) => handleFilterChange(fieldKey, e.target.value ? Number(e.target.value) : undefined)}
          />
        )
      
      case 'numberrange':
        const rangeValue = Array.isArray(value) ? value as [number, number] : [undefined, undefined]
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={String(rangeValue[0] || '')}
              min={config.minValue}
              max={config.maxValue}
              onChange={(e) => handleFilterChange(fieldKey, [
                e.target.value ? Number(e.target.value) : undefined,
                rangeValue[1]
              ])}
            />
            <Input
              type="number"
              placeholder="Max"
              value={String(rangeValue[1] || '')}
              min={config.minValue}
              max={config.maxValue}
              onChange={(e) => handleFilterChange(fieldKey, [
                rangeValue[0],
                e.target.value ? Number(e.target.value) : undefined
              ])}
            />
          </div>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={String(value || '')}
            onChange={(e) => handleFilterChange(fieldKey, e.target.value)}
          />
        )
      
      case 'daterange':
        const dateRangeValue = Array.isArray(value) ? value as [string, string] : ['', '']
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={dateRangeValue[0] || ''}
              onChange={(e) => handleFilterChange(fieldKey, [e.target.value, dateRangeValue[1]])}
            />
            <Input
              type="date"
              placeholder="To"
              value={dateRangeValue[1] || ''}
              onChange={(e) => handleFilterChange(fieldKey, [dateRangeValue[0], e.target.value])}
            />
          </div>
        )
      
      case 'boolean':
        return (
          <Select
            value={value === undefined ? 'all' : String(value)}
            onValueChange={(newValue) => handleFilterChange(fieldKey, 
              newValue === 'all' ? undefined : newValue === 'true'
            )}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )
      
      default:
        return null
    }
  }
  
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  )
  
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />
      case 'number':
      case 'numberrange': return <Hash className="h-4 w-4" />
      case 'date':
      case 'daterange': return <Calendar className="h-4 w-4" />
      default: return <Filter className="h-4 w-4" />
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header with field management */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Advanced Filters</h3>
          <Badge variant="outline">
            {preferences.activeFields.length} active field{preferences.activeFields.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Fields
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Filter Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <Tabs defaultValue="groups" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="groups">Field Groups</TabsTrigger>
                  <TabsTrigger value="individual">Individual Fields</TabsTrigger>
                </TabsList>
                
                <TabsContent value="groups" className="space-y-2">
                  <div className="p-2">
                    <MultiSelect
                      options={fieldGroupOptions}
                      selected={[]}
                      onSelectedChange={applyFieldGroup}
                      placeholder="Select field groups to add..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="individual" className="space-y-2">
                  <div className="p-2">
                    <MultiSelect
                      options={availableFieldOptions}
                      selected={[]}
                      onSelectedChange={(selected) => {
                        selected.forEach(fieldKey => addField(fieldKey))
                      }}
                      placeholder="Select individual fields to add..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Active filter fields */}
      {preferences.activeFields.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No filter fields selected</p>
          <Button 
            variant="outline" 
            onClick={() => savePreferences({ 
              ...preferences, 
              activeFields: DEFAULT_FILTER_PREFERENCES.activeFields 
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Default Filters
          </Button>
        </Card>
      ) : (
        <div className={`grid gap-4 ${
          preferences.layout === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {preferences.activeFields.map((fieldKey) => {
            const config = FILTER_FIELDS[fieldKey]
            if (!config) return null
            
            return (
              <div key={fieldKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={fieldKey} className="flex items-center gap-2 text-sm font-medium">
                    {getFieldIcon(config.type)}
                    {config.label}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeField(fieldKey)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {renderFilterInput(fieldKey, config)}
                {config.description && (
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Apply Filters Button */}
      {preferences.activeFields.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPreferences(prev => ({ 
            ...prev, 
            autoApply: !prev.autoApply 
          }))}>
            Auto Apply: {preferences.autoApply ? 'On' : 'Off'}
          </Button>
          <Button onClick={applyFilters}>
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Multi-select component for filter field selection
 */

"use client"

import * as React from "react"
import { ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxSelected?: number
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onSelectedChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  maxSelected,
  className,
  disabled = false
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onSelectedChange(selected.filter((item) => item !== value))
    } else {
      if (maxSelected && selected.length >= maxSelected) {
        return
      }
      onSelectedChange([...selected, value])
    }
  }

  const handleRemove = (value: string) => {
    onSelectedChange(selected.filter((item) => item !== value))
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value))
  
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={cn("w-full", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-normal",
              !selected.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
              {selected.length === 0 ? (
                placeholder
              ) : selected.length === 1 ? (
                selectedOptions[0]?.label || selected[0]
              ) : (
                `${selected.length} items selected`
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <div className="p-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <DropdownMenuSeparator />
          {selected.length > 0 && (
            <>
              <DropdownMenuLabel>Selected ({selected.length})</DropdownMenuLabel>
              {selectedOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={`selected-${option.value}`}
                  checked={true}
                  onCheckedChange={() => handleSelect(option.value)}
                >
                  <div className="flex-1">
                    <div>{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel>Available Options</DropdownMenuLabel>
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No options found.
            </div>
          ) : (
            filteredOptions
              .filter((option) => !selected.includes(option.value))
              .map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={false}
                  onCheckedChange={() => handleSelect(option.value)}
                  disabled={maxSelected ? selected.length >= maxSelected : false}
                >
                  <div className="flex-1">
                    <div>{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </DropdownMenuCheckboxItem>
              ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleRemove(option.value)}
            >
              {option.label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

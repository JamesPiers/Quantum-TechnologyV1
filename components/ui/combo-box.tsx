/**
 * ComboBox component that supports both dropdown selection and typing
 */

"use client"

import * as React from "react"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export interface ComboBoxOption {
  value: string
  label: string
}

interface ComboBoxProps {
  options: ComboBoxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  allowCustomValue?: boolean
}

export function ComboBox({
  options,
  value,
  onValueChange,
  placeholder = "Select or type...",
  className,
  disabled = false,
  allowCustomValue = true
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isTypingMode, setIsTypingMode] = React.useState(false)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
    setSearchTerm('')
    setIsTypingMode(false)
  }

  const handleInputChange = (newValue: string) => {
    onValueChange(newValue)
  }

  const selectedOption = options.find(option => option.value === value)

  // If we're in typing mode or allowCustomValue is true and no option matches, show input
  if (isTypingMode || (allowCustomValue && !selectedOption && value)) {
    return (
      <div className={cn("relative", className)}>
        <Input
          value={value || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={() => setIsTypingMode(false)}
          className="pr-8"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          onClick={() => setIsTypingMode(false)}
          disabled={disabled}
        >
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </div>
    )
  }

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
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {selectedOption?.label || value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <div className="p-2">
            <Input
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <DropdownMenuSeparator />
          
          {allowCustomValue && (
            <>
              <DropdownMenuItem onSelect={() => setIsTypingMode(true)}>
                <span className="text-sm text-muted-foreground">
                  Type custom value...
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No options found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className="cursor-pointer"
              >
                <div className="flex items-center w-full">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

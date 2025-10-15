/**
 * Part detail information component
 * Displays all part fields in an organized grid layout
 */

'use client'

import { PartReadable } from '@/lib/schemas'
import { formatCurrency } from '@/lib/format'

interface PartDetailInfoProps {
  part: PartReadable
}

export function PartDetailInfo({ part }: PartDetailInfoProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Part Information</h2>
      
      {/* Core Identification */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField label="Part Code" value={part.part} />
          <InfoField label="Category" value={part.category_name} />
          <InfoField label="Part Number" value={part.part_number} />
          <InfoField label="Manufacturer" value={part.manufacturer_name} />
          <InfoField label="Supplier" value={part.supplier_name} />
        </div>
      </div>
      
      {/* Value Parameters */}
      {(part.value_param_1 || part.value_param_2) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Value Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {part.value_param_1 && (
              <InfoField 
                label="Value Parameter 1" 
                value={`${part.value_param_1}${part.units_1 ? ` ${part.units_1}` : ''}`} 
              />
            )}
            {part.value_param_2 && (
              <InfoField 
                label="Value Parameter 2" 
                value={`${part.value_param_2}${part.units_2 ? ` ${part.units_2}` : ''}`} 
              />
            )}
          </div>
        </div>
      )}
      
      {/* Project Information */}
      {(part.project || part.section || part.drawing || part.drawing_id) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Project Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoField label="Project" value={part.project} />
            <InfoField label="Section" value={part.section} />
            <InfoField label="Drawing" value={part.drawing} />
            <InfoField label="Drawing ID" value={part.drawing_id} />
          </div>
        </div>
      )}
      
      {/* Quantities & Pricing */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Quantities & Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoField label="Quantity" value={part.quantity} />
          <InfoField label="Spare Quantity" value={part.spare_quantity} />
          <InfoField label="Total Quantity" value={part.total_quantity} />
          <InfoField 
            label="Unit Price" 
            value={part.unit_price ? formatCurrency(part.unit_price, part.currency_code) : null} 
          />
          <InfoField 
            label="Line Total" 
            value={part.line_total ? formatCurrency(part.line_total, part.currency_code) : null} 
          />
          <InfoField label="Currency" value={part.currency_name} />
        </div>
      </div>
      
      {/* Purchase Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Purchase Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoField label="Purchase Order" value={part.purchase_order} />
          <InfoField label="Order Date" value={part.order_date} />
          <InfoField label="Lead Time" value={part.lead_time_weeks ? `${part.lead_time_weeks} weeks` : null} />
          <InfoField label="Responsible Person" value={part.responsible_person} />
          <InfoField label="Status" value={part.status_label} />
        </div>
      </div>
      
      {/* Additional Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Location" value={part.location_name || part.location_code} />
          <InfoField label="Budget Item" value={part.is_budget_item ? 'Yes' : 'No'} />
          <InfoField label="Last Updated By" value={part.last_updated_by} />
          <InfoField label="Last Update Date" value={part.last_update_date} />
        </div>
        {part.notes && (
          <div className="mt-4">
            <InfoField label="Notes" value={part.notes} fullWidth />
          </div>
        )}
      </div>
      
      {/* System Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Created At" value={new Date(part.created_at).toLocaleString()} />
          <InfoField label="Updated At" value={new Date(part.updated_at).toLocaleString()} />
        </div>
      </div>
    </div>
  )
}

interface InfoFieldProps {
  label: string
  value: string | number | null | undefined
  fullWidth?: boolean
}

function InfoField({ label, value, fullWidth = false }: InfoFieldProps) {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value !== null && value !== undefined && value !== '' ? value : (
          <span className="text-gray-400">—</span>
        )}
      </dd>
    </div>
  )
}


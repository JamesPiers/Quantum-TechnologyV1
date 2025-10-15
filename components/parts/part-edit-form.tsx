/**
 * Part edit form component
 * Comprehensive form for editing all part fields with validation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PartReadable } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, X, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PartEditFormProps {
  part: PartReadable
  suppliers: Array<{ id: string; name: string }>
  manufacturers: Array<{ id: string; name: string }>
  statusCodes: Array<{ code: number; label: string; description: string | null }>
}

export function PartEditForm({ part, suppliers, manufacturers, statusCodes }: PartEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    part: part.part,
    desc: part.description || '',
    c: part.category_code,
    pn: part.part_number || '',
    sup: part.supplier_id || '',
    mfg: part.manufacturer_id || '',
    vp1: part.value_param_1?.toString() || '',
    up1: part.units_1 || '',
    vp2: part.value_param_2?.toString() || '',
    up2: part.units_2 || '',
    proj: part.project || '',
    sec: part.section || '',
    dwg: part.drawing || '',
    id_from_dwg: part.drawing_id || '',
    qty: part.quantity.toString(),
    spare: part.spare_quantity.toString(),
    po: part.purchase_order || '',
    ord: part.order_date || '',
    wk: part.lead_time_weeks?.toString() || '',
    s: part.status_code.toString(),
    each: part.unit_price?.toString() || '',
    d: part.currency_code,
    re_sp: part.responsible_person || '',
    n: part.notes || '',
    l: part.link || '',
    lc: part.location_code || '',
    b: part.is_budget_item,
  })
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Prepare update payload
      const updatePayload: any = {
        part: formData.part,
        desc: formData.desc || null,
        c: formData.c,
        pn: formData.pn || null,
        sup: formData.sup || null,
        mfg: formData.mfg || null,
        vp1: formData.vp1 ? parseFloat(formData.vp1) : null,
        up1: formData.up1 || null,
        vp2: formData.vp2 ? parseFloat(formData.vp2) : null,
        up2: formData.up2 || null,
        proj: formData.proj || null,
        sec: formData.sec || null,
        dwg: formData.dwg || null,
        id_from_dwg: formData.id_from_dwg || null,
        qty: parseInt(formData.qty) || 0,
        spare: parseInt(formData.spare) || 0,
        po: formData.po || null,
        ord: formData.ord || null,
        wk: formData.wk ? parseInt(formData.wk) : null,
        s: parseInt(formData.s),
        each: formData.each ? parseFloat(formData.each) : null,
        d: formData.d,
        re_sp: formData.re_sp || null,
        n: formData.n || null,
        l: formData.l || null,
        lc: formData.lc || null,
        b: formData.b,
      }
      
      // Call API to update part
      const response = await fetch(`/api/parts/${part.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update part')
      }
      
      // Redirect back to part detail page
      router.push(`/parts/${part.id}`)
      router.refresh()
    } catch (err) {
      console.error('Error updating part:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return
      }
    }
    router.push(`/parts/${part.id}`)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Core Identification */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Core Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="part">Part Code *</Label>
            <Input
              id="part"
              value={formData.part}
              onChange={(e) => handleChange('part', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="c">Category *</Label>
            <Select value={formData.c} onValueChange={(value) => handleChange('c', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m">Material</SelectItem>
                <SelectItem value="e">Electrical</SelectItem>
                <SelectItem value="t">Electronics</SelectItem>
                <SelectItem value="s">Systems</SelectItem>
                <SelectItem value="p">Plumbing</SelectItem>
                <SelectItem value="c">Compressors</SelectItem>
                <SelectItem value="v">Vacuum</SelectItem>
                <SelectItem value="x">Misc/Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={formData.desc}
              onChange={(e) => handleChange('desc', e.target.value)}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="pn">Part Number</Label>
            <Input
              id="pn"
              value={formData.pn}
              onChange={(e) => handleChange('pn', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="mfg">Manufacturer</Label>
            <Select value={formData.mfg} onValueChange={(value) => handleChange('mfg', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {manufacturers.map((mfg) => (
                  <SelectItem key={mfg.id} value={mfg.id}>
                    {mfg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sup">Supplier</Label>
            <Select value={formData.sup} onValueChange={(value) => handleChange('sup', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {suppliers.map((sup) => (
                  <SelectItem key={sup.id} value={sup.id}>
                    {sup.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Value Parameters */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Value Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="vp1">Value Parameter 1</Label>
              <Input
                id="vp1"
                type="number"
                step="any"
                value={formData.vp1}
                onChange={(e) => handleChange('vp1', e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="up1">Units</Label>
              <Input
                id="up1"
                value={formData.up1}
                onChange={(e) => handleChange('up1', e.target.value)}
                placeholder="e.g., mm"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="vp2">Value Parameter 2</Label>
              <Input
                id="vp2"
                type="number"
                step="any"
                value={formData.vp2}
                onChange={(e) => handleChange('vp2', e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="up2">Units</Label>
              <Input
                id="up2"
                value={formData.up2}
                onChange={(e) => handleChange('up2', e.target.value)}
                placeholder="e.g., kg"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Project Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="proj">Project</Label>
            <Input
              id="proj"
              value={formData.proj}
              onChange={(e) => handleChange('proj', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="sec">Section</Label>
            <Input
              id="sec"
              value={formData.sec}
              onChange={(e) => handleChange('sec', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="dwg">Drawing</Label>
            <Input
              id="dwg"
              value={formData.dwg}
              onChange={(e) => handleChange('dwg', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="id_from_dwg">Drawing ID</Label>
            <Input
              id="id_from_dwg"
              value={formData.id_from_dwg}
              onChange={(e) => handleChange('id_from_dwg', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Quantities & Pricing */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quantities & Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min="0"
              value={formData.qty}
              onChange={(e) => handleChange('qty', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="spare">Spare Quantity</Label>
            <Input
              id="spare"
              type="number"
              min="0"
              value={formData.spare}
              onChange={(e) => handleChange('spare', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="each">Unit Price</Label>
            <Input
              id="each"
              type="number"
              step="0.01"
              min="0"
              value={formData.each}
              onChange={(e) => handleChange('each', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="d">Currency</Label>
            <Select value={formData.d} onValueChange={(value) => handleChange('d', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="C">CAD</SelectItem>
                <SelectItem value="U">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Purchase Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Purchase Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="po">Purchase Order</Label>
            <Input
              id="po"
              value={formData.po}
              onChange={(e) => handleChange('po', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="ord">Order Date</Label>
            <Input
              id="ord"
              type="date"
              value={formData.ord}
              onChange={(e) => handleChange('ord', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="wk">Lead Time (weeks)</Label>
            <Input
              id="wk"
              type="number"
              min="0"
              value={formData.wk}
              onChange={(e) => handleChange('wk', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="re_sp">Responsible Person</Label>
            <Input
              id="re_sp"
              value={formData.re_sp}
              onChange={(e) => handleChange('re_sp', e.target.value)}
              placeholder="Initials"
            />
          </div>
          
          <div>
            <Label htmlFor="s">Status</Label>
            <Select value={formData.s} onValueChange={(value) => handleChange('s', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusCodes.map((status) => (
                  <SelectItem key={status.code} value={status.code.toString()}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lc">Location Code</Label>
            <Input
              id="lc"
              value={formData.lc}
              onChange={(e) => handleChange('lc', e.target.value)}
              placeholder="e.g., IW, CP, QW"
            />
          </div>
          
          <div>
            <Label htmlFor="l">Link</Label>
            <Input
              id="l"
              type="url"
              value={formData.l}
              onChange={(e) => handleChange('l', e.target.value)}
              placeholder="https://"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="n">Notes</Label>
            <Textarea
              id="n"
              value={formData.n}
              onChange={(e) => handleChange('n', e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              id="b"
              type="checkbox"
              checked={formData.b}
              onChange={(e) => handleChange('b', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="b" className="cursor-pointer">
              Budget Item
            </Label>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      
      {hasChanges && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <AlertCircle className="h-4 w-4" />
          <span>You have unsaved changes</span>
        </div>
      )}
    </form>
  )
}


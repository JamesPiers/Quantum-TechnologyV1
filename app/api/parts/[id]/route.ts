/**
 * API route for part operations (GET, PATCH, DELETE)
 * Includes automatic audit logging for all changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { ServerDB, getUser } from '@/lib/supabase-server'
import { UpdatePartSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'

/**
 * GET /api/parts/[id]
 * Fetch a single part by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await ServerDB.create()
    
    const { data: part, error } = await db.getPartById(id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch part', details: error.message },
        { status: 500 }
      )
    }
    
    if (!part) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(part)
  } catch (error) {
    console.error('Error fetching part:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/parts/[id]
 * Update a part with automatic audit logging
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validate the update payload
    const validationResult = UpdatePartSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid part data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }
    
    const db = await ServerDB.create()
    
    // Fetch the current part to compare changes
    const { data: currentPart, error: fetchError } = await db.getPartById(id)
    
    if (fetchError || !currentPart) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      )
    }
    
    // Update the part
    const { data: updatedPart, error: updateError } = await db.updatePart(id, validationResult.data)
    
    if (updateError) {
      console.error('Error updating part:', updateError)
      return NextResponse.json(
        { error: 'Failed to update part', details: updateError.message },
        { status: 500 }
      )
    }
    
    // The trigger will automatically log the changes to audit_events
    // But we can also manually log specific actions if needed
    
    // Check if price changed for special tracking
    if (body.each !== undefined && body.each !== currentPart.unit_price) {
      await db.logAuditEvent({
        user_id: user.id,
        entity: 'parts',
        entity_id: id,
        action: 'price_change',
        payload: {
          old_price: currentPart.unit_price,
          new_price: body.each,
          currency: body.d || currentPart.currency_code,
          notes: `Price changed from ${currentPart.unit_price || 'N/A'} to ${body.each}`
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      part: updatedPart,
      message: 'Part updated successfully'
    })
  } catch (error) {
    console.error('Error updating part:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/parts/[id]
 * Delete a part (with audit logging)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const db = await ServerDB.create()
    
    // Log the deletion before actually deleting
    await db.logAuditEvent({
      user_id: user.id,
      entity: 'parts',
      entity_id: id,
      action: 'delete',
      payload: {
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      }
    })
    
    const { error } = await db.deletePart(id)
    
    if (error) {
      console.error('Error deleting part:', error)
      return NextResponse.json(
        { error: 'Failed to delete part', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Part deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting part:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


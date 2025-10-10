/**
 * Server-side Supabase utilities for Next.js
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './db'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Server-side user authentication utilities
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

/**
 * Check if the current user is authenticated
 */
export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Check if the current user has admin privileges
 */
export async function requireAdmin() {
  const user = await requireAuth()
  
  const isAdmin = user.user_metadata?.role === 'admin' || 
                  user.app_metadata?.role === 'admin' ||
                  user.app_metadata?.user_role === 'admin'
  
  if (!isAdmin) {
    throw new Error('Admin privileges required')
  }
  
  return user
}

/**
 * Server-side database operations with proper auth context
 */
export class ServerDB {
  private supabase: Awaited<ReturnType<typeof createClient>>

  private constructor(supabase: Awaited<ReturnType<typeof createClient>>) {
    this.supabase = supabase
  }

  static async create() {
    const supabase = await createClient()
    return new ServerDB(supabase)
  }

  async getParts(filters?: {
    po?: string
    customer?: string
    part?: string
    manufacturer?: string
    supplier?: string
    status?: number
    project?: string
    category?: string
    limit?: number
    offset?: number
  }) {
    const {
      po,
      customer,
      part,
      manufacturer,
      supplier,
      status,
      project,
      category,
      limit = 50,
      offset = 0
    } = filters || {}

    return await this.supabase.rpc('rpc_search_parts', {
      search_po: po,
      search_customer: customer,
      search_part: part,
      search_manufacturer: manufacturer,
      search_supplier: supplier,
      search_status: status,
      search_project: project,
      search_category: category,
      limit_count: limit,
      offset_count: offset
    })
  }

  async getPartById(id: string) {
    return await this.supabase
      .from('v_parts_readable')
      .select('*')
      .eq('id', id)
      .single()
  }

  async createPart(part: Database['public']['Tables']['parts']['Insert']) {
    return await this.supabase
      .from('parts')
      .insert(part)
      .select()
      .single()
  }

  async updatePart(id: string, updates: Database['public']['Tables']['parts']['Update']) {
    return await this.supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async deletePart(id: string) {
    return await this.supabase
      .from('parts')
      .delete()
      .eq('id', id)
  }

  async getSuppliers() {
    return await this.supabase
      .from('suppliers')
      .select('*')
      .order('name')
  }

  async createSupplier(supplier: Database['public']['Tables']['suppliers']['Insert']) {
    return await this.supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single()
  }

  async upsertSupplier(supplier: Database['public']['Tables']['suppliers']['Insert']) {
    return await this.supabase
      .from('suppliers')
      .upsert(supplier, { onConflict: 'name' })
      .select()
      .single()
  }

  async getManufacturers() {
    return await this.supabase
      .from('manufacturers')
      .select('*')
      .order('name')
  }

  async createManufacturer(manufacturer: Database['public']['Tables']['manufacturers']['Insert']) {
    return await this.supabase
      .from('manufacturers')
      .insert(manufacturer)
      .select()
      .single()
  }

  async upsertManufacturer(manufacturer: Database['public']['Tables']['manufacturers']['Insert']) {
    return await this.supabase
      .from('manufacturers')
      .upsert(manufacturer, { onConflict: 'name' })
      .select()
      .single()
  }

  async getCustomers() {
    return await this.supabase
      .from('customers')
      .select('*')
      .order('customer_number')
  }

  async createCustomer(customer: Database['public']['Tables']['customers']['Insert']) {
    return await this.supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
  }

  async upsertCustomer(customer: Database['public']['Tables']['customers']['Insert']) {
    return await this.supabase
      .from('customers')
      .upsert(customer, { onConflict: 'customer_number' })
      .select()
      .single()
  }

  async getStatusCodes() {
    return await this.supabase
      .from('status_codes')
      .select('*')
      .order('code')
  }

  async getPurchaseOrders() {
    return await this.supabase
      .from('v_po_summary')
      .select('*')
      .order('created_at', { ascending: false })
  }

  async getPurchaseOrderById(id: string) {
    return await this.supabase
      .from('v_po_summary')
      .select('*')
      .eq('id', id)
      .single()
  }

  async createPurchaseOrder(po: Database['public']['Tables']['purchase_orders']['Insert']) {
    return await this.supabase
      .from('purchase_orders')
      .insert(po)
      .select()
      .single()
  }

  async logAuditEvent(event: {
    user_id?: string
    entity: string
    entity_id?: string
    action: string
    payload?: Record<string, any>
  }) {
    return await this.supabase
      .from('audit_events')
      .insert(event)
  }

  async createRawIngestRecord(record: Database['public']['Tables']['raw_ingest']['Insert']) {
    return await this.supabase
      .from('raw_ingest')
      .insert(record)
      .select()
      .single()
  }

  async updateRawIngestRecord(id: string, updates: Database['public']['Tables']['raw_ingest']['Update']) {
    return await this.supabase
      .from('raw_ingest')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }
}

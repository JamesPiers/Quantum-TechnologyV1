# Part Detail View Feature

## Overview

A comprehensive part detail view system that allows users to view everything about a part in one place, edit data, and track all changes through a detailed audit log.

## Features

### 1. Comprehensive Part Display
- **All Part Information**: Displays all fields organized in logical sections:
  - Core Identification (Part code, category, manufacturer, supplier, part number)
  - Value Parameters (VP1, VP2 with units)
  - Project Information (Project, section, drawing references)
  - Quantities & Pricing (Quantity, spare, unit price, line total)
  - Purchase Information (PO, order date, lead time, status)
  - Additional Information (Location, budget item, notes, links)
  - System Information (Created/updated timestamps)

### 2. Price History & Quotes
- Track all price changes over time
- Visual indicators for price increases (red) and decreases (green)
- Percentage change calculations
- Currency support (CAD/USD)
- Change timestamps and user tracking

### 3. Purchase Orders
- View all POs that include this part
- Show PO details:
  - PO number with link to PO detail page
  - Order date
  - Supplier information
  - Quantity and pricing per PO
  - Status indicators
- Calculate total quantities and values across all POs

### 4. Documents
- Organized by type (Drawing, Datasheet, Quote, Invoice, Other)
- Sorted chronologically within each type
- Links to external documents
- File size and upload date display
- Placeholder for future document upload feature

### 5. Related Parts
- Shows other parts with the same part code
- Useful for identifying duplicates or variants
- Quick navigation between related parts
- Display key differentiators (project, PO, supplier)

### 6. Collapsible Change Log
- **Collapsed by default** - saves screen space
- Comprehensive audit trail of all changes
- Shows:
  - Date and time of each change
  - Action type (Created, Updated, Price Changed, Deleted)
  - Specific fields that changed with old → new values
  - User who made the change
- Color-coded change indicators (red for old, green for new)

### 7. Edit Mode
- Comprehensive edit form with all fields
- Form validation
- Real-time change detection
- Confirmation on cancel if unsaved changes
- Organized into logical sections matching the detail view
- Dropdowns for:
  - Category
  - Manufacturer
  - Supplier
  - Status
  - Currency

### 8. Automatic Change Tracking
- Database trigger automatically logs all changes
- Captures:
  - Old and new values for every field
  - Timestamp of change
  - User who made the change
- Special tracking for price changes
- Changes appear immediately in the change log

## File Structure

```
app/(app)/parts/[id]/
├── page.tsx                          # Part detail view page
└── edit/
    └── page.tsx                      # Part edit page

components/parts/
├── part-detail-header.tsx            # Part header with title, status, actions
├── part-detail-info.tsx              # Main part information display
├── part-price-history.tsx            # Price history table
├── part-purchase-orders.tsx          # POs list table
├── part-documents.tsx                # Documents organized by type
├── related-parts.tsx                 # Related parts sidebar
├── part-change-log.tsx               # Collapsible audit log
└── part-edit-form.tsx                # Comprehensive edit form

app/api/parts/[id]/
└── route.ts                          # API endpoints (GET, PATCH, DELETE)

supabase/migrations/
└── 20241015000001_part_detail_functions.sql  # Database functions and triggers
```

## Database Functions

### `rpc_get_part_price_history(part_id_param uuid)`
Returns the price change history for a part from audit events.

### `rpc_get_part_purchase_orders(part_id_param uuid)`
Returns all POs that include this part, from both `po_line_items` and the legacy `parts.po` field.

### `rpc_get_part_audit_log(part_id_param uuid)`
Returns the complete audit trail for a part.

### `rpc_get_related_parts(part_code_param text)`
Returns all parts with the same part code (for identifying duplicates).

### `log_part_change()` Trigger Function
Automatically logs all changes to parts table to audit_events with detailed field-by-field comparison.

## Usage

### Viewing a Part
1. Navigate to the Parts page
2. Click the eye icon (👁) next to any part in the table
3. View comprehensive part details with tabs for:
   - Purchase Orders
   - Price History
   - Documents

### Editing a Part
1. From the part detail page, click "Edit Part" button
2. Or click the edit icon (✏️) from the parts table
3. Make changes in the form
4. Click "Save Changes" to update (or "Cancel" to discard)
5. Changes are automatically logged in the change history

### Viewing Change Log
1. Scroll to the bottom of the part detail page
2. Click "Expand" to view the full change log
3. Review all changes with old → new value comparisons
4. Click "Collapse" to hide the change log

## API Endpoints

### `GET /api/parts/[id]`
Fetch a single part by ID.

**Response:**
```json
{
  "id": "uuid",
  "part": "string",
  "description": "string",
  // ... all part fields
}
```

### `PATCH /api/parts/[id]`
Update a part with automatic audit logging.

**Request Body:**
```json
{
  "part": "string",
  "desc": "string",
  "qty": 10,
  "each": 25.99,
  // ... any fields to update
}
```

**Response:**
```json
{
  "success": true,
  "part": { /* updated part data */ },
  "message": "Part updated successfully"
}
```

### `DELETE /api/parts/[id]`
Delete a part (with audit logging).

**Response:**
```json
{
  "success": true,
  "message": "Part deleted successfully"
}
```

## Navigation Flow

```
Parts List (/parts)
  ├─→ Part Detail (/parts/[id])
  │    ├─→ View Purchase Orders
  │    ├─→ View Price History
  │    ├─→ View Documents
  │    ├─→ View Related Parts
  │    └─→ Edit Part (/parts/[id]/edit)
  │         └─→ Save → Back to Detail
  │
  └─→ Edit Part (/parts/[id]/edit)
       └─→ Save → Part Detail
```

## Database Migration

To apply the database functions and triggers:

```bash
# The migration will be applied automatically on next deployment
# Or manually run:
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20241015000001_part_detail_functions.sql
```

## Future Enhancements

1. **Document Management**
   - Upload documents directly from the part detail page
   - Document categorization and tagging
   - Version control for documents

2. **Price Comparison**
   - Compare prices across suppliers
   - Track quote history
   - Price alerts for significant changes

3. **Inventory Tracking**
   - Real-time inventory levels
   - Location tracking within warehouses
   - Reorder point alerts

4. **Advanced Filtering**
   - Filter change log by date range, user, or action type
   - Filter POs by status or date
   - Search within documents

5. **Export Capabilities**
   - Export part details to PDF
   - Export change log to CSV
   - Export document lists

6. **Notifications**
   - Email notifications on part changes
   - Price change alerts
   - Status change notifications

## Testing Notes

**Note**: The database is currently empty, so to test this feature you'll need to:

1. Import your parts data (using the existing import scripts)
2. Or manually create test parts through the UI
3. Navigate to any part to view the detail page
4. Edit the part to test change tracking
5. Make multiple edits to see the change log populate

**Finding Duplicate Parts**: The system currently has no duplicate parts in the database. Once you have data, parts with the same part code will automatically show in the "Related Parts" section.

## Technical Details

### Authentication
- All routes require authentication
- User ID is automatically captured for audit logging
- Row Level Security (RLS) enforces data access

### Performance
- Efficient database queries with proper indexing
- Parallel data fetching for related information
- Client-side caching of dropdown data

### Data Validation
- Zod schema validation on all updates
- Type-safe API endpoints
- Form validation with error messages

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- ARIA attributes on interactive elements


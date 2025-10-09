# Quantum Technology - Parts & Supplier Management System

A comprehensive, production-ready web service for managing parts inventory, suppliers, and purchase orders with PDF processing capabilities.

## Features

- **PDF Processing**: Automatic extraction and parsing of purchase orders and quotes
- **Advanced Search**: Multi-field search with filters by PO, customer, manufacturer, supplier, and more
- **Parts Management**: Complete parts database with categorization and tracking
- **Supplier Management**: Comprehensive supplier and manufacturer management
- **Purchase Order Tracking**: Full PO lifecycle management with line items
- **Reporting & Analytics**: Built-in reports for spend analysis, inventory, and trends
- **Secure & Compliant**: Role-based access control with comprehensive audit trails
- **Modern UI**: Clean, responsive interface built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Storage**: Supabase Storage for PDF files
- **Authentication**: Supabase Auth with email magic links
- **Deployment**: Vercel (recommended)
- **Testing**: Vitest, React Testing Library

## Project Structure

```
quantum-instructions/
├── app/
│   ├── (marketing)/          # Marketing pages
│   ├── (app)/               # Authenticated app routes
│   │   ├── dashboard/       # Dashboard page
│   │   ├── parts/          # Parts management
│   │   ├── suppliers/      # Supplier management
│   │   ├── purchase-orders/ # PO management
│   │   └── reports/        # Analytics & reports
│   └── api/                # API routes
│       ├── search/         # Search endpoint
│       ├── parts/ingest/   # PDF ingest
│       └── exports/csv/    # CSV export
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── dashboard/         # Dashboard components
│   └── parts/            # Parts-specific components
├── lib/                  # Utility libraries
│   ├── db.ts            # Database client
│   ├── schemas.ts       # Zod schemas & types
│   ├── search.ts        # Search utilities
│   ├── ocr-mapping.ts   # PDF parsing logic
│   └── format.ts        # Formatting utilities
├── supabase/            # Supabase configuration
│   ├── migrations/      # Database migrations
│   ├── seed/           # Seed data
│   └── functions/      # Edge functions
└── src/test/           # Test files
```

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Vercel account (for deployment)
- Git

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd quantum-instructions
npm install
```

### 2. Environment Configuration

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Optional: Email Configuration
RESEND_API_KEY=your_resend_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

#### Install Supabase CLI

```bash
npm install -g supabase
```

#### Login and Link Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

#### Run Database Migrations

```bash
supabase db push
```

#### Seed the Database

```bash
supabase db reset --with-seed
```

#### Deploy Edge Functions

```bash
supabase functions deploy pdf_ingest
```

#### Configure Storage Bucket

Create the `incoming-pdfs` bucket in your Supabase dashboard:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `incoming-pdfs`
3. Set it to private (not public)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Database Schema

The system uses the following main tables:

- **manufacturers**: Manufacturer information
- **suppliers**: Supplier contacts and details  
- **customers**: Customer information
- **status_codes**: Part status definitions (0-9)
- **parts**: Main parts inventory with all attributes
- **purchase_orders**: Normalized purchase order data
- **po_line_items**: Purchase order line items
- **audit_events**: System activity logging
- **raw_ingest**: PDF processing audit trail

Key views:
- **v_parts_readable**: Human-readable parts view with joined data
- **v_po_summary**: Purchase order summaries with totals

### Column Mapping

The parts table maps to the original "Instructions Database Column Rules":

| Original | Database Column | Description |
|----------|----------------|-------------|
| C | c | Category code (m/e/t/s/p/c/v/x) |
| PART | part | Primary part code |
| DESC | desc | Description |
| VP1/UP1 | vp1/up1 | Value parameter 1 & units |
| VP2/UP2 | vp2/up2 | Value parameter 2 & units |
| SUP | sup | Supplier (FK) |
| MFG | mfg | Manufacturer (FK) |
| PN | pn | Part number |
| PROJ | proj | Project code |
| SEC | sec | Section |
| DWG | dwg | Drawing reference |
| ID | id_from_dwg | Drawing identifier |
| QTY | qty | Quantity |
| SPARE | spare | Spare quantity |
| PO | po | Purchase order |
| RE SP | re_sp | Responsible person |
| ORD | ord | Order date |
| WK | wk | Lead time (weeks) |
| S | s | Status code |
| EACH | each | Unit price |
| D | d | Currency (C/U) |
| N | n | Notes |
| L | l | Link/URL |
| B | b | Budget flag |
| W | w | Last updated by |
| UPD | upd | Update date |
| LC | lc | Location code |

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run
```

Tests cover:
- Search utilities and CSV formatting
- OCR mapping and PDF parsing logic
- Database RPC functions

## API Endpoints

### Search API
```
GET /api/search?po=PO-123&part=VALVE&limit=50&offset=0
```

Query parameters:
- `po`: Purchase order number
- `customer`: Customer number
- `part`: Part code/number/description
- `manufacturer`: Manufacturer name
- `supplier`: Supplier name
- `status`: Status code (0-9)
- `project`: Project code
- `category`: Category code (m/e/t/s/p/c/v/x)
- `limit`: Results per page (max 500)
- `offset`: Pagination offset

### PDF Ingest API
```
POST /api/parts/ingest
Content-Type: application/json

{
  "filePaths": ["path/to/uploaded/file.pdf"]
}
```

### CSV Export API
```
GET /api/exports/csv?po=PO-123&category=v
```
Same query parameters as search API.

## PDF Processing

The system automatically processes uploaded PDFs:

1. **Upload**: Files are stored in Supabase Storage
2. **Processing**: Edge function extracts text and structured data
3. **Parsing**: OCR mapping identifies parts, suppliers, PO data
4. **Database**: Creates/updates parts, suppliers, POs automatically

Supported patterns:
- Purchase order numbers: `PO #: PO-123`, `Purchase Order: ABC-001`
- Customer numbers: `Customer No: CUST-001`, `Cust #: C-123`
- Line items: Tabular data with part numbers, descriptions, quantities, prices
- Suppliers and manufacturers from document headers
- Dates in various formats

## User Roles & Security

### Authentication
- Email magic link authentication via Supabase Auth
- No passwords required - secure, frictionless access

### Authorization
- **Authenticated Users**: Can view all data, search, and export
- **Admin Users**: Full CRUD operations on all entities
- **Row Level Security**: Enforced at database level

### Admin Role Setup
Set admin role in Supabase dashboard:
1. Go to Authentication > Users
2. Select user and edit metadata
3. Add `{"role": "admin"}` to `app_metadata` or `user_metadata`

## Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**:
   ```bash
   npx vercel --prod
   ```

2. **Configure Environment Variables**:
   Add all environment variables from `.env.local` to Vercel dashboard

3. **Deploy**:
   ```bash
   git push origin main
   ```
   Vercel will automatically deploy on push to main branch.

### Environment Variables for Production

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Database Migrations in Production

Migrations are applied automatically when you push to your Supabase project:

```bash
supabase db push
```

## Troubleshooting

### Common Issues

**PDF Processing Not Working**
- Verify Edge function is deployed: `supabase functions deploy pdf_ingest`
- Check function logs in Supabase dashboard
- Ensure storage bucket `incoming-pdfs` exists and is private

**Search Results Empty**
- Verify database has been seeded: `supabase db reset --with-seed`
- Check RLS policies allow read access for authenticated users
- Verify search parameters are correctly formatted

**Authentication Issues** 
- Confirm Supabase URL and keys are correct
- Check that email confirmation is disabled for development
- Verify redirect URLs are configured in Supabase Auth settings

**Build Errors**
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npm run build`
- Verify all required environment variables are set

### Database Reset

To reset the database completely:

```bash
supabase db reset
```

This will drop all tables, run migrations, and apply seed data.

### Logs and Debugging

- **Next.js logs**: Check terminal output during `npm run dev`
- **Supabase logs**: Available in Supabase dashboard under Logs
- **Edge function logs**: In Supabase dashboard under Edge Functions
- **Vercel logs**: Available in Vercel deployment dashboard

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Create Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Add tests for new functionality
- Use meaningful commit messages
- Format code with Prettier: `npm run format`

## License

This project is proprietary software owned by Quantum Technology.

## Support

For technical support or questions about this system:

1. Check this README for common solutions
2. Review the GitHub issues
3. Contact the development team

---

**Built with ❤️ for Quantum Technology**
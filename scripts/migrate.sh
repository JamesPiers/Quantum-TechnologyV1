#!/bin/bash

# MySQL to Supabase Migration - Complete Workflow
# This script walks you through the entire migration process

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║           MySQL to Supabase Migration - Complete Workflow                 ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo ""
    echo "Please create a .env.local file with your credentials."
    echo "You can use .env.migration.example as a template:"
    echo ""
    echo "  cp .env.migration.example .env.local"
    echo ""
    echo "Then edit .env.local and add your Supabase credentials."
    exit 1
fi

echo "✅ Found .env.local file"
echo ""

# Step 2: Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies installed"
echo ""

# Step 3: Test MySQL connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Testing MySQL Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run test:mysql

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ MySQL connection test failed"
    echo "Please fix the connection issues before proceeding."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Run Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will:"
echo "  1. Connect to MySQL and extract data"
echo "  2. Generate SQL migration files"
echo "  3. Attempt to insert data into Supabase (if tables exist)"
echo ""

read -p "Continue with migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
npm run migrate:mysql

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Migration completed with errors"
    echo "Check the output above for details."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Apply SQL to Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 Migration SQL file created: migrations/mysql_to_supabase.sql"
echo ""
echo "Next steps:"
echo "  1. Open: migrations/mysql_to_supabase.sql"
echo "  2. Go to: Supabase Dashboard → SQL Editor"
echo "  3. Copy and paste the SQL content"
echo "  4. Click 'Run' to execute"
echo ""

# Check if the file exists and show a preview
if [ -f "migrations/mysql_to_supabase.sql" ]; then
    echo "📋 SQL file preview (first 20 lines):"
    echo "────────────────────────────────────────────────────────────────────────────"
    head -n 20 migrations/mysql_to_supabase.sql
    echo "────────────────────────────────────────────────────────────────────────────"
    echo ""
    
    # Get file size
    filesize=$(wc -c < "migrations/mysql_to_supabase.sql" | tr -d ' ')
    filesizeKB=$((filesize / 1024))
    echo "File size: ${filesizeKB} KB"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Migration Preparation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For more information, see:"
echo "  • MIGRATION_SETUP.md - Complete setup guide"
echo "  • MIGRATION_QUICKSTART.md - Quick start guide"
echo "  • scripts/README.md - Detailed documentation"
echo ""


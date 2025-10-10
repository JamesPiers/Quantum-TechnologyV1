/**
 * Marketing homepage
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Database, Search, Upload, FileText, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Quantum Technology</span>
            </div>
            <Link href="/dashboard">
              <Button>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Parts & Supplier Management
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your parts inventory, manage suppliers, and process purchase orders 
            with our powerful, secure, and intuitive platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Parts
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From PDF processing to powerful search and reporting, our platform 
              handles the complete parts management lifecycle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Upload className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>PDF Processing</CardTitle>
                <CardDescription>
                  Upload purchase orders and quotes - we automatically extract and structure the data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic text extraction</li>
                  <li>• Smart field mapping</li>
                  <li>• Bulk processing support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Powerful Search</CardTitle>
                <CardDescription>
                  Find parts quickly with advanced filtering by PO, customer, manufacturer, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Multi-field search</li>
                  <li>• Real-time filtering</li>
                  <li>• Export capabilities</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Complete Database</CardTitle>
                <CardDescription>
                  Comprehensive parts database with suppliers, manufacturers, and purchase history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Parts categorization</li>
                  <li>• Supplier management</li>
                  <li>• Purchase tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Rich Reporting</CardTitle>
                <CardDescription>
                  Generate insights with pre-built reports on spending, lead times, and inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Spend analysis</li>
                  <li>• Lead time tracking</li>
                  <li>• Stock reports</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Secure & Compliant</CardTitle>
                <CardDescription>
                  Enterprise-grade security with role-based access and comprehensive audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Role-based access</li>
                  <li>• Audit logging</li>
                  <li>• Data encryption</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Modern Platform</CardTitle>
                <CardDescription>
                  Built with the latest technology for speed, reliability, and seamless user experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time updates</li>
                  <li>• Mobile responsive</li>
                  <li>• Cloud-hosted</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Streamline Your Parts Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join companies who trust Quantum Technology to manage their 
            parts inventory and supplier relationships.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="px-8">
              Start Managing Parts
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-semibold">Quantum Technology</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 Quantum Technology. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

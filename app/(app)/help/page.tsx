/**
 * Help and documentation page
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Mail,
  FileText,
  HelpCircle
} from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="text-gray-500 mt-2">
          Find answers, guides, and get support
        </p>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search for help articles, guides, FAQs..."
            className="pl-11 h-12"
          />
        </div>
      </Card>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-blue-100 rounded-full">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mt-4">Documentation</h3>
            <p className="text-sm text-gray-500 mt-2">
              Browse comprehensive guides and documentation
            </p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-purple-100 rounded-full">
              <Video className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mt-4">Video Tutorials</h3>
            <p className="text-sm text-gray-500 mt-2">
              Watch step-by-step video guides
            </p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-green-100 rounded-full">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mt-4">Community</h3>
            <p className="text-sm text-gray-500 mt-2">
              Connect with other users and share tips
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Getting Started
          </h3>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start text-left">
              Quick Start Guide
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              Upload Your First Parts List
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              Managing Suppliers
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              Creating Purchase Orders
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start text-left">
              How do I import parts data?
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              How do I search for parts?
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              Can I export my data?
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              How do I manage user permissions?
            </Button>
          </div>
        </Card>
      </div>

      {/* Contact Support */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="text-center">
          <Mail className="h-12 w-12 text-blue-600 mx-auto" />
          <h3 className="text-xl font-semibold mt-4">Still need help?</h3>
          <p className="text-gray-600 mt-2">
            Our support team is here to help you with any questions
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Live Chat
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


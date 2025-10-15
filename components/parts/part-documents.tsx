/**
 * Part documents component
 * Shows all documents related to this part, organized by type and date
 */

'use client'

import { PartReadable } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { FileText, Image, File, ExternalLink, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PartDocumentsProps {
  part: PartReadable
}

export function PartDocuments({ part }: PartDocumentsProps) {
  // In a real implementation, you would fetch documents from a database or storage system
  // For now, we'll show the link field if available, and a placeholder for future document management
  
  const documents: Array<{
    id: string
    name: string
    type: 'drawing' | 'datasheet' | 'quote' | 'invoice' | 'other'
    url: string
    uploadedAt: string
    size?: string
  }> = []
  
  // Add the link field as a document if it exists
  if (part.link) {
    documents.push({
      id: 'link-1',
      name: part.link.split('/').pop() || 'Part Link',
      type: 'other',
      url: part.link,
      uploadedAt: part.created_at,
    })
  }
  
  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = []
    }
    acc[doc.type].push(doc)
    return acc
  }, {} as Record<string, typeof documents>)
  
  // Sort documents by date within each type
  Object.keys(documentsByType).forEach(type => {
    documentsByType[type].sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
  })
  
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'drawing':
        return <Image className="h-5 w-5 text-blue-600" />
      case 'datasheet':
      case 'quote':
      case 'invoice':
        return <FileText className="h-5 w-5 text-green-600" />
      default:
        return <File className="h-5 w-5 text-gray-600" />
    }
  }
  
  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }
  
  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">No documents available for this part.</p>
        <p className="text-sm text-gray-400 mb-4">
          Documents such as drawings, datasheets, quotes, and invoices will appear here.
        </p>
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {documents.length} document{documents.length !== 1 ? 's' : ''} available
        </div>
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>
      
      {Object.entries(documentsByType).map(([type, docs]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase">
              {getTypeLabel(type)}
            </h3>
            <Badge variant="secondary">{docs.length}</Badge>
          </div>
          
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getDocumentIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      {doc.size && (
                        <>
                          <span>•</span>
                          <span>{doc.size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


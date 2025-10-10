/**
 * PDF upload component for dashboard
 */

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { supabase } from '@/lib/db'
import { PDFIngestReport } from '@/lib/schemas'

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  result?: PDFIngestReport
  error?: string
}

export function PDFUpload() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  })
  
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }
  
  const uploadFiles = async () => {
    if (files.length === 0) return
    
    setIsUploading(true)
    
    try {
      const filesToUpload = files.filter(f => f.status === 'pending')
      
      for (const fileItem of filesToUpload) {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ))
        
        try {
          // Upload to Supabase Storage
          const fileName = `${Date.now()}-${fileItem.file.name}`
          
          // Update progress to show uploading
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress: 50 }
              : f
          ))
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('incoming-pdfs')
            .upload(fileName, fileItem.file)
          
          if (uploadError) throw uploadError
          
          // Update progress after successful upload
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress: 80 }
              : f
          ))
          
          // Update status to processing
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'processing', progress: 90 }
              : f
          ))
          
          // Call the ingest API
          const response = await fetch('/api/parts/ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePaths: [uploadData.path]
            })
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const result: PDFIngestReport = await response.json()
          
          // Update status to completed
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  progress: 100,
                  result
                }
              : f
          ))
          
        } catch (error) {
          console.error(`Error processing file ${fileItem.file.name}:`, error)
          
          // Update status to error
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { 
                  ...f, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              : f
          ))
        }
      }
    } finally {
      setIsUploading(false)
    }
  }
  
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-gray-400" />
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }
  
  const getStatusBadge = (status: UploadFile['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Pending', className: '' },
      uploading: { variant: 'default' as const, text: 'Uploading', className: '' },
      processing: { variant: 'default' as const, text: 'Processing', className: '' },
      completed: { variant: 'default' as const, text: 'Completed', className: 'bg-green-100 text-green-800' },
      error: { variant: 'destructive' as const, text: 'Error', className: '' }
    }
    
    const config = variants[status]
    return (
      <Badge variant={config.variant} className={config.className || undefined}>
        {config.text}
      </Badge>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        {isDragActive ? (
          <p className="text-blue-600">Drop PDF files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-1">
              Drag & drop PDF files here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: 10MB
            </p>
          </div>
        )}
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Files to Upload</h4>
            <Button 
              onClick={uploadFiles}
              disabled={isUploading || files.every(f => f.status !== 'pending')}
              size="sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload All
                </>
              )}
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileItem) => (
              <div key={fileItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {getStatusIcon(fileItem.status)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileItem.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {(fileItem.status === 'uploading' || fileItem.status === 'processing') && (
                    <Progress value={fileItem.progress} className="mt-1 h-1" />
                  )}
                  
                  {fileItem.status === 'completed' && fileItem.result && (
                    <div className="mt-1 text-xs text-green-600">
                      {fileItem.result.partsInserted} parts added, {fileItem.result.posCreated} POs created
                    </div>
                  )}
                  
                  {fileItem.status === 'error' && fileItem.error && (
                    <div className="mt-1 text-xs text-red-600">
                      {fileItem.error}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(fileItem.status)}
                  
                  {fileItem.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileItem.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Help Text */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Upload purchase orders and quotes as PDF files. The system will automatically 
          extract part information, supplier details, and create structured database entries.
        </AlertDescription>
      </Alert>
    </div>
  )
}

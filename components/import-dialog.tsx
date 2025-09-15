"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, AlertCircle, CheckCircle } from "lucide-react"

interface ImportDialogProps {
  onImport: (file: File) => void
}

export function ImportDialog({ onImport }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        setPreviewData(data)

        // Basic validation
        const errors: string[] = []
        if (!data.name) errors.push("Map name is missing")
        if (!Array.isArray(data.rows)) errors.push("Rows data is invalid")
        
        // Check for required row properties
        data.rows?.forEach((row: any, index: number) => {
          if (!row.id) errors.push(`Row ${index + 1}: Missing ID`)
          if (!row.label) errors.push(`Row ${index + 1}: Missing label`)
          if (typeof row.x !== "number" || typeof row.y !== "number") {
            errors.push(`Row ${index + 1}: Invalid coordinates`)
          }
          if (!Array.isArray(row.seats)) {
            errors.push(`Row ${index + 1}: Invalid seats data`)
          }
        })

        setValidationErrors(errors)
      } catch (error) {
        setValidationErrors(["Invalid JSON format"])
        setPreviewData(null)
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      const jsonFile = files.find((file) => file.type === "application/json" || file.name.endsWith(".json"))

      if (jsonFile) {
        setSelectedFile(jsonFile)
        validateFile(jsonFile)
      }
    },
    [validateFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        validateFile(file)
      }
    },
    [validateFile],
  )

  const handleImport = () => {
    if (selectedFile && validationErrors.length === 0) {
      onImport(selectedFile)
      setIsOpen(false)
      setSelectedFile(null)
      setPreviewData(null)
      setValidationErrors([])
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedFile(null)
    setPreviewData(null)
    setValidationErrors([])
    setDragActive(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Advanced Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Seat Map</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Download className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop your JSON file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">Browse Files</Button>
          </div>

          {/* Validation Results */}
          {selectedFile && (
            <div>
              <Label className="text-sm font-medium mb-2 block">File Validation</Label>
              {validationErrors.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validationErrors.map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>File validation passed successfully!</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Preview */}
          {previewData && validationErrors.length === 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Map Preview</Label>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{previewData.name}</p>
                  {previewData.metadata && (
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">
                          {previewData.metadata.totalRows || previewData.rows?.length || 0} Rows
                        </Badge>
                        <Badge variant="outline">{previewData.metadata.totalSeats || 0} Seats</Badge>
                        {previewData.metadata.version && (
                          <Badge variant="outline">Version {previewData.metadata.version}</Badge>
                        )}
                      </div>
                      {previewData.metadata.features && (
                        <div className="flex gap-2 flex-wrap">
                          {previewData.metadata.features.stage?.enabled && (
                            <Badge variant="secondary">Stage Area</Badge>
                          )}
                          {previewData.metadata.features.rowPositioning && (
                            <Badge variant="secondary">Row Positioning</Badge>
                          )}
                          {previewData.metadata.features.rowRotation && (
                            <Badge variant="secondary">Row Rotation</Badge>
                          )}
                          {previewData.metadata.features.zoomSupport && (
                            <Badge variant="secondary">Zoom Support</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Textarea value={JSON.stringify(previewData, null, 2)} readOnly className="h-32 font-mono text-xs" />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!selectedFile || validationErrors.length > 0}>
              <Download className="w-4 h-4 mr-2" />
              Import Map
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

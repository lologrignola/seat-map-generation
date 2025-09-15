"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SeatMapCanvas } from "./seat-map-canvas"
import { Toolbar } from "./toolbar"
import { ExportDialog } from "./export-dialog"
import { PropertiesPanel } from "./properties-panel"
import { Logo } from "./logo"
import { Footer } from "./footer"
import { Download, RotateCcw, Upload, Trash2, Undo2, Redo2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUndoRedo } from "@/hooks/use-undo-redo"

export interface Seat {
  id: string
  label: string
  x: number
  y: number
  selected: boolean
  type: "regular" | "accessible"
}

export interface Row {
  id: string
  label: string
  seats: Seat[]
  selected: boolean
  x: number
  y: number
  rotation: number // in degrees
  category: "ground-floor" | "balcony" | "wheelchair"
  sectionLabel?: string
  seatSpacing: number // in points
  curve: number // curvature value
  rowLabelEnabled: boolean
  displayedLabel?: string
  displayedType: "row" | "section"
  entrance?: string
}

export interface SeatMap {
  name: string
  rows: Row[]
  metadata?: {
    version: string
    createdAt: string
    updatedAt: string
    totalSeats: number
    totalRows: number
    features?: {
      stage: {
        enabled: boolean
        position: { x: number; y: number }
        size: { width: number; height: number }
      }
      rowPositioning: boolean
      rowRotation: boolean
      zoomSupport: boolean
    }
  }
}

const validateSeatMapSchema = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data || typeof data !== "object") {
    errors.push("Invalid JSON format")
    return { isValid: false, errors }
  }

  if (!data.name || typeof data.name !== "string") {
    errors.push("Map name is required and must be a string")
  }

  if (!Array.isArray(data.rows)) {
    errors.push("Rows must be an array")
    return { isValid: false, errors }
  }

  data.rows.forEach((row: any, rowIndex: number) => {
    if (!row.id || typeof row.id !== "string") {
      errors.push(`Row ${rowIndex + 1}: ID is required and must be a string`)
    }

    if (!row.label || typeof row.label !== "string") {
      errors.push(`Row ${rowIndex + 1}: Label is required and must be a string`)
    }

    if (typeof row.x !== "number" || typeof row.y !== "number") {
      errors.push(`Row ${rowIndex + 1}: X and Y coordinates must be numbers`)
    }

    if (typeof row.rotation !== "number") {
      errors.push(`Row ${rowIndex + 1}: Rotation must be a number`)
    }

    if (typeof row.selected !== "boolean") {
      errors.push(`Row ${rowIndex + 1}: Selected must be a boolean`)
    }

    // Optional properties with defaults - only validate if present
    if (row.category && !["ground-floor", "balcony", "wheelchair"].includes(row.category)) {
      errors.push(`Row ${rowIndex + 1}: Category must be 'ground-floor', 'balcony', or 'wheelchair'`)
    }

    if (row.seatSpacing !== undefined && typeof row.seatSpacing !== "number") {
      errors.push(`Row ${rowIndex + 1}: Seat spacing must be a number`)
    }

    if (row.curve !== undefined && typeof row.curve !== "number") {
      errors.push(`Row ${rowIndex + 1}: Curve must be a number`)
    }

    if (row.rowLabelEnabled !== undefined && typeof row.rowLabelEnabled !== "boolean") {
      errors.push(`Row ${rowIndex + 1}: Row label enabled must be a boolean`)
    }

    if (row.displayedType && !["row", "section"].includes(row.displayedType)) {
      errors.push(`Row ${rowIndex + 1}: Displayed type must be 'row' or 'section'`)
    }

    if (!Array.isArray(row.seats)) {
      errors.push(`Row ${rowIndex + 1}: Seats must be an array`)
      return
    }

    row.seats.forEach((seat: any, seatIndex: number) => {
      if (!seat.id || typeof seat.id !== "string") {
        errors.push(`Row ${rowIndex + 1}, Seat ${seatIndex + 1}: ID is required and must be a string`)
      }

      if (!seat.label || typeof seat.label !== "string") {
        errors.push(`Row ${rowIndex + 1}, Seat ${seatIndex + 1}: Label is required and must be a string`)
      }

      if (typeof seat.x !== "number" || typeof seat.y !== "number") {
        errors.push(`Row ${rowIndex + 1}, Seat ${seatIndex + 1}: X and Y coordinates must be numbers`)
      }

      if (typeof seat.selected !== "boolean") {
        errors.push(`Row ${rowIndex + 1}, Seat ${seatIndex + 1}: Selected must be a boolean`)
      }

      if (seat.type && !["regular", "accessible"].includes(seat.type)) {
        errors.push(`Row ${rowIndex + 1}, Seat ${seatIndex + 1}: Type must be 'regular' or 'accessible'`)
      }
    })
  })

  return { isValid: errors.length === 0, errors }
}

export function SeatMapBuilder() {
  const initialSeatMap: SeatMap = {
    name: "Untitled Map",
    rows: [],
  }

  const {
    undo,
    redo,
    canUndo,
    canRedo,
    setState: setSeatMap,
    setStateGrouped: setSeatMapGrouped,
    endGroup: endUndoGroup,
    clear: clearHistory,
    getCurrentState
  } = useUndoRedo<SeatMap>(initialSeatMap, 50)

  const seatMap = getCurrentState()
  const [selectedTool, setSelectedTool] = useState<"select">("select")
  const { toast } = useToast()

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (canUndo) {
          undo()
          toast({
            title: "Undo",
            description: "Previous action undone",
          })
        }
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault()
        if (canRedo) {
          redo()
          toast({
            title: "Redo",
            description: "Action redone",
          })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo, toast])

  // Load seat map from localStorage on component mount
  useEffect(() => {
    const savedSeatMap = localStorage.getItem('seatMapBuilder_data')
    if (savedSeatMap) {
      try {
        const parsed = JSON.parse(savedSeatMap)
        const validation = validateSeatMapSchema(parsed)
        if (validation.isValid) {
          setSeatMap(parsed)
          clearHistory() // Clear undo history when loading from localStorage
          toast({
            title: "Session restored",
            description: "Your previous work has been loaded",
          })
        } else {
          console.warn('Invalid saved data:', validation.errors)
        }
      } catch (error) {
        console.warn('Failed to parse saved data:', error)
      }
    }
  }, [toast, clearHistory])

  // Save seat map to localStorage whenever it changes
  useEffect(() => {
    if (seatMap.rows.length > 0) {
      localStorage.setItem('seatMapBuilder_data', JSON.stringify(seatMap))
    }
  }, [seatMap])

  const handleNewMap = useCallback(() => {
    const confirmed =
      seatMap.rows.length > 0
        ? confirm("Are you sure you want to create a new map? All current work will be lost.")
        : true

    if (confirmed) {
      setSeatMap({
        name: "Untitled Map",
        rows: [],
      })
      clearHistory() // Clear undo history for new map
      localStorage.removeItem('seatMapBuilder_data')
      toast({
        title: "New map created",
        description: "Started with a fresh seat map",
      })
    }
  }, [seatMap.rows.length, toast, clearHistory])

  const handleExportMap = useCallback(() => {
    const totalSeats = seatMap.rows.reduce((acc, row) => acc + row.seats.length, 0)
    const now = new Date().toISOString()

    const exportData: SeatMap = {
      ...seatMap,
      metadata: {
        version: "1.1",
        createdAt: seatMap.metadata?.createdAt || now,
        updatedAt: now,
        totalSeats,
        totalRows: seatMap.rows.length,
        features: {
          stage: {
            enabled: true,
            position: { x: 0, y: 8 },
            size: { width: 600, height: 120 }
          },
          rowPositioning: true,
          rowRotation: true,
          zoomSupport: true
        }
      },
    }

    // Clear selection states before export
    exportData.rows = exportData.rows.map((row) => ({
      ...row,
      selected: false,
      seats: row.seats.map((seat) => ({ ...seat, selected: false })),
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${seatMap.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Map exported successfully",
      description: `Downloaded ${seatMap.name}.json with ${totalSeats} seats`,
    })
  }, [seatMap, toast])

  const handleImportMap = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)
          const validation = validateSeatMapSchema(importedData)

          if (!validation.isValid) {
            toast({
              title: "Import failed",
              description: `Validation errors: ${validation.errors.join(", ")}`,
              variant: "destructive",
            })
            return
          }

          // Ensure all seats have required properties with defaults
          const processedData: SeatMap = {
            ...importedData,
            rows: importedData.rows.map((row: any) => ({
              ...row,
              selected: false,
              x: row.x || 0,
              y: row.y || 0,
              rotation: row.rotation || 0,
              category: row.category || "ground-floor",
              sectionLabel: row.sectionLabel || "",
              seatSpacing: row.seatSpacing || 4,
              curve: row.curve || 0,
              rowLabelEnabled: row.rowLabelEnabled !== undefined ? row.rowLabelEnabled : true,
              displayedLabel: row.displayedLabel || row.label,
              displayedType: row.displayedType || "row",
              entrance: row.entrance || "",
              seats: row.seats.map((seat: any) => ({
                ...seat,
                selected: false,
                type: seat.type || "regular",
              })),
            })),
          }

          setSeatMap(processedData)

          const totalSeats = processedData.rows.reduce((acc, row) => acc + row.seats.length, 0)
          toast({
            title: "Map imported successfully",
            description: `Loaded ${processedData.name} with ${totalSeats} seats in ${processedData.rows.length} rows`,
          })
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid JSON file format",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    },
    [toast],
  )

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      const updatedRows = seatMap.rows.filter((row) => row.id !== rowId)
      setSeatMap({ ...seatMap, rows: updatedRows })
      toast({
        title: "Row deleted",
        description: "Row and all its seats have been removed",
      })
    },
    [seatMap, toast],
  )

  const handleDeleteSelectedSeats = useCallback(() => {
    const updatedRows = seatMap.rows.map((row) => ({
      ...row,
      seats: row.seats.filter((seat) => !seat.selected),
    })).filter((row) => row.seats.length > 0) // Remove empty rows

    const deletedSeats = seatMap.rows.reduce((acc, row) => acc + row.seats.filter(seat => seat.selected).length, 0)
    
    setSeatMap({ ...seatMap, rows: updatedRows })
    
    if (deletedSeats > 0) {
      toast({
        title: "Seats deleted",
        description: `${deletedSeats} selected seats have been removed`,
      })
    }
  }, [seatMap, toast])

  const handleMapNameChange = useCallback((newName: string) => {
    setSeatMap({ ...seatMap, name: newName })
  }, [seatMap])

  const handleClearSession = useCallback(() => {
    const confirmed = confirm("Are you sure you want to clear the saved session? This will remove all saved data but keep your current work.")
    if (confirmed) {
      localStorage.removeItem('seatMapBuilder_data')
      toast({
        title: "Session cleared",
        description: "Saved data has been removed",
      })
    }
  }, [toast])

  const handleRowUpdate = useCallback((rowId: string, updates: Partial<Row>) => {
    const updatedRows = seatMap.rows.map((row) => 
      row.id === rowId ? { ...row, ...updates } : row
    )
    setSeatMap({ ...seatMap, rows: updatedRows })
  }, [seatMap])

  const handleBulkUpdate = useCallback((rowIds: string[], updates: Partial<Row>) => {
    const updatedRows = seatMap.rows.map((row) => 
      rowIds.includes(row.id) ? { ...row, ...updates } : row
    )
    setSeatMap({ ...seatMap, rows: updatedRows })
  }, [seatMap])

  const handleQuickImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImportMap(file)
      }
    }
    input.click()
  }, [handleImportMap])

  return (
    <div className="h-screen flex flex-col">
      {/* Modern Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-gradient-to-r from-background via-background to-muted/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-6">
            {/* Brand Logo */}
            <Logo size="md" />
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 mr-2">
                <Button 
                  onClick={() => {
                    undo()
                    toast({
                      title: "Undo",
                      description: "Previous action undone",
                    })
                  }}
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-xs font-medium hover:bg-primary/5"
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  onClick={() => {
                    redo()
                    toast({
                      title: "Redo",
                      description: "Action redone",
                    })
                  }}
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-xs font-medium hover:bg-primary/5"
                  disabled={!canRedo}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              
              <Button onClick={handleNewMap} variant="outline" size="sm" className="h-8 px-3 text-xs font-medium hover:bg-primary/5">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                New Map
              </Button>
              <ExportDialog seatMap={seatMap} onExport={handleExportMap} />
              <Button onClick={handleQuickImport} variant="outline" size="sm" className="h-8 px-3 text-xs font-medium hover:bg-primary/5">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Import
              </Button>
              <Button onClick={handleClearSession} variant="outline" size="sm" className="h-8 px-3 text-xs font-medium hover:bg-destructive/5 hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          </div>

          {/* Status Information */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <Input
                  value={seatMap.name}
                  onChange={(e) => handleMapNameChange(e.target.value)}
                  className="h-6 text-sm font-semibold border-none bg-transparent p-0 focus:ring-0 focus:border-none hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                  placeholder="Untitled Map"
                />
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{seatMap.rows.length}</span>
                  <span className="text-xs">rows</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{seatMap.rows.reduce((acc, row) => acc + row.seats.length, 0)}</span>
                  <span className="text-xs">seats</span>
                </span>
              </div>
            </div>
            {seatMap.rows.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-md">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Auto-saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Modern Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-border/50 bg-gradient-to-b from-background to-muted/20 overflow-y-auto">
          <div className="p-6">
            <Toolbar
              selectedTool={selectedTool}
              onToolChange={setSelectedTool}
              seatMap={seatMap}
              onSeatMapChange={setSeatMap}
            />
          </div>
        </div>

        {/* Large Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SeatMapCanvas 
            seatMap={seatMap} 
            onSeatMapChange={setSeatMap}
            onSeatMapChangeGrouped={setSeatMapGrouped}
            onEndUndoGroup={endUndoGroup}
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            onDeleteRow={handleDeleteRow}
            onDeleteSelectedSeats={handleDeleteSelectedSeats}
          />
        </div>

        {/* Properties Panel */}
        <PropertiesPanel 
          selectedRows={seatMap.rows.filter(row => row.selected)}
          onRowUpdate={handleRowUpdate}
          onBulkUpdate={handleBulkUpdate}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

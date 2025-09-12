"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SeatMapCanvas } from "./seat-map-canvas"
import { Toolbar } from "./toolbar"
import { ExportDialog } from "./export-dialog"
import { Download, RotateCcw, Upload, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [seatMap, setSeatMap] = useState<SeatMap>({
    name: "Untitled Map",
    rows: [],
  })

  const [selectedTool, setSelectedTool] = useState<"select">("select")
  const { toast } = useToast()

  // Load seat map from localStorage on component mount
  useEffect(() => {
    const savedSeatMap = localStorage.getItem('seatMapBuilder_data')
    if (savedSeatMap) {
      try {
        const parsed = JSON.parse(savedSeatMap)
        const validation = validateSeatMapSchema(parsed)
        if (validation.isValid) {
          setSeatMap(parsed)
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
  }, [toast])

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
      localStorage.removeItem('seatMapBuilder_data')
      toast({
        title: "New map created",
        description: "Started with a fresh seat map",
      })
    }
  }, [seatMap.rows.length, toast])

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
      {/* Compact Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">SeatMapBuilder</h1>
            <div className="flex items-center gap-2">
              <Button onClick={handleNewMap} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Map
              </Button>
              <ExportDialog seatMap={seatMap} onExport={handleExportMap} />
              <Button onClick={handleQuickImport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Quick Import
              </Button>
              <Button onClick={handleClearSession} variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Session
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="font-medium">{seatMap.name}</span>
              <span>{seatMap.rows.length} rows</span>
              <span>{seatMap.rows.reduce((acc, row) => acc + row.seats.length, 0)} seats</span>
              {seatMap.rows.length > 0 && (
                <span className="text-xs text-green-600">💾 Auto-saved</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Compact Sidebar */}
        <div className="w-80 flex-shrink-0 border-r bg-muted/30 overflow-y-auto">
          <div className="p-4">
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
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            onDeleteRow={handleDeleteRow}
            onDeleteSelectedSeats={handleDeleteSelectedSeats}
          />
        </div>
      </div>
    </div>
  )
}

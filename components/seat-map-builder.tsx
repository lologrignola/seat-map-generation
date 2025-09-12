"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SeatMapCanvas } from "./seat-map-canvas"
import { Toolbar } from "./toolbar"
import { ImportDialog } from "./import-dialog"
import { ExportDialog } from "./export-dialog"
import { Upload, RotateCcw } from "lucide-react"
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

  const [selectedTool, setSelectedTool] = useState<"select" | "add-row" | "add-seat">("select")
  const { toast } = useToast()

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
        version: "1.0",
        createdAt: seatMap.metadata?.createdAt || now,
        updatedAt: now,
        totalSeats,
        totalRows: seatMap.rows.length,
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

  const handleQuickImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleImportMap(file)
      }
      // Reset input
      event.target.value = ""
    },
    [handleImportMap],
  )

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleNewMap} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Map
          </Button>

          <ExportDialog seatMap={seatMap} onExport={handleExportMap} />

          {/* Quick import */}
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleQuickImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Quick Import
            </Button>
          </div>

          <ImportDialog onImport={handleImportMap} />
        </div>

        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Map: {seatMap.name}</span>
            <span>Rows: {seatMap.rows.length}</span>
            <span>Seats: {seatMap.rows.reduce((acc, row) => acc + row.seats.length, 0)}</span>
            {seatMap.metadata?.updatedAt && (
              <span>Updated: {new Date(seatMap.metadata.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        seatMap={seatMap}
        onSeatMapChange={setSeatMap}
      />

      {/* Canvas */}
      <Card className="p-4">
        <SeatMapCanvas seatMap={seatMap} onSeatMapChange={setSeatMap} selectedTool={selectedTool} />
      </Card>
    </div>
  )
}

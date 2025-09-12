"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { SeatMap } from "./seat-map-builder"
import { MousePointer, Plus, Trash2, Tag, Square, SquareCheck } from "lucide-react"
import { useState } from "react"
import { BatchLabelingDialog, type BatchPattern } from "./batch-labeling-dialog"

interface ToolbarProps {
  selectedTool: "select"
  onToolChange: (tool: "select") => void
  seatMap: SeatMap
  onSeatMapChange: (seatMap: SeatMap) => void
}

export function Toolbar({ selectedTool, onToolChange, seatMap, onSeatMapChange }: ToolbarProps) {

  const selectedRows = seatMap.rows.filter((row) => row.selected)

  const [showCreateRowsDialog, setShowCreateRowsDialog] = useState(false)
  const [rowCount, setRowCount] = useState(3)
  const [seatsPerRow, setSeatsPerRow] = useState(8)
  const rowSpacing = 50 // Fixed spacing

  const handleCreateMultipleRows = () => {
    if (rowCount <= 0 || rowCount > 20) {
      alert("Please enter a number between 1 and 20")
      return
    }

    const newRows = []
    const canvasPadding = 176 // Match the canvas padding
    
    for (let i = 0; i < rowCount; i++) {
      const rowNumber = seatMap.rows.length + i + 1
      const rowX = canvasPadding
      const rowY = i * rowSpacing + 50
      
      const newRow = {
        id: `row-${Date.now()}-${i}`,
        label: `Row ${rowNumber}`,
        seats: [],
        selected: false,
        x: rowX,
        y: rowY,
        rotation: 0,
      }

      // Add seats to each row with proper positioning
      for (let j = 0; j < seatsPerRow; j++) {
        newRow.seats.push({
          id: `seat-${Date.now()}-${i}-${j}`,
          label: `${j + 1}`,
          x: rowX + j * 40, // Position relative to row
          y: rowY, // Same Y as row
          selected: false,
          type: "regular" as const,
        })
      }

      newRows.push(newRow)
    }

    onSeatMapChange({
      ...seatMap,
      rows: [...seatMap.rows, ...newRows],
    })
    
    setShowCreateRowsDialog(false)
  }

  const handleSelectAll = () => {
    const updatedRows = seatMap.rows.map((row) => ({
      ...row,
      selected: true,
      seats: row.seats.map((seat) => ({ ...seat, selected: true })),
    }))

    onSeatMapChange({ ...seatMap, rows: updatedRows })
  }

  const handleClearSelection = () => {
    const updatedRows = seatMap.rows.map((row) => ({
      ...row,
      selected: false,
      seats: row.seats.map((seat) => ({ ...seat, selected: false })),
    }))

    onSeatMapChange({ ...seatMap, rows: updatedRows })
  }

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedRows.length} row(s)?`,
    )

    if (!confirmed) return

    const updatedRows = seatMap.rows.filter((row) => !row.selected)

    onSeatMapChange({ ...seatMap, rows: updatedRows })
  }


  const handleApplyPattern = (pattern: BatchPattern) => {
    let counter = 0

    const updatedRows = seatMap.rows.map((row) => {
      // Apply pattern to selected rows
      if (row.selected) {
        let newLabel: string

        if (pattern.type === "sequential") {
          newLabel = `${pattern.prefix}${(pattern.startValue as number) + counter * pattern.increment}${pattern.suffix}`
        } else if (pattern.type === "alphabetic") {
          const startChar = (pattern.startValue as string).charCodeAt(0)
          const char = String.fromCharCode(startChar + counter * pattern.increment)
          newLabel = `${pattern.prefix}${char}${pattern.suffix}`
        } else {
          newLabel = `${pattern.prefix}${counter + 1}${pattern.suffix}`
        }

        counter++
        return { ...row, label: newLabel, selected: false }
      }

      return row
    })

    onSeatMapChange({ ...seatMap, rows: updatedRows })
  }

  return (
    <div className="space-y-4">
      {/* Tools */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Tools</Label>
        <div className="grid grid-cols-2 gap-1">
          <Button
            variant={selectedTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange("select")}
            className={`h-6 text-xs px-2 ${selectedTool === "select" ? "ring-2 ring-primary/20" : ""}`}
          >
            <MousePointer className="w-3 h-3 mr-1" />
            Select
          </Button>
          <Dialog open={showCreateRowsDialog} onOpenChange={setShowCreateRowsDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Rows
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Rows</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="row-count">Number of Rows</Label>
                    <Input
                      id="row-count"
                      type="number"
                      min="1"
                      max="20"
                      value={rowCount}
                      onChange={(e) => setRowCount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seats-per-row">Seats per Row</Label>
                    <Input
                      id="seats-per-row"
                      type="number"
                      min="1"
                      max="50"
                      value={seatsPerRow}
                      onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateRowsDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMultipleRows}>
                    Create {rowCount} Rows
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Click "Add Rows" to create single or multiple rows with seats. Use "Select" to interact with rows.
        </p>
      </div>

      <Separator />

      {/* Quick Actions */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
        <div className="grid grid-cols-2 gap-1">
          <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-6 text-xs px-1">
            <SquareCheck className="w-3 h-3 mr-1" />
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearSelection} className="h-6 text-xs px-1">
            <Square className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <Separator />

      {/* Selection Actions */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Selection ({selectedRows.length} rows)
        </Label>
        <div className="flex gap-1">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedRows.length === 0}
            className="h-6 text-xs px-2 w-full"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete Selected
          </Button>
        </div>
      </div>

      <Separator />

      {/* Row Controls */}
      {selectedRows.length === 1 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Row Controls</Label>
          
          {/* Row Label Editing */}
          <div className="mb-2">
            <Label htmlFor="row-label" className="text-xs">Row Label</Label>
            <div className="flex gap-1">
              <Input
                id="row-label"
                value={selectedRows[0]?.label || ''}
                onChange={(e) => {
                  const updatedRows = seatMap.rows.map(row => 
                    row.id === selectedRows[0].id 
                      ? { ...row, label: e.target.value }
                      : row
                  )
                  onSeatMapChange({ ...seatMap, rows: updatedRows })
                }}
                className="flex-1 h-7 text-xs"
                size="sm"
              />
            </div>
          </div>


          {/* Rotation Controls */}
          <div className="mb-2">
            <Label className="text-xs mb-1 block">Rotation</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0 text-xs"
                onClick={() => {
                  const rowId = selectedRows[0].id
                  const updatedRows = seatMap.rows.map(row => {
                    if (row.id === rowId) {
                      const newRotation = row.rotation + 5
                      
                      // Calculate rotation center (center of all seats)
                      const seatPositions = row.seats.map(seat => ({ x: seat.x, y: seat.y }))
                      const centerX = seatPositions.reduce((sum, pos) => sum + pos.x, 0) / seatPositions.length
                      const centerY = seatPositions.reduce((sum, pos) => sum + pos.y, 0) / seatPositions.length
                      
                      // Convert to radians
                      const angleRad = (5 * Math.PI) / 180
                      const cos = Math.cos(angleRad)
                      const sin = Math.sin(angleRad)
                      
                      // Rotate each seat around the center
                      const updatedSeats = row.seats.map((seat) => {
                        // Translate to origin
                        const relX = seat.x - centerX
                        const relY = seat.y - centerY
                        
                        // Rotate
                        const newRelX = relX * cos - relY * sin
                        const newRelY = relX * sin + relY * cos
                        
                        // Translate back
                        return {
                          ...seat,
                          x: newRelX + centerX,
                          y: newRelY + centerY,
                        }
                      })

                      return {
                        ...row,
                        rotation: newRotation,
                        seats: updatedSeats,
                      }
                    }
                    return row
                  })
                  onSeatMapChange({ ...seatMap, rows: updatedRows })
                }}
                title="Rotate 5° clockwise"
              >
                ↻
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0 text-xs"
                onClick={() => {
                  const rowId = selectedRows[0].id
                  const updatedRows = seatMap.rows.map(row => {
                    if (row.id === rowId) {
                      const newRotation = row.rotation - 5
                      
                      // Calculate rotation center (center of all seats)
                      const seatPositions = row.seats.map(seat => ({ x: seat.x, y: seat.y }))
                      const centerX = seatPositions.reduce((sum, pos) => sum + pos.x, 0) / seatPositions.length
                      const centerY = seatPositions.reduce((sum, pos) => sum + pos.y, 0) / seatPositions.length
                      
                      // Convert to radians
                      const angleRad = (-5 * Math.PI) / 180
                      const cos = Math.cos(angleRad)
                      const sin = Math.sin(angleRad)
                      
                      // Rotate each seat around the center
                      const updatedSeats = row.seats.map((seat) => {
                        // Translate to origin
                        const relX = seat.x - centerX
                        const relY = seat.y - centerY
                        
                        // Rotate
                        const newRelX = relX * cos - relY * sin
                        const newRelY = relX * sin + relY * cos
                        
                        // Translate back
                        return {
                          ...seat,
                          x: newRelX + centerX,
                          y: newRelY + centerY,
                        }
                      })

                      return {
                        ...row,
                        rotation: newRotation,
                        seats: updatedSeats,
                      }
                    }
                    return row
                  })
                  onSeatMapChange({ ...seatMap, rows: updatedRows })
                }}
                title="Rotate 5° counter-clockwise"
              >
                ↺
              </Button>
            </div>
          </div>

          {/* Row Info */}
          <div className="text-xs text-muted-foreground">
            <div>Seats: {selectedRows[0]?.seats.length || 0}</div>
            <div>Rotation: {Math.round(selectedRows[0]?.rotation || 0)}°</div>
          </div>
        </div>
      )}

      <Separator />

      {/* Batch Labeling */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Batch Labeling</Label>

        <div className="flex gap-1">
          <BatchLabelingDialog
            onApplyPattern={handleApplyPattern}
            selectedCount={{ rows: selectedRows.length, seats: 0 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Select rows first, then apply batch labels</p>
      </div>
    </div>
  )
}

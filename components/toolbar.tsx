"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { SeatMap } from "./seat-map-builder"
import { MousePointer, Plus, Trash2, Tag, PlusCircle, Square, SquareCheck } from "lucide-react"
import { useState } from "react"
import { BatchLabelingDialog, type BatchPattern } from "./batch-labeling-dialog"

interface ToolbarProps {
  selectedTool: "select" | "add-row" | "add-seat"
  onToolChange: (tool: "select" | "add-row" | "add-seat") => void
  seatMap: SeatMap
  onSeatMapChange: (seatMap: SeatMap) => void
}

export function Toolbar({ selectedTool, onToolChange, seatMap, onSeatMapChange }: ToolbarProps) {
  const [batchLabel, setBatchLabel] = useState("")
  const [batchStart, setBatchStart] = useState(1)
  const [batchEnd, setBatchEnd] = useState(10)

  const selectedRows = seatMap.rows.filter((row) => row.selected)
  const selectedSeats = seatMap.rows.flatMap((row) =>
    row.seats.filter((seat) => seat.selected).map((seat) => ({ ...seat, rowId: row.id })),
  )

  const handleCreateMultipleRows = () => {
    const count = prompt("How many rows would you like to create?", "3")
    const numRows = Number.parseInt(count || "0")

    if (numRows <= 0 || numRows > 20) {
      alert("Please enter a number between 1 and 20")
      return
    }

    const newRows = []
    for (let i = 0; i < numRows; i++) {
      const rowNumber = seatMap.rows.length + i + 1
      const newRow = {
        id: `row-${Date.now()}-${i}`,
        label: `Row ${rowNumber}`,
        seats: [],
        selected: false,
      }

      // Add default seats to each row
      for (let j = 0; j < 8; j++) {
        newRow.seats.push({
          id: `seat-${Date.now()}-${i}-${j}`,
          label: `${j + 1}`,
          x: j * 35,
          y: i * 50 + 50, // Offset each row vertically
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
    if (selectedRows.length === 0 && selectedSeats.length === 0) return

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedRows.length} row(s) and ${selectedSeats.length} seat(s)?`,
    )

    if (!confirmed) return

    let updatedRows = seatMap.rows.filter((row) => !row.selected)

    // Remove selected seats from remaining rows
    updatedRows = updatedRows.map((row) => ({
      ...row,
      seats: row.seats.filter((seat) => !seat.selected),
    }))

    onSeatMapChange({ ...seatMap, rows: updatedRows })
  }

  const handleBatchLabel = () => {
    if (!batchLabel.trim()) return

    const updatedRows = seatMap.rows.map((row) => {
      if (row.selected) {
        // Label the row itself
        return { ...row, label: batchLabel, selected: false }
      }

      // Label selected seats in this row
      const selectedSeatsInRow = row.seats.filter((seat) => seat.selected)
      if (selectedSeatsInRow.length > 0) {
        const updatedSeats = row.seats.map((seat, index) => {
          if (seat.selected) {
            const seatNumber = batchStart + row.seats.filter((s, i) => i < index && s.selected).length
            return {
              ...seat,
              label: `${batchLabel}${seatNumber}`,
              selected: false,
            }
          }
          return seat
        })
        return { ...row, seats: updatedSeats }
      }

      return row
    })

    onSeatMapChange({ ...seatMap, rows: updatedRows })
    setBatchLabel("")
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

      // Apply pattern to selected seats in this row
      const selectedSeatsInRow = row.seats.filter((seat) => seat.selected)
      if (selectedSeatsInRow.length > 0) {
        let seatCounter = 0
        const updatedSeats = row.seats.map((seat) => {
          if (seat.selected) {
            let newLabel: string

            if (pattern.type === "sequential") {
              newLabel = `${pattern.prefix}${(pattern.startValue as number) + (counter + seatCounter) * pattern.increment}${pattern.suffix}`
            } else if (pattern.type === "alphabetic") {
              const startChar = (pattern.startValue as string).charCodeAt(0)
              const char = String.fromCharCode(startChar + (counter + seatCounter) * pattern.increment)
              newLabel = `${pattern.prefix}${char}${pattern.suffix}`
            } else {
              newLabel = `${pattern.prefix}${counter + seatCounter + 1}${pattern.suffix}`
            }

            seatCounter++
            return { ...seat, label: newLabel, selected: false }
          }
          return seat
        })

        counter += seatCounter
        return { ...row, seats: updatedSeats }
      }

      return row
    })

    onSeatMapChange({ ...seatMap, rows: updatedRows })
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Tools */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Tools</Label>
          <div className="flex gap-2">
            <Button
              variant={selectedTool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("select")}
            >
              <MousePointer className="w-4 h-4 mr-2" />
              Select
            </Button>
            <Button
              variant={selectedTool === "add-row" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("add-row")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
            <Button
              variant={selectedTool === "add-seat" ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange("add-seat")}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Seat
            </Button>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCreateMultipleRows}>
              <Plus className="w-4 h-4 mr-2" />
              Create Multiple Rows
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <SquareCheck className="w-4 h-4 mr-2" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearSelection}>
              <Square className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
          </div>
        </div>

        <Separator />

        {/* Selection Actions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Selection ({selectedRows.length} rows, {selectedSeats.length} seats)
          </Label>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedRows.length === 0 && selectedSeats.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>

        <Separator />

        {/* Batch Labeling */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Batch Labeling</Label>

          <div className="flex gap-2 mb-3">
            <BatchLabelingDialog
              onApplyPattern={handleApplyPattern}
              selectedCount={{ rows: selectedRows.length, seats: selectedSeats.length }}
            />
          </div>

          {/* Simple batch labeling */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="batch-label" className="text-xs">
                Simple Pattern
              </Label>
              <Input
                id="batch-label"
                placeholder="e.g., A, Platea, VIP"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                size="sm"
              />
            </div>
            <div className="w-20">
              <Label htmlFor="batch-start" className="text-xs">
                Start
              </Label>
              <Input
                id="batch-start"
                type="number"
                value={batchStart}
                onChange={(e) => setBatchStart(Number(e.target.value))}
                size="sm"
              />
            </div>
            <div className="w-20">
              <Label htmlFor="batch-end" className="text-xs">
                End
              </Label>
              <Input
                id="batch-end"
                type="number"
                value={batchEnd}
                onChange={(e) => setBatchEnd(Number(e.target.value))}
                size="sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleBatchLabel}
              disabled={!batchLabel.trim() || (selectedRows.length === 0 && selectedSeats.length === 0)}
            >
              <Tag className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Select rows or seats first, then apply batch labels</p>
        </div>
      </div>
    </Card>
  )
}

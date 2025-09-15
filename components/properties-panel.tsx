"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Row } from "./seat-map-builder"
import { ChevronUp, ChevronDown, Settings, Circle } from "lucide-react"

interface PropertiesPanelProps {
  selectedRows: Row[]
  onRowUpdate: (rowId: string, updates: Partial<Row>) => void
  onBulkUpdate: (rowIds: string[], updates: Partial<Row>) => void
}

export function PropertiesPanel({ selectedRows, onRowUpdate, onBulkUpdate }: PropertiesPanelProps) {
  if (selectedRows.length === 0) {
    return (
      <div className="w-80 flex-shrink-0 border-l border-border/50 bg-gradient-to-b from-background to-muted/20 overflow-y-auto">
        <div className="p-6">
          <div className="text-center text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Properties Panel</h3>
            <p className="text-sm">Select a row to view and edit its properties</p>
          </div>
        </div>
      </div>
    )
  }

  const isMultipleSelection = selectedRows.length > 1
  const selectedRow = selectedRows[0] // Use first row for display purposes

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ground-floor":
        return "bg-red-500"
      case "balcony":
        return "bg-green-500"
      case "wheelchair":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "ground-floor":
        return "Ground Floor"
      case "balcony":
        return "Balcony"
      case "wheelchair":
        return "Wheelchair"
      default:
        return "Unknown"
    }
  }

  const handleNumberInput = (field: keyof Row, value: string, min = 0, max = 100) => {
    const numValue = Math.max(min, Math.min(max, parseInt(value) || 0))
    onRowUpdate(selectedRow.id, { [field]: numValue })
  }

  const handleIncrement = (field: keyof Row, currentValue: number, step = 1, min = 0, max = 100) => {
    const newValue = Math.max(min, Math.min(max, currentValue + step))
    onRowUpdate(selectedRow.id, { [field]: newValue })
  }

  const handleDecrement = (field: keyof Row, currentValue: number, step = 1, min = 0, max = 100) => {
    const newValue = Math.max(min, Math.min(max, currentValue - step))
    onRowUpdate(selectedRow.id, { [field]: newValue })
  }

  return (
    <div className="w-80 flex-shrink-0 border-l border-border/50 bg-gradient-to-b from-background to-muted/20 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <h3 className="text-lg font-semibold text-foreground">
              {isMultipleSelection ? `ROWS (${selectedRows.length})` : 'ROW'}
            </h3>
          </div>
          {isMultipleSelection && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
              Multiple rows selected. Changes will apply to all selected rows.
            </div>
          )}
        </div>

        {/* Category */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-red-400 rounded-full"></div>
            <Label className="text-sm font-semibold text-foreground">Category</Label>
          </div>
          <Select
            value={isMultipleSelection ? (selectedRows.every(row => row.category === selectedRows[0].category) ? selectedRows[0].category : "mixed") : selectedRow.category}
            onValueChange={(value: "ground-floor" | "balcony" | "wheelchair") => {
              if (isMultipleSelection) {
                const rowIds = selectedRows.map(row => row.id)
                onBulkUpdate(rowIds, { category: value })
              } else {
                onRowUpdate(selectedRow.id, { category: value })
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isMultipleSelection && !selectedRows.every(row => row.category === selectedRows[0].category) 
                    ? "bg-gray-400" 
                    : getCategoryColor(selectedRow.category)
                }`}></div>
                <SelectValue placeholder={isMultipleSelection && !selectedRows.every(row => row.category === selectedRows[0].category) ? "Mixed categories" : undefined} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ground-floor">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Ground Floor</span>
                </div>
              </SelectItem>
              <SelectItem value="balcony">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Balcony</span>
                </div>
              </SelectItem>
              <SelectItem value="wheelchair">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Wheelchair</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-border/50" />

        {/* Row Properties */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
            <Label className="text-sm font-semibold text-foreground">Row</Label>
          </div>

          {/* Number of seats */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Number of seats</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  if (isMultipleSelection) {
                    const rowIds = selectedRows.map(row => row.id)
                    onBulkUpdate(rowIds, { seats: selectedRows[0].seats.slice(0, Math.max(1, selectedRows[0].seats.length - 1)) })
                  } else {
                    const newSeats = selectedRow.seats.slice(0, Math.max(1, selectedRow.seats.length - 1))
                    onRowUpdate(selectedRow.id, { seats: newSeats })
                  }
                }}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
              <Input
                value={selectedRow.seats.length}
                onChange={(e) => {
                  const newCount = Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                  if (isMultipleSelection) {
                    const rowIds = selectedRows.map(row => row.id)
                    onBulkUpdate(rowIds, { seats: Array.from({ length: newCount }, (_, i) => ({
                      id: `seat-${Date.now()}-${i}`,
                      label: `${i + 1}`,
                      x: selectedRows[0].x + i * 40,
                      y: selectedRows[0].y,
                      selected: false,
                      type: "regular" as const,
                    })) })
                  } else {
                    const newSeats = Array.from({ length: newCount }, (_, i) => ({
                      id: selectedRow.seats[i]?.id || `seat-${Date.now()}-${i}`,
                      label: `${i + 1}`,
                      x: selectedRow.x + i * 40,
                      y: selectedRow.y,
                      selected: false,
                      type: selectedRow.seats[i]?.type || "regular" as const,
                    }))
                    onRowUpdate(selectedRow.id, { seats: newSeats })
                  }
                }}
                className="h-6 text-xs text-center"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  if (isMultipleSelection) {
                    const rowIds = selectedRows.map(row => row.id)
                    const newSeats = [...selectedRows[0].seats, {
                      id: `seat-${Date.now()}-${selectedRows[0].seats.length}`,
                      label: `${selectedRows[0].seats.length + 1}`,
                      x: selectedRows[0].x + selectedRows[0].seats.length * 40,
                      y: selectedRows[0].y,
                      selected: false,
                      type: "regular" as const,
                    }]
                    onBulkUpdate(rowIds, { seats: newSeats })
                  } else {
                    const newSeat = {
                      id: `seat-${Date.now()}-${selectedRow.seats.length}`,
                      label: `${selectedRow.seats.length + 1}`,
                      x: selectedRow.x + selectedRow.seats.length * 40,
                      y: selectedRow.y,
                      selected: false,
                      type: "regular" as const,
                    }
                    onRowUpdate(selectedRow.id, { seats: [...selectedRow.seats, newSeat] })
                  }
                }}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
            </div>
          </div>

        </div>

        <Separator className="bg-border/50" />


        {/* Row Labeling */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full"></div>
            <Label className="text-sm font-semibold text-foreground">Row labeling</Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedRow.rowLabelEnabled}
                onChange={(e) => onRowUpdate(selectedRow.id, { rowLabelEnabled: e.target.checked })}
                className="rounded border-border"
              />
              <Label className="text-xs font-medium text-muted-foreground">Enabled</Label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Label</Label>
              <Input
                value={selectedRow.label}
                onChange={(e) => onRowUpdate(selectedRow.id, { label: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Seat Labeling */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
            <Label className="text-sm font-semibold text-foreground">Seat labeling</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Label type</Label>
            <Select 
              defaultValue="numbers"
              onValueChange={(value) => {
                if (isMultipleSelection) {
                  const rowIds = selectedRows.map(row => row.id)
                  const updatedRows = selectedRows.map(row => ({
                    ...row,
                    seats: row.seats.map((seat, index) => ({
                      ...seat,
                      label: value === "numbers" ? `${index + 1}` : 
                             value === "letters" ? String.fromCharCode(65 + index) :
                             value === "custom" ? seat.label : seat.label
                    }))
                  }))
                  onBulkUpdate(rowIds, { seats: updatedRows[0].seats })
                } else {
                  const updatedSeats = selectedRow.seats.map((seat, index) => ({
                    ...seat,
                    label: value === "numbers" ? `${index + 1}` : 
                           value === "letters" ? String.fromCharCode(65 + index) :
                           value === "custom" ? seat.label : seat.label
                  }))
                  onRowUpdate(selectedRow.id, { seats: updatedSeats })
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numbers">Numbers (1, 2, 3...)</SelectItem>
                <SelectItem value="letters">Letters (A, B, C...)</SelectItem>
                <SelectItem value="custom">Custom (keep current)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Seat count</Label>
            <div className="text-xs text-muted-foreground">
              {selectedRow.seats.length} seats in this row
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Miscellaneous */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-gray-500 to-gray-400 rounded-full"></div>
            <Label className="text-sm font-semibold text-foreground">Miscellaneous</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Entrance</Label>
            <Input
              value={selectedRow.entrance || ''}
              onChange={(e) => onRowUpdate(selectedRow.id, { entrance: e.target.value })}
              className="h-8 text-xs"
              placeholder="Enter entrance"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

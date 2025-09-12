"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import type { SeatMap, Row, Seat } from "./seat-map-builder"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Check, X } from "lucide-react"

interface SeatMapCanvasProps {
  seatMap: SeatMap
  onSeatMapChange: (seatMap: SeatMap) => void
  selectedTool: "select" | "add-row" | "add-seat"
}

export function SeatMapCanvas({ seatMap, onSeatMapChange, selectedTool }: SeatMapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editingRowLabel, setEditingRowLabel] = useState("")
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null)
  const [editingSeatLabel, setEditingSeatLabel] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null)

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      if (selectedTool === "add-row") {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const newRow: Row = {
          id: `row-${Date.now()}`,
          label: `Row ${seatMap.rows.length + 1}`,
          seats: [],
          selected: false,
        }

        // Add a few default seats to the new row
        for (let i = 0; i < 8; i++) {
          newRow.seats.push({
            id: `seat-${Date.now()}-${i}`,
            label: `${i + 1}`,
            x: x + i * 35,
            y: y,
            selected: false,
            type: "regular",
          })
        }

        onSeatMapChange({
          ...seatMap,
          rows: [...seatMap.rows, newRow],
        })
      }
    },
    [selectedTool, seatMap, onSeatMapChange],
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (selectedTool !== "select") return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setIsDragging(true)
      setDragStart({ x, y })
      setDragEnd({ x, y })
    },
    [selectedTool],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging || !dragStart) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setDragEnd({ x, y })
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    // Calculate selection rectangle
    const minX = Math.min(dragStart.x, dragEnd.x)
    const maxX = Math.max(dragStart.x, dragEnd.x)
    const minY = Math.min(dragStart.y, dragEnd.y)
    const maxY = Math.max(dragStart.y, dragEnd.y)

    // Select seats within the rectangle
    const updatedRows = seatMap.rows.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => {
        const seatInSelection = seat.x >= minX - 16 && seat.x <= maxX + 16 && seat.y >= minY - 16 && seat.y <= maxY + 16
        return { ...seat, selected: seatInSelection }
      }),
    }))

    onSeatMapChange({ ...seatMap, rows: updatedRows })

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, dragEnd, seatMap, onSeatMapChange])

  const handleAddSeatToRow = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      if (selectedTool !== "add-seat") return

      const updatedRows = seatMap.rows.map((row) => {
        if (row.id === rowId) {
          const lastSeat = row.seats[row.seats.length - 1]
          const newX = lastSeat ? lastSeat.x + 35 : 0
          const newY = lastSeat ? lastSeat.y : 0

          const newSeat: Seat = {
            id: `seat-${Date.now()}`,
            label: `${row.seats.length + 1}`,
            x: newX,
            y: newY,
            selected: false,
            type: "regular",
          }

          return {
            ...row,
            seats: [...row.seats, newSeat],
          }
        }
        return row
      })

      onSeatMapChange({ ...seatMap, rows: updatedRows })
    },
    [selectedTool, seatMap, onSeatMapChange],
  )

  const handleSeatClick = useCallback(
    (rowId: string, seatId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      if (selectedTool === "select") {
        const isMultiSelect = event.ctrlKey || event.metaKey

        const updatedRows = seatMap.rows.map((row) => {
          if (row.id === rowId) {
            return {
              ...row,
              seats: row.seats.map((seat) => {
                if (seat.id === seatId) {
                  return { ...seat, selected: !seat.selected }
                }
                // If not multi-select, deselect other seats
                return isMultiSelect ? seat : { ...seat, selected: false }
              }),
            }
          }
          // If not multi-select, deselect seats in other rows
          return isMultiSelect
            ? row
            : {
                ...row,
                seats: row.seats.map((seat) => ({ ...seat, selected: false })),
              }
        })

        onSeatMapChange({ ...seatMap, rows: updatedRows })
      }
    },
    [selectedTool, seatMap, onSeatMapChange],
  )

  const handleRowClick = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      if (selectedTool === "select") {
        const isMultiSelect = event.ctrlKey || event.metaKey

        const updatedRows = seatMap.rows.map((row) => {
          if (row.id === rowId) {
            return { ...row, selected: !row.selected }
          }
          // If not multi-select, deselect other rows
          return isMultiSelect ? row : { ...row, selected: false }
        })

        onSeatMapChange({ ...seatMap, rows: updatedRows })
      }
    },
    [selectedTool, seatMap, onSeatMapChange],
  )

  const selectAllSeatsInRow = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      const updatedRows = seatMap.rows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            seats: row.seats.map((seat) => ({ ...seat, selected: true })),
          }
        }
        return row
      })

      onSeatMapChange({ ...seatMap, rows: updatedRows })
    },
    [seatMap, onSeatMapChange],
  )

  const startEditingRow = useCallback((rowId: string, currentLabel: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingRowId(rowId)
    setEditingRowLabel(currentLabel)
  }, [])

  const saveRowLabel = useCallback(() => {
    if (!editingRowId) return

    const updatedRows = seatMap.rows.map((row) => (row.id === editingRowId ? { ...row, label: editingRowLabel } : row))

    onSeatMapChange({ ...seatMap, rows: updatedRows })
    setEditingRowId(null)
    setEditingRowLabel("")
  }, [editingRowId, editingRowLabel, seatMap, onSeatMapChange])

  const cancelRowEdit = useCallback(() => {
    setEditingRowId(null)
    setEditingRowLabel("")
  }, [])

  const startEditingSeat = useCallback((seatId: string, currentLabel: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingSeatId(seatId)
    setEditingSeatLabel(currentLabel)
  }, [])

  const saveSeatLabel = useCallback(() => {
    if (!editingSeatId) return

    const updatedRows = seatMap.rows.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => (seat.id === editingSeatId ? { ...seat, label: editingSeatLabel } : seat)),
    }))

    onSeatMapChange({ ...seatMap, rows: updatedRows })
    setEditingSeatId(null)
    setEditingSeatLabel("")
  }, [editingSeatId, editingSeatLabel, seatMap, onSeatMapChange])

  const cancelSeatEdit = useCallback(() => {
    setEditingSeatId(null)
    setEditingSeatLabel("")
  }, [])

  const toggleSeatType = useCallback(
    (rowId: string, seatId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      const updatedRows = seatMap.rows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            seats: row.seats.map((seat) =>
              seat.id === seatId ? { ...seat, type: seat.type === "regular" ? "accessible" : "regular" } : seat,
            ),
          }
        }
        return row
      })

      onSeatMapChange({ ...seatMap, rows: updatedRows })
    },
    [seatMap, onSeatMapChange],
  )

  return (
    <div className="relative">
      {/* Stage indicator */}
      <div className="text-center mb-8">
        <div className="inline-block bg-muted px-8 py-2 rounded-lg text-muted-foreground font-medium">STAGE</div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "relative min-h-[400px] bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20",
          selectedTool === "add-row" && "cursor-crosshair",
          selectedTool === "select" && "cursor-default",
        )}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isDragging && dragStart && dragEnd && (
          <div
            className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
            style={{
              left: Math.min(dragStart.x, dragEnd.x),
              top: Math.min(dragStart.y, dragEnd.y),
              width: Math.abs(dragEnd.x - dragStart.x),
              height: Math.abs(dragEnd.y - dragStart.y),
            }}
          />
        )}

        {seatMap.rows.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">No rows created yet</p>
              <p className="text-sm">Select "Add Row" tool and click to create your first row</p>
            </div>
          </div>
        )}

        {seatMap.rows.map((row) => (
          <div key={row.id} className="absolute">
            {/* Row label with inline editing */}
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {editingRowId === row.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingRowLabel}
                    onChange={(e) => setEditingRowLabel(e.target.value)}
                    className="w-16 h-6 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRowLabel()
                      if (e.key === "Escape") cancelRowEdit()
                    }}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveRowLabel}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelRowEdit}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded cursor-pointer flex items-center gap-1",
                      row.selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                    onClick={(e) => handleRowClick(row.id, e)}
                  >
                    {row.label}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                      onClick={(e) => startEditingRow(row.id, row.label, e)}
                    >
                      <Edit2 className="w-2 h-2" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 text-xs px-1 bg-transparent"
                    onClick={(e) => selectAllSeatsInRow(row.id, e)}
                  >
                    Select All
                  </Button>
                </div>
              )}

              {/* Add seat button for this row */}
              {selectedTool === "add-seat" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-transparent"
                  onClick={(e) => handleAddSeatToRow(row.id, e)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Seats */}
            <div className="flex gap-1">
              {row.seats.map((seat) => (
                <div
                  key={seat.id}
                  className="relative"
                  style={{
                    position: "absolute",
                    left: seat.x,
                    top: seat.y,
                  }}
                >
                  {editingSeatId === seat.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingSeatLabel}
                        onChange={(e) => setEditingSeatLabel(e.target.value)}
                        className="w-12 h-6 text-xs text-center"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveSeatLabel()
                          if (e.key === "Escape") cancelSeatEdit()
                        }}
                        autoFocus
                      />
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" className="h-3 w-3 p-0" onClick={saveSeatLabel}>
                          <Check className="w-2 h-2" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-3 w-3 p-0" onClick={cancelSeatEdit}>
                          <X className="w-2 h-2" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors group relative",
                        seat.selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : seat.type === "accessible"
                            ? "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
                            : "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
                      )}
                      onClick={(e) => handleSeatClick(row.id, seat.id, e)}
                      onDoubleClick={(e) => startEditingSeat(seat.id, seat.label, e)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        toggleSeatType(row.id, seat.id, e)
                      }}
                    >
                      {seat.label}

                      {/* Seat type indicator */}
                      {seat.type === "accessible" && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px]">♿</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-muted-foreground space-y-1">
        <p>
          <strong>Selection:</strong>
          {selectedTool === "select" &&
            " Click to select • Ctrl/Cmd+Click for multi-select • Drag to select area • Use 'Select All' for entire rows"}
          {selectedTool === "add-row" && " Click anywhere on the canvas to add a new row"}
          {selectedTool === "add-seat" && " Click the + button next to row labels to add seats"}
        </p>
        <p>
          <strong>Editing:</strong> Double-click labels to edit • Right-click seats to toggle accessible type • Click
          edit icons for quick access
        </p>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import type { SeatMap, Row, Seat } from "./seat-map-builder"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Check, X, Trash2, Minus, RotateCcw } from "lucide-react"

interface SeatMapCanvasProps {
  seatMap: SeatMap
  onSeatMapChange: (seatMap: SeatMap) => void
  selectedTool: "select"
  onToolChange: (tool: "select") => void
  onDeleteRow: (rowId: string) => void
  onDeleteSelectedSeats: () => void
}

export function SeatMapCanvas({ seatMap, onSeatMapChange, selectedTool, onToolChange, onDeleteRow, onDeleteSelectedSeats }: SeatMapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editingRowLabel, setEditingRowLabel] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null)
  
  // Row movement and rotation state
  const [isMovingRow, setIsMovingRow] = useState(false)
  const [movingRowId, setMovingRowId] = useState<string | null>(null)
  const [moveStart, setMoveStart] = useState<{ x: number; y: number } | null>(null)
  const [isRotatingRow, setIsRotatingRow] = useState(false)
  const [rotatingRowId, setRotatingRowId] = useState<string | null>(null)
  
  // Track if row was dragged (to prevent selection on drag)
  const [rowDragStart, setRowDragStart] = useState<{ x: number; y: number; rowId: string } | null>(null)
  
  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)

  // Zoom control functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3)) // Max zoom 3x
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3)) // Min zoom 0.3x
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }, [])

  // Pan functionality
  const handlePanStart = useCallback((event: React.MouseEvent) => {
    if (event.button === 1 || (event.button === 0 && event.ctrlKey)) { // Middle mouse or Ctrl+Left click
      event.preventDefault()
      setIsPanning(true)
      setPanStart({ x: event.clientX, y: event.clientY })
    }
  }, [])

  const handlePanMove = useCallback((event: React.MouseEvent) => {
    if (!isPanning || !panStart) return

    const deltaX = event.clientX - panStart.x
    const deltaY = event.clientY - panStart.y

    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))

    setPanStart({ x: event.clientX, y: event.clientY })
  }, [isPanning, panStart])

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
    setPanStart(null)
  }, [])

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel(prev => Math.max(0.3, Math.min(3, prev * delta)))
  }, [])

  // Keyboard shortcuts for zoom
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '=':
        case '+':
          event.preventDefault()
          handleZoomIn()
          break
        case '-':
          event.preventDefault()
          handleZoomOut()
          break
        case '0':
          event.preventDefault()
          handleResetZoom()
          break
      }
    }
  }, [handleZoomIn, handleZoomOut, handleResetZoom])

  // Helper function to convert mouse coordinates to zoom-adjusted coordinates
  const getZoomAdjustedCoords = useCallback((event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }

    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top

    // First apply zoom, then subtract pan offset (matching CSS transform order)
    const x = rawX / zoomLevel - panOffset.x
    const y = rawY / zoomLevel - panOffset.y

    return { x, y }
  }, [zoomLevel, panOffset])



  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      // Handle panning first
      if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
        handlePanStart(event)
        return
      }

      // Handle selection only if not panning and select tool is active
      if (selectedTool !== "select" || isPanning) return

      const { x, y } = getZoomAdjustedCoords(event)

      setIsDragging(true)
      setDragStart({ x, y })
      setDragEnd({ x, y })
    },
    [selectedTool, getZoomAdjustedCoords, isPanning, handlePanStart],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      // Handle panning
      if (isPanning) {
        handlePanMove(event)
        return
      }

      // Handle selection dragging
      if (!isDragging || !dragStart) return

      const { x, y } = getZoomAdjustedCoords(event)

      setDragEnd({ x, y })
    },
    [isDragging, dragStart, getZoomAdjustedCoords, isPanning, handlePanMove],
  )

  const handleMouseUp = useCallback(() => {
    // Handle panning end
    if (isPanning) {
      handlePanEnd()
      return
    }

    // Handle selection end
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

    // Select rows that have any seats within the rectangle
    const updatedRows = seatMap.rows.map((row) => {
      const hasSeatInSelection = row.seats.some((seat) => {
        // Calculate seat's actual position on canvas (accounting for row position and rotation)
        const seatCanvasX = row.x + (seat.x - row.x) * Math.cos(row.rotation * Math.PI / 180) - (seat.y - row.y) * Math.sin(row.rotation * Math.PI / 180)
        const seatCanvasY = row.y + (seat.x - row.x) * Math.sin(row.rotation * Math.PI / 180) + (seat.y - row.y) * Math.cos(row.rotation * Math.PI / 180)
        
        return seatCanvasX >= minX - 16 && seatCanvasX <= maxX + 16 && seatCanvasY >= minY - 16 && seatCanvasY <= maxY + 16
      })
      
      return {
        ...row,
        selected: hasSeatInSelection,
        // Clear all seat selections when selecting rows
        seats: row.seats.map((seat) => ({ ...seat, selected: false }))
      }
    })

    onSeatMapChange({ ...seatMap, rows: updatedRows })

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, dragEnd, seatMap, onSeatMapChange, isPanning, handlePanEnd])



  const handleSeatClick = useCallback(
    (rowId: string, seatId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      if (selectedTool === "select") {
        const isMultiSelect = event.ctrlKey || event.metaKey

        // Select the entire row instead of individual seat
        const updatedRows = seatMap.rows.map((row) => {
          if (row.id === rowId) {
            return {
              ...row,
              selected: !row.selected,
              // Clear all seat selections when selecting row
              seats: row.seats.map((seat) => ({ ...seat, selected: false }))
            }
          }
          // If not multi-select, deselect other rows
          return isMultiSelect
            ? row
            : { ...row, selected: false }
        })

        onSeatMapChange({ ...seatMap, rows: updatedRows })
      }
    },
    [selectedTool, seatMap, onSeatMapChange],
  )

  const handleRowClick = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      // Don't select if this was a drag operation
      if (rowDragStart && rowDragStart.rowId === rowId) {
        const { x: currentX, y: currentY } = getZoomAdjustedCoords(event)
        const dragDistance = Math.sqrt(
          Math.pow(currentX - rowDragStart.x, 2) + Math.pow(currentY - rowDragStart.y, 2)
        )
        
        // If dragged more than 5 pixels, don't select
        if (dragDistance > 5) {
          setRowDragStart(null)
          return
        }
      }

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
      
      setRowDragStart(null)
    },
    [selectedTool, seatMap, onSeatMapChange, rowDragStart, getZoomAdjustedCoords],
  )

  // Row movement handlers
  const handleRowMouseDown = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      event.stopPropagation()
      
      if (selectedTool === "select") {
        const { x, y } = getZoomAdjustedCoords(event)

        // Record the starting position for drag detection
        setRowDragStart({ x, y, rowId })
        setIsMovingRow(true)
        setMovingRowId(rowId)
        setMoveStart({ x, y })
      }
    },
    [selectedTool, getZoomAdjustedCoords],
  )

  const handleRowMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isMovingRow || !movingRowId || !moveStart) return

      const { x, y } = getZoomAdjustedCoords(event)

      const deltaX = x - moveStart.x
      const deltaY = y - moveStart.y

      // Get all selected rows (including the one being dragged)
      const selectedRows = seatMap.rows.filter(row => row.selected || row.id === movingRowId)
      const selectedRowIds = new Set(selectedRows.map(row => row.id))

      const updatedRows = seatMap.rows.map((row) => {
        if (selectedRowIds.has(row.id)) {
          const newX = row.x + deltaX
          const newY = row.y + deltaY
          
          // Update row position and all seat positions
          const updatedSeats = row.seats.map((seat) => ({
            ...seat,
            x: seat.x + deltaX,
            y: seat.y + deltaY,
          }))

          return {
            ...row,
            x: newX,
            y: newY,
            seats: updatedSeats,
          }
        }
        return row
      })

      onSeatMapChange({ ...seatMap, rows: updatedRows })
      setMoveStart({ x, y })
    },
    [isMovingRow, movingRowId, moveStart, seatMap, onSeatMapChange, getZoomAdjustedCoords],
  )

  const handleRowMouseUp = useCallback(() => {
    setIsMovingRow(false)
    setMovingRowId(null)
    setMoveStart(null)
    // Don't clear rowDragStart here - let handleRowClick handle it
  }, [])

  // Row rotation handlers
  const handleRowRotation = useCallback(
    (rowId: string, deltaAngle: number) => {
      const updatedRows = seatMap.rows.map((row) => {
        if (row.id === rowId) {
          const newRotation = row.rotation + deltaAngle
          
          // Calculate rotation center (center of all seats)
          const seatPositions = row.seats.map(seat => ({ x: seat.x, y: seat.y }))
          const centerX = seatPositions.reduce((sum, pos) => sum + pos.x, 0) / seatPositions.length
          const centerY = seatPositions.reduce((sum, pos) => sum + pos.y, 0) / seatPositions.length
          
          // Convert to radians
          const angleRad = (deltaAngle * Math.PI) / 180
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
    },
    [seatMap, onSeatMapChange],
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
    <div className="h-full flex flex-col">

      {/* Large Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetZoom}
            className="h-8 w-8 p-0"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <div className="text-xs text-center text-muted-foreground mt-1">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
        <div
          ref={canvasRef}
          className={cn(
            "absolute inset-0 bg-muted/20",
            isPanning ? "cursor-grabbing" : "cursor-default"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            handleMouseMove(e)
            handleRowMouseMove(e)
          }}
          onMouseUp={(e) => {
            handleMouseUp()
            handleRowMouseUp()
          }}
          onMouseLeave={(e) => {
            handleMouseUp()
            handleRowMouseUp()
          }}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
        {/* Zoom Container */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left'
          }}
        >
        {/* Fixed Stage Area */}
        <div 
          className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-b from-amber-100 to-amber-200 border-2 border-amber-400 rounded-lg shadow-lg pointer-events-none"
          style={{
            width: '600px',
            height: '120px',
            zIndex: 1
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-800">STAGE</div>
              <div className="text-sm text-amber-600">Performance Area</div>
            </div>
          </div>
        </div>

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
              <p className="text-sm">Click "Add Rows" button in the toolbar to create your first row</p>
            </div>
          </div>
        )}


        {seatMap.rows.map((row) => (
          <div 
            key={row.id} 
            className="absolute"
            style={{
              left: row.x,
              top: row.y,
              transform: `rotate(${row.rotation}deg)`,
              transformOrigin: 'left center'
            }}
          >
            {/* Row selection box - appears when row is selected */}
            {row.selected && (
              <div 
                className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                style={{
                  left: -10,
                  top: -10,
                  right: -10,
                  bottom: -10,
                  borderRadius: '8px'
                }}
              />
            )}

            {/* Row clickable area */}
            <div
              className={cn(
                "absolute cursor-pointer",
                selectedTool === "select" && "cursor-move"
              )}
              style={{
                left: -10,
                top: -10,
                right: -10,
                bottom: -10,
                zIndex: 1
              }}
              onClick={(e) => handleRowClick(row.id, e)}
              onMouseDown={(e) => handleRowMouseDown(row.id, e)}
            />

            {/* Seats */}
            <div className="flex gap-1">
              {row.seats.map((seat) => (
                <div
                  key={seat.id}
                  className="relative"
                  style={{
                    position: "absolute",
                    left: seat.x - row.x,
                    top: seat.y - row.y,
                  }}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors group relative",
                      seat.type === "accessible"
                        ? "bg-blue-100 border-blue-300 hover:bg-blue-200"
                        : "bg-green-100 border-green-300 hover:bg-green-200",
                    )}
                    onClick={(e) => handleSeatClick(row.id, seat.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      toggleSeatType(row.id, seat.id, e)
                    }}
                    title={`${row.label}, Seat ${seat.label}`}
                  >
                    {/* Seat type indicator */}
                    {seat.type === "accessible" && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px]">♿</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
        {/* End Zoom Container */}
        </div>
      </div>

      {/* Compact Instructions Bar */}
      <div className="flex-shrink-0 border-t border-border/50 bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Quick Help:</span>
            Click any seat to select entire row • Drag to select multiple rows • Drag selected rows to move • Use "Add Rows" button to create new rows
            <span className="ml-4">• Ctrl+Drag or Middle mouse to pan • Mouse wheel to zoom • Use toolbar for row controls and batch labeling</span>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Upload } from "lucide-react"
import type { SeatMap } from "./seat-map-builder"

interface ExportDialogProps {
  seatMap: SeatMap
  onExport: () => void
}

export function ExportDialog({ seatMap, onExport }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportName, setExportName] = useState(seatMap.name)
  const [description, setDescription] = useState("")

  // Update export name when seat map name changes
  useEffect(() => {
    setExportName(seatMap.name)
  }, [seatMap.name])

  const totalSeats = seatMap.rows.reduce((acc, row) => acc + row.seats.length, 0)
  const accessibleSeats = seatMap.rows.reduce(
    (acc, row) => acc + row.seats.filter((seat) => seat.type === "accessible").length,
    0,
  )

  const handleExport = () => {
    // Update the seat map name if changed
    if (exportName !== seatMap.name) {
      seatMap.name = exportName
    }
    onExport()
    setIsOpen(false)
  }

  const previewData = {
    name: exportName,
    description,
    metadata: {
      version: "1.1",
      createdAt: seatMap.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSeats,
      totalRows: seatMap.rows.length,
      accessibleSeats,
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
    rows: seatMap.rows.slice(0, 2).map((row) => ({
      id: row.id,
      label: row.label,
      x: row.x,
      y: row.y,
      rotation: row.rotation,
      category: row.category,
      sectionLabel: row.sectionLabel,
      seatSpacing: row.seatSpacing,
      curve: row.curve,
      rowLabelEnabled: row.rowLabelEnabled,
      displayedLabel: row.displayedLabel,
      displayedType: row.displayedType,
      entrance: row.entrance,
      seats: row.seats.slice(0, 3).map((seat) => ({
        id: seat.id,
        label: seat.label,
        x: seat.x,
        y: seat.y,
        type: seat.type,
      })),
    })),
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Export JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Seat Map</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Map Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="export-name">Map Name</Label>
              <Input
                id="export-name"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                placeholder="Enter map name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>

          {/* Statistics */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Map Statistics</Label>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{seatMap.rows.length} Rows</Badge>
                <Badge variant="outline">{totalSeats} Total Seats</Badge>
                <Badge variant="outline">{accessibleSeats} Accessible Seats</Badge>
                <Badge variant="outline">{totalSeats - accessibleSeats} Regular Seats</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Stage Area</Badge>
                <Badge variant="secondary">Row Positioning</Badge>
                <Badge variant="secondary">Row Rotation</Badge>
                <Badge variant="secondary">Zoom Support</Badge>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-sm font-medium mb-2 block">JSON Preview</Label>
            <Textarea value={JSON.stringify(previewData, null, 2)} readOnly className="h-40 font-mono text-xs" />
            <p className="text-xs text-muted-foreground mt-1">
              This is a preview. The full export will include all rows and seats.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={!exportName.trim()}>
              <Upload className="w-4 h-4 mr-2" />
              Export Map
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

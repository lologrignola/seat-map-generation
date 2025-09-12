"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Wand2 } from "lucide-react"

interface BatchLabelingDialogProps {
  onApplyPattern: (pattern: BatchPattern) => void
  selectedCount: { rows: number; seats: number }
}

export interface BatchPattern {
  type: "sequential" | "alphabetic" | "custom"
  prefix: string
  suffix: string
  startValue: number | string
  increment: number
  direction: "horizontal" | "vertical"
  template?: string
}

const PRESET_PATTERNS = [
  {
    name: "Theater Rows (A-Z)",
    pattern: {
      type: "alphabetic",
      prefix: "",
      suffix: "",
      startValue: "A",
      increment: 1,
      direction: "vertical",
    } as BatchPattern,
  },
  {
    name: "Seat Numbers (1-N)",
    pattern: {
      type: "sequential",
      prefix: "",
      suffix: "",
      startValue: 1,
      increment: 1,
      direction: "horizontal",
    } as BatchPattern,
  },
  {
    name: "VIP Section",
    pattern: {
      type: "sequential",
      prefix: "VIP",
      suffix: "",
      startValue: 1,
      increment: 1,
      direction: "horizontal",
    } as BatchPattern,
  },
  {
    name: "Platea (Spanish)",
    pattern: {
      type: "sequential",
      prefix: "Platea ",
      suffix: "",
      startValue: 1,
      increment: 1,
      direction: "vertical",
    } as BatchPattern,
  },
  {
    name: "Box Seats",
    pattern: {
      type: "sequential",
      prefix: "Box ",
      suffix: "",
      startValue: 1,
      increment: 1,
      direction: "vertical",
    } as BatchPattern,
  },
  {
    name: "Balcony Rows",
    pattern: {
      type: "alphabetic",
      prefix: "Balcony ",
      suffix: "",
      startValue: "A",
      increment: 1,
      direction: "vertical",
    } as BatchPattern,
  },
]

export function BatchLabelingDialog({ onApplyPattern, selectedCount }: BatchLabelingDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [pattern, setPattern] = useState<BatchPattern>({
    type: "sequential",
    prefix: "",
    suffix: "",
    startValue: 1,
    increment: 1,
    direction: "horizontal",
  })

  const handlePresetSelect = (presetName: string) => {
    const preset = PRESET_PATTERNS.find((p) => p.name === presetName)
    if (preset) {
      setPattern(preset.pattern)
      setSelectedPreset(presetName)
    }
  }

  const handleApply = () => {
    onApplyPattern(pattern)
    setIsOpen(false)
  }

  const generatePreview = () => {
    const items = []
    const maxPreview = 5

    for (let i = 0; i < Math.min(maxPreview, selectedCount.rows + selectedCount.seats); i++) {
      let value: string

      if (pattern.type === "sequential") {
        value = `${pattern.prefix}${(pattern.startValue as number) + i * pattern.increment}${pattern.suffix}`
      } else if (pattern.type === "alphabetic") {
        const startChar = (pattern.startValue as string).charCodeAt(0)
        const char = String.fromCharCode(startChar + i * pattern.increment)
        value = `${pattern.prefix}${char}${pattern.suffix}`
      } else {
        value = `${pattern.prefix}${i + 1}${pattern.suffix}`
      }

      items.push(value)
    }

    return items
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Wand2 className="w-4 h-4 mr-2" />
          Labeling
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Labeling Patterns</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">{selectedCount.rows} rows selected</Badge>
            <Badge variant="outline">{selectedCount.seats} seats selected</Badge>
          </div>

          {/* Preset Patterns */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PATTERNS.map((preset) => (
                <Button
                  key={preset.name}
                  variant={selectedPreset === preset.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetSelect(preset.name)}
                  className="justify-start"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Pattern */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Custom Pattern</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pattern-type" className="text-xs">
                  Pattern Type
                </Label>
                <Select
                  value={pattern.type}
                  onValueChange={(value: "sequential" | "alphabetic" | "custom") =>
                    setPattern({ ...pattern, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">Sequential Numbers</SelectItem>
                    <SelectItem value="alphabetic">Alphabetic</SelectItem>
                    <SelectItem value="custom">Custom Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="direction" className="text-xs">
                  Direction
                </Label>
                <Select
                  value={pattern.direction}
                  onValueChange={(value: "horizontal" | "vertical") => setPattern({ ...pattern, direction: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal (Left to Right)</SelectItem>
                    <SelectItem value="vertical">Vertical (Top to Bottom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prefix" className="text-xs">
                  Prefix
                </Label>
                <Input
                  id="prefix"
                  value={pattern.prefix}
                  onChange={(e) => setPattern({ ...pattern, prefix: e.target.value })}
                  placeholder="e.g., Row, VIP, A"
                />
              </div>

              <div>
                <Label htmlFor="suffix" className="text-xs">
                  Suffix
                </Label>
                <Input
                  id="suffix"
                  value={pattern.suffix}
                  onChange={(e) => setPattern({ ...pattern, suffix: e.target.value })}
                  placeholder="e.g., -Premium, *"
                />
              </div>

              <div>
                <Label htmlFor="start-value" className="text-xs">
                  Start Value
                </Label>
                {pattern.type === "alphabetic" ? (
                  <Input
                    id="start-value"
                    value={pattern.startValue as string}
                    onChange={(e) => setPattern({ ...pattern, startValue: e.target.value.toUpperCase() })}
                    placeholder="A"
                    maxLength={1}
                  />
                ) : (
                  <Input
                    id="start-value"
                    type="number"
                    value={pattern.startValue as number}
                    onChange={(e) => setPattern({ ...pattern, startValue: Number.parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="increment" className="text-xs">
                  Increment
                </Label>
                <Input
                  id="increment"
                  type="number"
                  value={pattern.increment}
                  onChange={(e) => setPattern({ ...pattern, increment: Number.parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Preview</Label>
            <div className="flex gap-2 flex-wrap">
              {generatePreview().map((item, index) => (
                <Badge key={index} variant="secondary">
                  {item}
                </Badge>
              ))}
              {selectedCount.rows + selectedCount.seats > 5 && (
                <Badge variant="outline">+{selectedCount.rows + selectedCount.seats - 5} more...</Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={selectedCount.rows === 0 && selectedCount.seats === 0}>
              Apply Pattern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

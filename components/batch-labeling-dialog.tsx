"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
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

const SIMPLE_PRESETS = [
  {
    name: "Theater Rows",
    description: "A, B, C, D...",
    pattern: {
      type: "alphabetic" as const,
      prefix: "",
      suffix: "",
      startValue: "A",
      increment: 1,
      direction: "vertical" as const,
    }
  },
  {
    name: "Numbers",
    description: "1, 2, 3, 4...",
    pattern: {
      type: "sequential" as const,
      prefix: "",
      suffix: "",
      startValue: 1,
      increment: 1,
      direction: "horizontal" as const,
    }
  },
  {
    name: "VIP Section",
    description: "VIP-1, VIP-2, VIP-3...",
    pattern: {
      type: "sequential" as const,
      prefix: "VIP-",
      suffix: "",
      startValue: 1,
      increment: 1,
      direction: "horizontal" as const,
    }
  },
  {
    name: "Balcony",
    description: "Balcony A, Balcony B...",
    pattern: {
      type: "alphabetic" as const,
      prefix: "Balcony ",
      suffix: "",
      startValue: "A",
      increment: 1,
      direction: "vertical" as const,
    }
  }
]

export function BatchLabelingDialog({ onApplyPattern, selectedCount }: BatchLabelingDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customStart, setCustomStart] = useState(1)

  const handleApplyPreset = (presetName: string) => {
    const preset = SIMPLE_PRESETS.find(p => p.name === presetName)
    if (preset) {
      onApplyPattern(preset.pattern)
      setIsOpen(false)
    }
  }

  const handleApplyCustom = () => {
    const customPattern: BatchPattern = {
      type: "sequential",
      prefix: "",
      suffix: "",
      startValue: customStart,
      increment: 1,
      direction: "horizontal",
    }
    onApplyPattern(customPattern)
    setIsOpen(false)
  }

  const generatePreview = (startValue: number) => {
    const preview: string[] = []
    for (let i = 0; i < Math.min(5, selectedCount.rows); i++) {
      preview.push(`${startValue + i}`)
    }
    return preview.join(", ") + (selectedCount.rows > 5 ? ` +${selectedCount.rows - 5} more...` : "")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs px-3 font-medium hover:bg-primary/5 hover:border-primary/20 transition-all duration-200">
          <Wand2 className="w-3.5 h-3.5 mr-1.5" />
          Labeling
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Label Selected Rows</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection Status */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">
              {selectedCount.rows} rows selected
            </div>
            <div className="text-xs text-muted-foreground">
              Choose how to label these rows
            </div>
          </div>

          {/* Simple Presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Options</Label>
            <div className="grid grid-cols-1 gap-2">
              {SIMPLE_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant={selectedPreset === preset.name ? "default" : "outline"}
                  size="sm"
                  className="w-full h-12 justify-start"
                  onClick={() => setSelectedPreset(preset.name)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">{preset.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Option */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Custom Start Number</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={customStart}
                  onChange={(e) => setCustomStart(parseInt(e.target.value) || 1)}
                  className="h-10 text-center"
                  min="1"
                  max="999"
                />
                <div className="text-sm text-muted-foreground">
                  Preview: {generatePreview(customStart)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            {selectedPreset ? (
              <Button onClick={() => handleApplyPreset(selectedPreset)} className="flex-1">
                Apply {selectedPreset}
              </Button>
            ) : (
              <Button onClick={handleApplyCustom} className="flex-1">
                Apply Custom
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
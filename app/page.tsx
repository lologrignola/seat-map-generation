"use client"

import { SeatMapBuilder } from "@/components/seat-map-builder"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">SeatMapBuilder</h1>
          <p className="text-muted-foreground">Visual editor for creating theater seat maps</p>
        </div>
        <SeatMapBuilder />
      </div>
    </div>
  )
}

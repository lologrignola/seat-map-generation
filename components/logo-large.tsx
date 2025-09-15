import React from 'react'

interface LogoLargeProps {
  className?: string
}

export function LogoLarge({ className = '' }: LogoLargeProps) {
  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Large Logo Icon */}
      <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
        <div className="grid grid-cols-3 gap-2 w-16 h-16">
          {/* Top row */}
          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
          
          {/* Middle row */}
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
          
          {/* Bottom row */}
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
        </div>
      </div>
      
      {/* Large Logo Text */}
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
          SeatMapBuilder
        </h1>
        <p className="text-lg text-muted-foreground">Professional seating design</p>
      </div>
    </div>
  )
}

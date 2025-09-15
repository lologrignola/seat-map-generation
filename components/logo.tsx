import React from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm`}>
        <div className="grid grid-cols-3 gap-0.5 w-5 h-5">
          {/* Top row */}
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          
          {/* Middle row */}
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          
          {/* Bottom row */}
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div>
          <h1 className={`${textSizes[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent`}>
            SeatMapBuilder
          </h1>
          {size !== 'sm' && (
            <p className="text-xs text-muted-foreground -mt-1">Professional seating design</p>
          )}
        </div>
      )}
    </div>
  )
}

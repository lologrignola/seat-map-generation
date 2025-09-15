"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogoLarge } from "./logo-large"
import { Github, Linkedin, ExternalLink, Heart } from "lucide-react"

export function AboutDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
          About
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">About SeatMapBuilder</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Logo and Title */}
          <div className="flex justify-center">
            <LogoLarge />
          </div>

          {/* Description */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              A professional seating design and management tool built with modern web technologies.
            </p>
            <p className="text-sm text-muted-foreground">
              Create, edit, and manage seating arrangements for venues, events, and spaces with an intuitive drag-and-drop interface.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Key Features</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium">🎨 Visual Design</div>
                <div className="text-muted-foreground">Professional UI with drag-and-drop editing</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">🔄 Undo/Redo</div>
                <div className="text-muted-foreground">Full history tracking with keyboard shortcuts</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">📊 Categories</div>
                <div className="text-muted-foreground">Ground Floor, Balcony, Wheelchair sections</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">📤 Export/Import</div>
                <div className="text-muted-foreground">JSON format for data portability</div>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Built With</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {['Next.js', 'TypeScript', 'Tailwind CSS', 'React', 'Radix UI'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-muted rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Author Info */}
          <div className="text-center space-y-4 border-t pt-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>by</span>
              <span className="font-medium text-foreground">Lorenzo Grignola</span>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://github.com/lologrignola"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              
              <a
                href="https://www.linkedin.com/in/lorenzogrignola/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import React from 'react'
import { Github, Linkedin, ExternalLink } from 'lucide-react'
import { AboutDialog } from './about-dialog'

export function Footer() {
  return (
    <div className="flex-shrink-0 border-t border-border/30 bg-gradient-to-r from-muted/10 via-background to-muted/10 backdrop-blur-sm">
      <div className="px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Left side - App info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Built with ❤️ by</span>
            <span className="font-medium text-foreground">Lorenzo Grignola</span>
          </div>
          
          {/* Right side - Links */}
          <div className="flex items-center gap-3">
            <AboutDialog />
            
            <a
              href="https://github.com/lologrignola"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            
            <a
              href="https://www.linkedin.com/in/lorenzogrignola/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

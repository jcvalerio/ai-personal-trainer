'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Info } from 'lucide-react'

// This will be replaced during build with actual commit info
const VERSION_INFO = {
  commit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || '905ec5f',
  shortCommit: (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || '905ec5f').substring(0, 7),
  branch: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF || 'main',
  buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}

interface VersionIndicatorProps {
  variant?: 'badge' | 'button' | 'minimal'
  className?: string
  showDialog?: boolean
}

export function VersionIndicator({ 
  variant = 'badge', 
  className = '',
  showDialog = false 
}: VersionIndicatorProps) {
  const [open, setOpen] = useState(false)

  const renderContent = () => {
    switch (variant) {
      case 'button':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-6 px-2 text-xs ${className}`}
          >
            v{VERSION_INFO.shortCommit}
          </Button>
        )
      case 'minimal':
        return (
          <span className={`text-xs text-muted-foreground ${className}`}>
            v{VERSION_INFO.shortCommit}
          </span>
        )
      default:
        return (
          <Badge 
            variant="secondary" 
            className={`text-xs ${className}`}
          >
            v{VERSION_INFO.shortCommit}
          </Badge>
        )
    }
  }

  if (!showDialog) {
    return renderContent()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {renderContent()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Version Information
          </DialogTitle>
          <DialogDescription>
            Current deployment details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Version:</div>
            <div className="font-mono">{VERSION_INFO.shortCommit}</div>
            
            <div className="font-medium">Full Commit:</div>
            <div className="font-mono text-xs break-all">{VERSION_INFO.commit}</div>
            
            <div className="font-medium">Branch:</div>
            <div className="font-mono">{VERSION_INFO.branch}</div>
            
            <div className="font-medium">Environment:</div>
            <div className="font-mono">{VERSION_INFO.environment}</div>
            
            <div className="font-medium">Build Time:</div>
            <div className="text-xs">{new Date(VERSION_INFO.buildTime).toLocaleString()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Debug component for development
export function DebugVersionInfo() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-2 right-2 z-50">
      <VersionIndicator variant="button" showDialog className="opacity-70 hover:opacity-100" />
    </div>
  )
}
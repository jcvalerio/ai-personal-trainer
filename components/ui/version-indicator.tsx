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
import { Activity, Code2, Clock, GitBranch } from 'lucide-react'

// Get version info from multiple sources (Vercel, custom build, git)
const getVersionInfo = () => {
  // Try multiple sources for commit SHA
  const commitSha = 
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || // Vercel automatic
    process.env.VERCEL_GIT_COMMIT_SHA || // Vercel server-side
    process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || // Our custom build script
    'ff353be'; // Fallback
  
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || 
    process.env.VERCEL_BUILD_TIME || 
    new Date().toISOString()
  
  const isProduction = process.env.NODE_ENV === 'production'
  const environment = process.env.NODE_ENV || 'development'
  
  return {
    commit: commitSha,
    shortCommit: commitSha.substring(0, 7),
    branch: 
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 
      process.env.VERCEL_GIT_COMMIT_REF || 
      process.env.NEXT_PUBLIC_GIT_BRANCH ||
      'main',
    buildTime,
    buildDate: new Date(buildTime),
    environment,
    isProduction,
    // User-friendly status
    status: isProduction ? 'Live' : 'Development',
    statusColor: isProduction ? 'text-green-600' : 'text-blue-600',
    // Vercel deployment info
    url: process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL,
    deploymentId: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || process.env.VERCEL_DEPLOYMENT_ID,
    // Custom build version
    buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION,
    // User-friendly app version
    appVersion: `v${commitSha.substring(0, 7)}`,
    // Last updated relative time
    lastUpdated: new Date(buildTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }
}

const VERSION_INFO = getVersionInfo();

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
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false)

  const renderContent = () => {
    switch (variant) {
      case 'button':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-10 px-3 text-sm min-w-[44px] ${className}`}
          >
            {VERSION_INFO.appVersion}
          </Button>
        )
      case 'minimal':
        return (
          <span className={`text-sm text-muted-foreground ${className}`}>
            {VERSION_INFO.appVersion}
          </span>
        )
      default:
        return (
          <Badge 
            variant="secondary" 
            className={`text-sm px-3 py-1 min-h-[32px] ${className}`}
          >
            {VERSION_INFO.appVersion}
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
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <Activity className="h-5 w-5 text-blue-600" />
            App Information
          </DialogTitle>
          <DialogDescription className="text-base">
            Current app status and version details
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User-friendly information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${VERSION_INFO.isProduction ? 'bg-green-500' : 'bg-blue-500'}`} />
                <span className={`font-semibold ${VERSION_INFO.statusColor}`}>
                  {VERSION_INFO.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Version</span>
              <span className="font-mono text-lg font-bold text-gray-900">
                {VERSION_INFO.appVersion}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Last Updated</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-900">
                  {VERSION_INFO.lastUpdated}
                </span>
              </div>
            </div>
          </div>

          {/* Developer information - collapsible */}
          <div className="pt-4 border-t border-gray-200">
            <button 
              onClick={() => setShowDeveloperInfo(!showDeveloperInfo)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full text-left"
            >
              <Code2 className="h-4 w-4" />
              <span>Developer Information</span>
              <span className="ml-auto text-xs">
                {showDeveloperInfo ? '▼' : '▶'}
              </span>
            </button>
            
            {showDeveloperInfo && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-600">Commit:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                    {VERSION_INFO.commit}
                  </code>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-600">Branch:</span>
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    <code className="text-xs">{VERSION_INFO.branch}</code>
                  </div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-600">Environment:</span>
                  <code className="text-xs">{VERSION_INFO.environment}</code>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-600">Build Time:</span>
                  <code className="text-xs">{VERSION_INFO.buildDate.toLocaleString()}</code>
                </div>
                
                {VERSION_INFO.url && (
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-gray-600">URL:</span>
                    <code className="text-xs break-all bg-gray-100 px-2 py-1 rounded">
                      {VERSION_INFO.url}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Version info component for all environments
export function DebugVersionInfo() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <VersionIndicator 
        variant="button" 
        showDialog 
        className="opacity-80 hover:opacity-100 transition-opacity duration-200 shadow-lg border border-gray-200 bg-white/90 backdrop-blur-sm" 
      />
    </div>
  )
}
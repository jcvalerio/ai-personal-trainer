/**
 * Alert and notification components
 * Used for displaying important messages to users
 */
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-red-200 bg-red-50 text-red-800',
        success: 'border-green-200 bg-green-50 text-green-800',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        info: 'border-blue-200 bg-blue-50 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, onDismiss, children, ...props }, ref) => {
    const getIcon = () => {
      switch (variant) {
        case 'success':
          return <CheckCircle className="h-4 w-4" />
        case 'destructive':
          return <AlertCircle className="h-4 w-4" />
        case 'warning':
          return <AlertTriangle className="h-4 w-4" />
        case 'info':
          return <Info className="h-4 w-4" />
        default:
          return <Info className="h-4 w-4" />
      }
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

// Convenient preset alert components
interface SimpleAlertProps {
  title?: string
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

export function SuccessAlert({ title = 'Success', children, onDismiss, className }: SimpleAlertProps) {
  return (
    <Alert variant="success" onDismiss={onDismiss} className={className}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function ErrorAlert({ title = 'Error', children, onDismiss, className }: SimpleAlertProps) {
  return (
    <Alert variant="destructive" onDismiss={onDismiss} className={className}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function WarningAlert({ title = 'Warning', children, onDismiss, className }: SimpleAlertProps) {
  return (
    <Alert variant="warning" onDismiss={onDismiss} className={className}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function InfoAlert({ title = 'Information', children, onDismiss, className }: SimpleAlertProps) {
  return (
    <Alert variant="info" onDismiss={onDismiss} className={className}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

// Toast-style notifications (would typically be used with a toast provider)
interface ToastAlertProps extends SimpleAlertProps {
  duration?: number
  onClose?: () => void
}

export function ToastAlert({ 
  title, 
  children, 
  onDismiss, 
  duration = 5000, 
  onClose,
  className 
}: ToastAlertProps & { variant?: 'success' | 'destructive' | 'warning' | 'info' }) {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.()
        onClose?.()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss, onClose])

  return (
    <Alert 
      variant="info" 
      onDismiss={onDismiss} 
      className={cn(
        'fixed bottom-4 right-4 w-96 shadow-lg border z-50',
        className
      )}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export { Alert, AlertTitle, AlertDescription }
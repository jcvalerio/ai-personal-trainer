/**
 * Dialog component for modals and overlays
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Ensure overlay fully hides and stops interactions when closed,
      // even if Tailwind animate utilities are not present.
      'fixed inset-0 z-50 bg-black/50',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'data-[state=closed]:pointer-events-none data-[state=closed]:hidden data-[state=closed]:opacity-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Enable mobile-first responsive layout */
    mobileMode?: 'fullscreen' | 'bottomSheet' | 'responsive';
  }
>(({ className, children, mobileMode = 'responsive', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Base styles for all modes
        'z-50 grid gap-4 border border-gray-200 bg-white shadow-lg duration-200',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        'data-[state=closed]:pointer-events-none data-[state=closed]:hidden data-[state=closed]:opacity-0',
        
        // Mobile-first responsive modes
        mobileMode === 'fullscreen' && [
          // Mobile: fullscreen with safe areas
          'fixed inset-0 w-full h-full',
          'max-md:pb-safe max-md:pt-safe',
          // Desktop: centered modal
          'md:fixed md:left-1/2 md:top-1/2 md:h-auto md:w-full md:max-w-lg',
          'md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:p-6',
          'md:data-[state=open]:zoom-in-95 md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]',
          'md:data-[state=closed]:zoom-out-95 md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%]'
        ],
        
        mobileMode === 'bottomSheet' && [
          // Mobile: bottom sheet
          'max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0',
          'max-md:max-h-[90vh] max-md:overflow-y-auto max-md:rounded-t-2xl max-md:pb-safe',
          'max-md:data-[state=open]:slide-in-from-bottom-full',
          'max-md:data-[state=closed]:slide-out-to-bottom-full',
          // Desktop: centered modal
          'md:fixed md:left-1/2 md:top-1/2 md:w-full md:max-w-lg',
          'md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:p-6',
          'md:data-[state=open]:zoom-in-95 md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]',
          'md:data-[state=closed]:zoom-out-95 md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%]'
        ],
        
        mobileMode === 'responsive' && [
          // Default responsive behavior
          'fixed left-[50%] top-[50%] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] p-6 sm:rounded-lg',
          'data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          // Mobile optimizations
          'max-sm:mx-4 max-sm:max-h-[90vh] max-sm:overflow-y-auto'
        ],
        
        className
      )}
      {...props}
    >
      {/* Mobile handle bar for bottom sheet mode */}
      {mobileMode === 'bottomSheet' && (
        <div className='mx-auto mt-3 h-1 w-12 rounded-full bg-gray-300 md:hidden' />
      )}
      
      {children}
      
      <DialogPrimitive.Close 
        className={cn(
          'absolute rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
          'disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500',
          // Position adjustments for different modes
          mobileMode === 'fullscreen' ? 'right-4 top-4 h-10 w-10 p-2' : 'right-4 top-4'
        )}
      >
        <X className={mobileMode === 'fullscreen' ? 'h-6 w-6' : 'h-4 w-4'} />
        <span className='sr-only'>Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

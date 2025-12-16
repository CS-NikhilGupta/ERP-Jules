"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

// Since I cannot use Radix UI Primitives easily without installing them, I will create a simple custom Dialog implementation
// that mimics the Shadcn API structure for the purpose of this MVP.
// In a real scenario, I would install @radix-ui/react-dialog.

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export function Dialog({ children, open, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  // If controlled, use props. If uncontrolled, use state.
  const [isOpenState, setIsOpenState] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : isOpenState;
  const setOpen = isControlled ? onOpenChange : setIsOpenState;

  return (
    <DialogContext.Provider value={{ open: !!isOpen, onOpenChange: setOpen || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, asChild: _asChild }: { children: React.ReactNode, asChild?: boolean }) {
  const context = React.useContext(DialogContext);

  // Just to suppress the unused var warning in this mock implementation
  void _asChild;

  return (
    <div onClick={() => context?.onOpenChange(true)} className="inline-block cursor-pointer">
      {children}
    </div>
  )
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const context = React.useContext(DialogContext);
  if (!context?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
       <div className={cn("relative bg-background p-6 rounded-lg shadow-lg w-full max-w-lg border", className)}>
         <button
           onClick={() => context.onOpenChange(false)}
           className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
         >
           X
         </button>
         {children}
       </div>
    </div>
  )
}

export function DialogHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  )
}

export function DialogDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

export function DialogFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {children}
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }
>(({ className, defaultValue, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue)

  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      data-active-tab={activeTab}
      {...props}
    >
        {/* Pass state to children via context or cloneElement (simplified here via prop injection won't work easily without context) */}
        {/* We will use a simple Context for this "lite" implementation */}
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            {props.children}
        </TabsContext.Provider>
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsContext = React.createContext<{
    activeTab?: string;
    setActiveTab: (v: string) => void;
}>({ setActiveTab: () => {} });

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const { activeTab, setActiveTab } = React.useContext(TabsContext);
    const isActive = activeTab === value;

    return (
        <button
            ref={ref}
            className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            isActive && "bg-background text-foreground shadow-sm",
            className
            )}
            onClick={() => setActiveTab(value)}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const { activeTab } = React.useContext(TabsContext);
    if (activeTab !== value) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }

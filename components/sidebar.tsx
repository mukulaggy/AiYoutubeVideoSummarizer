"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, History, Menu, Sparkles } from "lucide-react"
import type React from "react"

const routes = [
  {
    label: "Home",
    icon: Home,
    href: "/",
  },
  {
    label: "History",
    icon: History,
    href: "/history",
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 backdrop-blur-sm bg-background/50", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center px-4 mb-6">
          
            <h2 className="text-lg font-semibold tracking-tight bg-clip-text text-transparent  bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300">
              AI Summarizer
            </h2>
          </div>
          <div className="space-y-1">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-300",
                  pathname === route.href
                    ? "bg-gradient-to-r from-primary/20 via-cyan-500/20 to-violet-500/20 text-primary"
                    : "hover:bg-primary/10",
                )}
                asChild
              >
                <Link href={route.href}>
                  <route.icon
                    className={cn("mr-2 h-4 w-4", pathname === route.href ? "text-primary" : "text-muted-foreground")}
                  />
                  {route.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 bg-background/80 backdrop-blur-md border-primary/20">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <Sidebar className="w-full" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}


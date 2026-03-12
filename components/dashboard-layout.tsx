"use client"

import type React from "react"
import { Brain, UserCheck } from "lucide-react" // Import Brain icon and UserCheck icon

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Building2,
  DollarSign,
  Users,
  UserCircle,
  LayoutDashboard,
  Menu,
  X,
  Settings,
  Bell,
  MessageCircle,
  Search,
  Home,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  Hammer,
  ChevronDown,
} from "lucide-react"
import dynamic from "next/dynamic"
import type { NotificationUiState } from "@/frontend/src/modules/notifications/store/notificationStore"
const NotificationBell = dynamic(
  () => import("@/frontend/src/modules/notifications/components/NotificationBell").then(m => m.NotificationBell),
  { ssr: false }
)
import { useTheme } from "@/lib/theme-provider"
import { useAuth } from "@/lib/auth-context"
import { ChatDialog } from "@/components/chat/chat-dialog"
import { AuthToasts } from "@/lib/toast-utils"

// Helper function to check if user has access to a module
const hasModuleAccess = (permissions: string[] | undefined, module: string): boolean => {
  if (!permissions || permissions.length === 0) return false
  // Check if user has all permissions (admin) or specific module permissions
  if (permissions.includes('*')) return true
  return permissions.some((p) => p.startsWith(`${module}.`))
}

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}
type NavSection = { label: string; items: NavItem[] }

const getNavigationForUser = (role: string, permissions?: string[]): NavSection[] => {
  const normalizedRole = role?.toLowerCase() || ""

  // Admin always has all access
  if (normalizedRole === "admin") {
    return [
      {
        label: "Core",
        items: [
          { name: "Dashboard", href: "/", icon: LayoutDashboard },
          { name: "AI Intelligence", href: "/ai-intelligence", icon: Brain },
          { name: "Properties", href: "/properties", icon: Building2 },
          { name: "Tenant Portal", href: "/tenant", icon: Home },
        ],
      },
      { label: "Financials", items: [{ name: "Finance", href: "/finance", icon: DollarSign }] },
      {
        label: "Operations",
        items: [
          { name: "Construction", href: "/construction", icon: Hammer },
          { name: "HR Management", href: "/hr", icon: Users },
        ],
      },
      { label: "Sales", items: [{ name: "CRM", href: "/crm", icon: UserCircle }] },
      {
        label: "System",
        items: [
          { name: "Roles & Permissions", href: "/roles", icon: Shield },
          { name: "Reminder & Notifications", href: "/notifications", icon: Bell },
          { name: "Settings", href: "/settings", icon: Settings },
        ],
      },
    ]
  }

  // For non-admin users, check permissions dynamically
  const core: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "AI Intelligence", href: "/ai-intelligence", icon: Brain },
  ]
  const financials: NavItem[] = []
  const operations: NavItem[] = []
  const sales: NavItem[] = []
  const system: NavItem[] = []

  if (hasModuleAccess(permissions, "properties")) core.push({ name: "Properties", href: "/properties", icon: Building2 })
  if (hasModuleAccess(permissions, "tenant")) core.push({ name: "Tenant Portal", href: "/tenant", icon: Home })

  if (hasModuleAccess(permissions, "finance")) financials.push({ name: "Finance", href: "/finance", icon: DollarSign })

  if (hasModuleAccess(permissions, "construction")) operations.push({ name: "Construction", href: "/construction", icon: Hammer })
  if (hasModuleAccess(permissions, "hr")) operations.push({ name: "HR Management", href: "/hr", icon: Users })

  if (hasModuleAccess(permissions, "crm")) sales.push({ name: "CRM", href: "/crm", icon: UserCircle })

  if (hasModuleAccess(permissions, "permissions")) system.push({ name: "Roles & Permissions", href: "/roles", icon: Shield })
  if (hasModuleAccess(permissions, "notification") || hasModuleAccess(permissions, "reminder")) {
    system.push({ name: "Reminder & Notifications", href: "/notifications", icon: Bell })
  }
  system.push({ name: "Settings", href: "/settings", icon: Settings })

  const sections: NavSection[] = [{ label: "Core", items: core }]
  if (financials.length) sections.push({ label: "Financials", items: financials })
  if (operations.length) sections.push({ label: "Operations", items: operations })
  if (sales.length) sections.push({ label: "Sales", items: sales })
  if (system.length) sections.push({ label: "System", items: system })

  return sections
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Load sidebar state from localStorage on mount
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen')
      return saved === 'true'
    }
    return false
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const [chatOpen, setChatOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, logout, loading, isAuthenticated } = useAuth()
  const [openSection, setOpenSection] = useState<string>("Core")

  // Set initial open section based on pathname
  useEffect(() => {
    if (!user) return
    const nav = getNavigationForUser(user.role, user.permissions)
    const currentSection = nav.find(sec =>
      sec.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"))
    )
    if (currentSection) {
      setOpenSection(currentSection.label)
    }
  }, [pathname, user])

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', String(sidebarOpen))
    }
  }, [sidebarOpen])

  // Save sidebar collapsed state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
    }
  }, [sidebarCollapsed])

  // Close sidebar on mobile when pathname changes (navigation)
  useEffect(() => {
    // Close sidebar on mobile when navigating to a new page
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

  // Redirect to login if not authenticated (but not if already on a login page)
  useEffect(() => {
    // Don't redirect if already on a login page
    if (pathname === "/login" || pathname === "/roles/login" || pathname === "/invite-login") {
      return
    }

    // Wait for loading to finish and check if we have a token
    if (!loading) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("erp-user") : null

      // Only redirect if we're truly not authenticated (no token AND no user)
      if (!isAuthenticated && !user && !token && !storedUser) {
        router.push("/login")
        return
      }

      // If we have token but no user yet, wait a bit (auth context is still initializing)
      if (token && storedUser && !user) {
        // Give auth context time to set the user
        return
      }

      // If we have token and stored user but still not authenticated, check role
      if (token && storedUser && !isAuthenticated) {
        try {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser.role?.toLowerCase() !== "admin") {
            router.push("/roles/login")
            return
          }
        } catch (e) {
          // If parsing fails, default to admin login
        }
      }
    }
  }, [loading, isAuthenticated, user, router, pathname])

  const navigation = user ? getNavigationForUser(user.role, user.permissions) : []
  const hasAdvancedAccess =
    user &&
    (user.role?.toLowerCase() === "admin" || hasModuleAccess(user.permissions, "advanced"))

  const handleLogout = async () => {
    try {
      await logout()
      AuthToasts.logoutSuccess()
      router.push("/login")
    } catch (error) {
      AuthToasts.logoutError()
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex h-screen bg-[#F5F6FA] dark:bg-background p-4 gap-4">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-4 left-4 z-50 w-64 transform bg-gradient-to-b from-purple-900/95 via-indigo-900/95 to-blue-950/95 text-white backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          sidebarOpen && "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center px-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-white/90" />
              {!sidebarCollapsed && <span className="text-xl font-bold text-white tracking-wide">RealEstate ERP</span>}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style dangerouslySetInnerHTML={{
              __html: `
              nav::-webkit-scrollbar {
                display: none;
              }
            `}} />
            <div className="space-y-2">
              {navigation.map((section) => {
                const isSectionOpen = openSection === section.label
                return (
                  <div key={section.label} className="flex flex-col">
                    {!sidebarCollapsed ? (
                      <button
                        onClick={() => setOpenSection(isSectionOpen ? "" : section.label)}
                        className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/50 hover:text-white/90 transition-colors focus:outline-none"
                      >
                        <span>{section.label}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isSectionOpen ? "rotate-180" : "")} />
                      </button>
                    ) : (
                      <div className="px-3 py-2 mb-1 text-[10px] text-center font-bold uppercase tracking-wider text-white/40 border-b border-white/5 pb-2">{section.label.substring(0, 3)}</div>
                    )}

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isSectionOpen || sidebarCollapsed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden space-y-1">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => {
                                if (window.innerWidth < 1024) {
                                  setSidebarOpen(false)
                                }
                              }}
                              className={cn(
                                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                                "border border-white/5 hover:border-white/20 hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                                isActive
                                  ? "bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-white/20"
                                  : "text-white/70 hover:text-white hover:bg-white/5",
                                sidebarCollapsed && "justify-center",
                              )}
                              title={sidebarCollapsed ? item.name : undefined}
                            >
                              <span
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 shadow-inner shrink-0",
                                  isActive
                                    ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                    : "bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]",
                                )}
                              >
                                <item.icon className="h-[14px] w-[14px]" />
                              </span>
                              {!sidebarCollapsed && item.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Profile Section */}
          <div className="p-4 border-t border-white/10">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg flex-shrink-0">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name || "Admin User"}</p>
                  <p className="text-xs text-white/60 truncate">{user?.email || "admin@realestate.com"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white/70 hover:text-white hover:bg-white/10">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                  <UserCircle className="h-6 w-6" />
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme" className="text-white/70 hover:text-white hover:bg-white/10">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          {/* Settings and Support */}
          <div className="border-t border-white/10">
            <div className="space-y-1 px-3 py-3">
              <Link
                href="/support"
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-white/5 hover:bg-white/5 hover:border-white/20 hover:shadow-md hover:-translate-y-0.5",
                  pathname === "/support"
                    ? "bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-white/20"
                    : "text-white/70 hover:text-white",
                  sidebarCollapsed && "justify-center",
                )}
                title={sidebarCollapsed ? "Support" : undefined}
              >
                <span className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 shadow-inner shrink-0",
                  pathname === "/support" ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white" : "bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white"
                )}>
                  <HelpCircle className="h-3 w-3 sm:h-[14px] sm:w-[14px]" />
                </span>
                {!sidebarCollapsed && "Support"}
              </Link>
            </div>

            <div className="px-3 pb-3">
              {!sidebarCollapsed ? (
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full bg-white/5 text-red-300 hover:bg-red-500 hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  onClick={handleLogout}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Powered by eyercall */}
            <div className="px-4 pb-4 text-center border-t border-white/10 pt-3">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                Powered by <span className="font-bold text-white/70"><a target="_blank" href="https://eyercall.com">eyercall</a></span>
                t              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-card border border-border rounded-2xl shadow-lg">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {sidebarOpen ? (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200 border border-transparent hover:border-destructive/20"
                onClick={() => setSidebarOpen(false)}
                title="Close sidebar"
              >
                <X className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 border border-transparent hover:border-primary/20"
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 border border-transparent hover:border-primary/20"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
              )}
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search by property code, name..."
                className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value.trim()
                    if (query) {
                      // Navigate to properties page with search query
                      router.push(`/properties?search=${encodeURIComponent(query)}`)
                        ; (e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasAdvancedAccess && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => router.push("/admin/advanced-options")}
              >
                Advanced Options
              </Button>
            )}
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                setChatOpen(true)
                setUnreadMessages(0)
              }}
            >
              <MessageCircle className="h-5 w-5" />
              {!chatOpen && unreadMessages > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm border-2 border-background">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/30">{children}</main>
      </div>

      {/* Chat Dialog */}
      <ChatDialog
        open={chatOpen}
        onOpenChange={(open) => {
          setChatOpen(open)
          // Clear unread count immediately when chat opens
          if (open) {
            setUnreadMessages(0)
          }
        }}
        onNewMessage={() => {
          // Only show red dot when chat is closed
          // Check chatOpen state directly to ensure it's accurate
          if (!chatOpen) {
            setUnreadMessages((prev) => prev + 1)
          }
          // Don't show red dot when chat is open
        }}
      />
    </div>
  )
}

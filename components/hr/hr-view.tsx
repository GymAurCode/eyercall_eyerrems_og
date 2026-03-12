"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserCheck, Clock, Calendar, Plus, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"
import { EmployeesView } from "./employees-view"
import { AttendanceView } from "./attendance-view"
import { PayrollView } from "./payroll-view"
import { LeaveView } from "./leave-view"
import { AddEmployeeDialog } from "./add-employee-dialog"
import { AttendancePortalView } from "./attendance-portal-view"
import { cn } from "@/lib/utils"

export function HRView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [hrStats, setHrStats] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeTab, setActiveTabState] = useState("employees")
  const [hasInitializedTab, setHasInitializedTab] = useState(false)
  const tabStorageKey = "hr-active-tab"

  const updateActiveTab = useCallback(
    (value: string, { shouldPersistQuery = true }: { shouldPersistQuery?: boolean } = {}) => {
      if (value !== activeTab) {
        setActiveTabState(value)
      }

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(tabStorageKey, value)
        } catch {
          // Ignore storage errors (private mode, etc.)
        }
      }

      if (shouldPersistQuery) {
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", value)
        const query = params.toString()
        router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
      }
    },
    [activeTab, pathname, router, searchParams, tabStorageKey],
  )

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab")
    if (tabFromQuery && tabFromQuery !== activeTab) {
      updateActiveTab(tabFromQuery, { shouldPersistQuery: false })
      if (!hasInitializedTab) {
        setHasInitializedTab(true)
      }
      return
    }

    if (!hasInitializedTab) {
      let storedTab: string | null = null
      if (typeof window !== "undefined") {
        try {
          storedTab = sessionStorage.getItem(tabStorageKey)
        } catch {
          storedTab = null
        }
      }

      if (storedTab && storedTab !== activeTab) {
        updateActiveTab(storedTab)
      } else if (!tabFromQuery) {
        updateActiveTab(activeTab)
      }

      setHasInitializedTab(true)
    }
  }, [activeTab, hasInitializedTab, searchParams, updateActiveTab])

  const handleTabChange = useCallback(
    (value: string) => {
      updateActiveTab(value)
    },
    [updateActiveTab],
  )

  useEffect(() => {
    fetchHRStats()
  }, [])

  const fetchHRStats = async () => {
    try {
      setStatsLoading(true)
      const response = await apiService.stats.getHRStats()

      // API returns { success: true, data: {...} }, axios wraps it so response.data = { success: true, data: {...} }
      // Try multiple access patterns to handle different response structures
      const responseData = response.data as any
      const data = responseData?.data || responseData || {}

      setHrStats([
        {
          name: "Total Employees",
          value: (data.totalEmployees ?? 0).toString(),
          change: data.employeesChange || "+0 this month",
          icon: Users,
          gradient: "from-violet-600 via-indigo-600 to-sky-500",
          href: "/details/employees",
        },
        {
          name: "Active Today",
          value: (data.activeToday ?? 0).toString(),
          change: data.attendanceRate ? `${data.attendanceRate}% attendance` : "0% attendance",
          icon: UserCheck,
          gradient: "from-emerald-500 via-teal-500 to-cyan-500",
          href: "/details/active-today",
        },
        {
          name: "Pending Leaves",
          value: (data.pendingLeaves ?? 0).toString(),
          change: data.urgentLeaves ? `${data.urgentLeaves} urgent` : "0 urgent",
          icon: Calendar,
          gradient: "from-rose-500 via-red-500 to-pink-500",
          href: "/details/pending-leaves",
        },
        {
          name: "Avg Work Hours",
          value: (data.avgWorkHours ?? 0).toString(),
          change: "per week",
          icon: Clock,
          gradient: "from-blue-600 via-indigo-600 to-violet-600",
          href: "/details/work-hours",
        },
      ])
    } catch (err) {
      console.error("Failed to fetch HR stats:", err)
      // Set default values on error
      setHrStats([
        {
          name: "Total Employees",
          value: "0",
          change: "+0 this month",
          icon: Users,
          gradient: "from-violet-600 via-indigo-600 to-sky-500",
          href: "/details/employees",
        },
        {
          name: "Active Today",
          value: "0",
          change: "0% attendance",
          icon: UserCheck,
          gradient: "from-emerald-500 via-teal-500 to-cyan-500",
          href: "/details/active-today",
        },
        {
          name: "Pending Leaves",
          value: "0",
          change: "0 urgent",
          icon: Calendar,
          gradient: "from-rose-500 via-red-500 to-pink-500",
          href: "/details/pending-leaves",
        },
        {
          name: "Avg Work Hours",
          value: "0",
          change: "per week",
          icon: Clock,
          gradient: "from-blue-600 via-indigo-600 to-violet-600",
          href: "/details/work-hours",
        },
      ])
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance">HR Management</h1>
          <p className="text-muted-foreground mt-1">Manage employees, attendance, payroll, and leave requests</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* HR Stats */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {hrStats.map((stat) => (
            <Card
              key={stat.name}
              className={cn(
                "group relative overflow-hidden border-0 p-0 shadow-[0_18px_45px_-25px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] cursor-pointer",
              )}
              onClick={() => router.push(stat.href)}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", stat.gradient)} />
              <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.28),transparent_60%)]" />
              <div className="relative p-6 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/20 bg-white/10",
                    )}
                  >
                    {stat.change}
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-semibold/relaxed text-white/85">{stat.name}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance-portal">Attendance Portal</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <EmployeesView onEmployeeAdded={fetchHRStats} />
        </TabsContent>

        <TabsContent value="attendance-portal">
          <AttendancePortalView />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceView />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollView />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveView />
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          fetchHRStats()
        }}
      />
    </div>
  )
}

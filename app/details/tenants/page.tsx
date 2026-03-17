import { DashboardLayout } from "@/components/dashboard-layout"
import { TenantsDetailsView } from "@/components/tenant/tenants-details-view"
import { getTenantsDetailsServer } from "@/lib/stats-server"

export default async function TenantsDetailsPage() {
  const initialData = await getTenantsDetailsServer()

  return (
    <DashboardLayout>
      <TenantsDetailsView initialData={initialData} />
    </DashboardLayout>
  )
}

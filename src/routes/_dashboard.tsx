import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/remake/AppShell";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { MapPage } from "./map";

export function HomePage() {
  const { user } = useAuth();

  const isAdminUser = user && user.role.name !== "user";

  if (!isAdminUser) {
    return <MapPage />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground">Welcome in Participium</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold">Total Users</h3>
            <p className="text-3xl font-bold">33.5K</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold">Resolved Reports</h3>
            <p className="text-3xl font-bold">1.7K</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold">In Progress Reports</h3>
            <p className="text-3xl font-bold">543</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold">Pending Approval Reports</h3>
            <p className="text-3xl font-bold">400</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Create new user</Button>
          <Button variant="outline">View Reports</Button>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>
    </div>
  );
}
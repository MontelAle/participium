import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
          <Button
            onClick={() =>
              navigate('/app/municipality-users', {
                state: { openCreateDialog: true },
              })
            }
          >
            Create new user
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

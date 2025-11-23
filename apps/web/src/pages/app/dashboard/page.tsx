import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { useReports } from '@/hooks/use-reports';
import { Users, FileText, Timer, AlertCircle, Plus } from 'lucide-react';
import { StatCard } from './components/stat-card';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isAdminUser, user } = useAuth();
  const { data: municipalityUsers = [] } = useMunicipalityUsers();
  const { data: reports = [] } = useReports();

  const inProgressCount = reports.filter(
    (r) => r.status === 'in_progress',
  ).length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          An overview of the municipality activities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isAdminUser && (
          <StatCard
            title="Municipality Users"
            value={municipalityUsers.length}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-500/10"
          />
        )}

        <StatCard
          title="Total Reports"
          value={reports.length}
          icon={FileText}
          color="text-violet-600"
          bgColor="bg-violet-500/10"
        />

        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={Timer}
          color="text-amber-600"
          bgColor="bg-amber-500/10"
        />

        <StatCard
          title="Pending Approval"
          value={pendingCount}
          icon={AlertCircle}
          color="text-rose-600"
          bgColor="bg-rose-500/10"
        />
      </div>

      <div className="rounded-xl border bg-linear-to-br from-card to-muted/30 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Quick Actions
          </h2>
          <p className="text-lg text-muted-foreground mt-1">
            Perform common tasks quickly
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {isAdminUser && (
            <Button
              size="lg"
              className="h-12 rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer"
              onClick={() =>
                navigate('/app/municipality-users', {
                  state: { openCreateDialog: true },
                })
              }
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New User
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

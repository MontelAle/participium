import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { useReports } from '@/hooks/use-reports';
import {
  Users,
  FileText,
  Timer,
  AlertCircle,
  Plus,
  CheckCircle,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isAdminUser, user, isMunicipalPrOfficer, isTechnicalOfficer } =
    useAuth();
  const { data: municipalityUsers = [] } = isAdminUser
    ? useMunicipalityUsers()
    : { data: [] };

  const { data: reports = [] } = useReports();

  const inProgressCount = reports.filter(
    (r) => r.status === 'in_progress',
  ).length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const assignedCount = reports.filter((r) => r.status === 'assigned').length;
  const rejectedCount = reports.filter((r) => r.status === 'rejected').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  ////
  const inProgressCountUser = reports.filter(
    (r) => r.status === 'in_progress' && r.assignedOfficerId === user?.id,
  ).length;
  const assignedCountUser = reports.filter(
    (r) => r.status === 'assigned' && r.assignedOfficerId === user?.id,
  ).length;
  const resolvedCountUser = reports.filter(
    (r) => r.status === 'resolved' && r.assignedOfficerId === user?.id,
  ).length;
  ////

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
            value={
              municipalityUsers.filter((u) => u.role?.name !== 'admin').length
            }
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-500/10"
          />
        )}

        {!isTechnicalOfficer && (
          <>
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

            <StatCard
              title="Assigned"
              value={assignedCount}
              icon={UserCheck}
              color="text-purple-600"
              bgColor="bg-purple-500/10"
            />

            <StatCard
              title="Rejected"
              value={rejectedCount}
              icon={XCircle}
              color="text-red-600"
              bgColor="bg-red-500/10"
            />

            <StatCard
              title="Resolved"
              value={resolvedCount}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-500/10"
            />
          </>
        )}

        {isTechnicalOfficer && (
          <>
            <StatCard
              title="In Progress"
              value={inProgressCountUser}
              icon={Timer}
              color="text-amber-600"
              bgColor="bg-amber-500/10"
            />

            <StatCard
              title="Assigned"
              value={assignedCountUser}
              icon={UserCheck}
              color="text-purple-600"
              bgColor="bg-purple-500/10"
            />

            <StatCard
              title="Resolved"
              value={resolvedCountUser}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-500/10"
            />
          </>
        )}
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
          {isMunicipalPrOfficer && (
            <Button
              size="lg"
              className="h-12 rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer"
              onClick={() => navigate('/app/assign-reports')}
            >
              <Plus className="mr-2 h-5 w-5" />
              View Reports
            </Button>
          )}
          {isTechnicalOfficer && (
            <Button
              size="lg"
              className="h-12 rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer"
              onClick={() => navigate('/app/assigned-reports')}
            >
              <Plus className="mr-2 h-5 w-5" />
              View Reports
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import { ActionButton } from '@/components/dashboard/action-button';
import { StatCard } from '@/components/dashboard/stat-card';
import { useAuth } from '@/contexts/auth-context';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { useReportStats } from '@/hooks/use-reports';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Plus,
  Timer,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isAdminUser, isMunicipalPrOfficer, isTechnicalOfficer, isExternal } = useAuth();

  const { data: allUsers = [] } = useMunicipalityUsers();
  const municipalityUsers = isAdminUser ? allUsers : [];

  const { data: serverStats } = useReportStats();

  const stats = serverStats || {
    total: 0,
    pending: 0,
    in_progress: 0,
    assigned: 0,
    rejected: 0,
    resolved: 0,
    user_assigned: 0,
    user_rejected: 0,
    user_in_progress: 0,
    user_resolved: 0,
  };

  const statCardsConfig = [
    {
      title: 'Municipality Users',
      value: municipalityUsers.filter((u) => u.role?.name !== 'admin').length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      isVisible: isAdminUser,
    },
    {
      title: 'Total Reports',
      value: stats.total,
      icon: FileText,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
      isVisible: !isTechnicalOfficer,
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: Timer,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      isVisible: !isTechnicalOfficer && !isMunicipalPrOfficer,
    },
    {
      title: 'Pending Approval',
      value: stats.pending,
      icon: AlertCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-500/10',
      isVisible: !isTechnicalOfficer,
    },
    {
      title: isMunicipalPrOfficer ? 'My Assigned' : 'Assigned',
      value: isMunicipalPrOfficer ? stats.user_assigned : stats.assigned,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      isVisible: !isTechnicalOfficer,
    },
    {
      title: isMunicipalPrOfficer ? 'My Rejected' : 'Rejected',
      value: isMunicipalPrOfficer ? stats.user_rejected : stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      isVisible: !isTechnicalOfficer,
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      isVisible: !isTechnicalOfficer && !isMunicipalPrOfficer,
    },
    {
      title: 'My In Progress',
      value: stats.user_in_progress,
      icon: Timer,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      isVisible: isTechnicalOfficer,
    },
    {
      title: 'My Assigned',
      value: stats.user_assigned,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      isVisible: isTechnicalOfficer,
    },
    {
      title: 'My Resolved',
      value: stats.user_resolved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      isVisible: isTechnicalOfficer ,
    },
  ];

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
        {statCardsConfig
          .filter((card) => card.isVisible)
          .map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              bgColor={card.bgColor}
            />
          ))}
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
            <ActionButton
              icon={Plus}
              label="Create New User"
              onClick={() => navigate('/app/municipality-users/create')}
            />
          )}

          {isMunicipalPrOfficer && (
            <ActionButton
              icon={FileText}
              label="Assign Reports"
              onClick={() => navigate('/app/assign-reports')}
            />
          )}

          {isTechnicalOfficer && (
            <ActionButton
              icon={FileText}
              label="View My Reports"
              onClick={() => navigate('/app/assigned-reports')}
            />
          )}

          {isExternal && (
            <ActionButton
              icon={FileText} 
              label="View Reports"
              onClick={() => navigate('/app/external/assigned-reports')} 
            />  
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

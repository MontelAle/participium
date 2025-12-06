import { EditMunicipalityUserForm } from '@/components/municipality-users/edit-municipality-user-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

function MunicipalityUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: users, isLoading, isError } = useMunicipalityUsers();
  const user = users?.find((u) => u.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-lg text-gray-600 font-medium">
          Loading user...
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/municipality-users" replace />;
  }

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-4">
        <div className="flex flex-col gap-1 shrink-0">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="group pl-0 h-8 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer"
            >
              <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b md:border-b-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {user.firstName} {user.lastName}
              </h1>
              <Badge
                variant="outline"
                className={cn('text-sm px-3 py-1 font-semibold border')}
              >
                {user.role?.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 pb-2">
          <EditMunicipalityUserForm user={user} />
        </div>
      </div>
    </div>
  );
}

export default MunicipalityUserDetailsPage;

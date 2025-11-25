import { useLocation } from 'react-router-dom';
import * as React from 'react';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { UsersToolbar } from '@/components/municipality-users/user-toolbar';
import { MunicipalityUsersTable } from '@/components/municipality-users/municipality-users-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MunicipalityUsersPage = () => {
  const navigate = useNavigate();
  const { data: municipalUsers = [] } = useMunicipalityUsers();

  const [query, setQuery] = React.useState('');
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = React.useState<string[]>([]);

  const availableRoles = React.useMemo(() => {
    const names = new Set<string>();
    for (const u of municipalUsers) {
      if (u.role?.name && u.role.name !== 'admin') names.add(u.role.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [municipalUsers]);

  const availableOffices = React.useMemo(() => {
    const labels = new Set<string>();
    for (const u of municipalUsers) {
      if (u.office?.label) labels.add(u.office.label);
    }
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [municipalUsers]);

  const filteredData = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const byUsername = (u: any) =>
      !normalizedQuery ||
      String(u.username ?? '')
        .toLowerCase()
        .includes(normalizedQuery) ||
      String(u.email ?? '')
        .toLowerCase()
        .includes(normalizedQuery) ||
      String(u.firstName ?? '')
        .toLowerCase()
        .includes(normalizedQuery) ||
      String(u.lastName ?? '')
        .toLowerCase()
        .includes(normalizedQuery);

    const byRole = (u: any) =>
      selectedRoles.length === 0 || selectedRoles.includes(u.role?.name);

    const byOffice = (u: any) =>
      selectedOffices.length === 0 ||
      (u.office?.label && selectedOffices.includes(u.office.label));

    return municipalUsers
      .filter((u) => u.role?.name !== 'admin')
      .filter(byUsername)
      .filter(byRole)
      .filter(byOffice);
  }, [municipalUsers, query, selectedRoles, selectedOffices]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Municipality Users
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage system access, roles, and permissions
          </p>
        </div>
        <div className="shrink-0">
          <Button
            size="lg"
            className="gap-2 text-base font-medium shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate('create')}
          >
            <Plus className="size-5" />
            Add User
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <UsersToolbar
          query={query}
          onQueryChange={setQuery}
          selectedRoles={selectedRoles}
          onRolesChange={setSelectedRoles}
          availableRoles={availableRoles}
          selectedOffices={selectedOffices}
          onOfficesChange={setSelectedOffices}
          availableOffices={availableOffices}
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <MunicipalityUsersTable data={filteredData} />
      </div>
    </div>
  );
};

export default MunicipalityUsersPage;

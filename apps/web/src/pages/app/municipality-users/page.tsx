import { MunicipalityUsersTable } from './components/municipality-users-table';
import { CreateMunicipalityUserDialog } from './components/create-municipality-user-dialog';
import { useLocation } from 'react-router-dom';
import * as React from 'react';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { UsersToolbar } from './components/user-toolbar';

const MunicipalityUsersPage = () => {
  const location = useLocation();
  const { data: municipalUsers = [] } = useMunicipalityUsers();

  const [query, setQuery] = React.useState('');
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  const availableRoles = React.useMemo(() => {
    const names = new Set<string>();
    for (const u of municipalUsers) {
      if (u.role?.name && u.role.name !== 'admin') names.add(u.role.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [municipalUsers]);

  const filteredData = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const byUsername = (u: any) =>
      !normalizedQuery ||
      String(u.username ?? '')
        .toLowerCase()
        .includes(normalizedQuery);
    const byRole = (u: any) =>
      selectedRoles.length === 0 || selectedRoles.includes(u.role?.name);

    return municipalUsers
      .filter((u) => u.role?.name !== 'admin')
      .filter(byUsername)
      .filter(byRole);
  }, [municipalUsers, query, selectedRoles]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Municipality Users
        </h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <UsersToolbar
          query={query}
          onQueryChange={setQuery}
          selectedRoles={selectedRoles}
          onRolesChange={setSelectedRoles}
          availableRoles={availableRoles}
        />
        <div className="flex justify-end items-center">
          <CreateMunicipalityUserDialog
            openDialog={location.state?.openCreateDialog}
          />
        </div>
      </div>

      <MunicipalityUsersTable data={filteredData} />
    </div>
  );
};

export default MunicipalityUsersPage;

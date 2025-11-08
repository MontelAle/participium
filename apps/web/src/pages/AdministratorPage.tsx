import { MunicipalityUsersTable } from '@/components/municipality-users-table';
import { MunicipalityUsersDialog } from '@/components/municipality-users-dialog';
import {
  useMunicipalityUsers,
  useCreateMunicipalityUser,
} from '@/hooks/use-municipality-users';
import { useRoles } from '@/hooks/use-roles';

const AdministratorPage = () => {
  const {
    data: municipalityUsers = [],
    isLoading,
    error,
    refetch,
  } = useMunicipalityUsers();
  const { mutateAsync: createMunicipalityUser } = useCreateMunicipalityUser();
  const { data: roles = [] } = useRoles();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Municipality Users</h1>
        <MunicipalityUsersDialog
          onCreate={createMunicipalityUser}
          roles={roles}
        />
      </div>

      <MunicipalityUsersTable users={municipalityUsers} />
    </div>
  );
};

export default AdministratorPage;

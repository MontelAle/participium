import { MunicipalityUsersTable } from './components/municipality-users-table';
import { CreateMunicipalityUserDialog } from './components/create-municipality-user-dialog';

const MunicipalityUsersPage = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Municipality Users</h1>
        <CreateMunicipalityUserDialog />
      </div>

      <MunicipalityUsersTable />
    </div>
  );
};

export default MunicipalityUsersPage;

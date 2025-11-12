import { MunicipalityUsersTable } from './components/municipality-users-table';
import { CreateMunicipalityUserDialog } from './components/create-municipality-user-dialog';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const MunicipalityUsersPage = () => {
  const location = useLocation();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Municipality Users</h1>
        <CreateMunicipalityUserDialog
          openDialog={location.state?.openCreateDialog}
        />
      </div>

      <MunicipalityUsersTable />
    </div>
  );
};

export default MunicipalityUsersPage;

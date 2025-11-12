import { MunicipalityUsersTable } from './components/municipality-users-table';
import { CreateMunicipalityUserDialog } from './components/create-municipality-user-dialog';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const MunicipalityUsersPage = () => {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Municipality Users
        </h1>
      </div>
      <div className="flex justify-end items-center">
        <CreateMunicipalityUserDialog
          openDialog={location.state?.openCreateDialog}
        />
      </div>

      <MunicipalityUsersTable />
    </div>
  );
};

export default MunicipalityUsersPage;

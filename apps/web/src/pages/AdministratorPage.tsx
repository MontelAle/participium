import { useState } from 'react';
import { MunicipalityUsersTable } from '@/components/municipality-users-table';
import type { User } from '@repo/api';
import { MunicipalityUsersDialog } from '@/components/municipality-users-dialog';

const initialUsers: User[] = [
  {
    id: '1',
    username: 'mario.rossi',
    email: 'mario.rossi@example.com',
    firstName: 'Mario',
    lastName: 'Rossi',
    roleId: '01',
    role: {
      id: '01',
      name: 'admin',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    username: 'luigi.bianchi',
    email: 'luigi.bianchi@example.com',
    firstName: 'Luigi',
    lastName: 'Bianchi',
    roleId: '02',
    role: {
      id: '02',
      name: 'user',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const AdministratorPage = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Municipality Users</h1>
        <MunicipalityUsersDialog
          onCreate={(user) => setUsers([...users, user])}
        />
      </div>

      <MunicipalityUsersTable users={users} />
    </div>
  );
};

export default AdministratorPage;

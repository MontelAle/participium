/*
import { useState } from "react";
import { MunicipalityUserForm } from "@/components/municipalityUsers-form";
import { MunicipalityUsersTable } from "@/components/municipalityUsers-table";
import { MunicipalityUser } from "@/types/users";

const initialUsers: MunicipalityUser[] = [
  {
    id: "1",
    username: "mario.rossi",
    email: "mario.rossi@example.com",
    firstName: "Mario",
    lastName: "Rossi",
    role: "admin",
  },
  {
    id: "2",
    username: "luigi.bianchi",
    email: "luigi.bianchi@example.com",
    firstName: "Luigi",
    lastName: "Bianchi",
    role: "something",
  },
];

const AdministratorPage = () => {
  const [users, setUsers] = useState<MunicipalityUser[]>(initialUsers);

  const handleCreateUser = async (data: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    password: string;
  }) => {
    // Creiamo un nuovo utente senza password
    const newUser: MunicipalityUser = {
      id: (users.length + 1).toString(),
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    };

    // Aggiorniamo lo stato
    setUsers([...users, newUser]);

    return { success: true };
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <MunicipalityUsersTable users={users} />
      <MunicipalityUserForm onSubmit={handleCreateUser} />
    </div>
  );
};

export default AdministratorPage;

*/

import { useState } from "react";
import { MunicipalityUsersTable } from "@/components/municipalityUsers-table";
import { MunicipalityUser } from "@/types/users";
import { AddUserDialog } from "@/components/addMunicipalityUserDialog";

const initialUsers: MunicipalityUser[] = [
  {
    id: "1",
    username: "mario.rossi",
    email: "mario.rossi@example.com",
    firstName: "Mario",
    lastName: "Rossi",
    role: "admin",
  },
  {
    id: "2",
    username: "luigi.bianchi",
    email: "luigi.bianchi@example.com",
    firstName: "Luigi",
    lastName: "Bianchi",
    role: "something",
  },
];

const AdministratorPage = () => {
  const [users, setUsers] = useState<MunicipalityUser[]>(initialUsers);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Municipality Users</h1>
        <AddUserDialog onCreate={(user) => setUsers([...users, user])} />
      </div>

      <MunicipalityUsersTable users={users} />
    </div>
  );
};

export default AdministratorPage;

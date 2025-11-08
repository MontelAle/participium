import { MunicipalityUsersTable } from "@/components/municipalityUsers-table";
import { MunicipalityUser } from "@/types/users";

const users: MunicipalityUser[] = [
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
  return (
    <div>
      <MunicipalityUsersTable users={users} />
    </div>
  )
}

export default AdministratorPage;
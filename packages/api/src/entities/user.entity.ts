import { Office } from './office.entity';
import { Role } from './role.entity';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  officeId?: string;
  office?: Office;
}

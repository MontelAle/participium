import { Role } from './role.entity';
import { Office } from './office.entity';

export declare class User {
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

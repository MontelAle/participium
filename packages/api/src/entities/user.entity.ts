import { Role } from './role.entity';
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
}

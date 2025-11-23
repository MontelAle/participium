import { CreateMunicipalityUserDto, Role, User } from '@repo/api';

export type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};
export type CitizenSidebarProps = {
  width?: string;
};

export type AuthFormProps = React.ComponentProps<'div'> & {
  mode: 'login' | 'register';
};

export type MunicipalSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export type AddUserDialogProps = {
  onCreate: (data: CreateMunicipalityUserDto) => Promise<User>;
  roles: Role[];
};

export type CreateMunicipalityUserFormProps = {
  onSubmit: (data: CreateMunicipalityUserDto) => Promise<User>;
  onCancel?: () => void;
  roles: Role[];
};

export type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
};

export type MunicipalityUsersTableProps = {
  data: User[];
};

export type UsersToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  availableRoles: string[];
  selectedOffices: string[];
  onOfficesChange: (offices: string[]) => void;
  availableOffices: string[];

  className?: string;
};

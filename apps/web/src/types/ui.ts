import type { CreateMunicipalityUserDto, Report, Role, User } from '@/types';
import { LucideIcon } from 'lucide-react';
import { ComponentProps, ElementType, type ReactNode } from 'react';

export type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};
export type CitizenSidebarProps = {
  width?: string;
};

export type AuthFormProps = ComponentProps<'div'> & {
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
  icon: ElementType;
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

export type MunicipalGuardProps = Readonly<{
  children: ReactNode;
}>;

export type CitizenGuardProps = Readonly<{
  children: ReactNode;
}>;

export type DateCheckStrategy = (date: Date, today: Date) => boolean;

export type ActionButtonProps = {
  label: string;
  onClick: () => void;
  icon: LucideIcon;
  className?: string;
  disabled?: boolean;
};

export type ReportLightboxProps = {
  images: string[];
  selectedIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export type ReportContentLayoutProps = {
  report: Report;
  showAnonymous?: boolean;
  categoryOverride?: ReactNode;
  afterCategoryContent?: ReactNode;
  afterDescriptionContent?: ReactNode;
  sidebarActions?: ReactNode;
  className?: string;
};

export type ReportDetailLayoutProps = {
  report: Report | undefined | null;
  isLoading: boolean;
  isError: boolean;
  children: ReactNode;
  fallbackRoute?: string;
};

export type FilterPopoverProps = {
  title: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  icon?: LucideIcon;
  formatLabel?: (label: string) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  width?: string;
};

export type ReviewReportFormProps = {
  report: Report;
  onClose?: () => void;
  className?: string;
};

export type ReportViewProps = {
  report: Report;
  showAnonymous?: boolean;
  className?: string;
};

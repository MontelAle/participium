import type {
  Category,
  Office,
  Profile,
  Report,
  ReportStatus,
  Role,
  Session,
  User,
} from './entities';

export type ResponseDto = {
  success: boolean;
};

export type RegisterDto = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type LoginDto = {
  username: string;
  password: string;
};

export type LoginResponseDto = ResponseDto & {
  data: {
    user: User;
    session: Partial<Session>;
  };
};

export type LogoutResponseDto = ResponseDto;

export type CategoriesResponseDto = ResponseDto & {
  data: Category[];
};

export type UpdateMunicipalityUserDto = {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  officeId?: string;
};

export type CreateMunicipalityUserDto = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
  officeId?: string;
};

export type MunicipalityUserResponseDto = ResponseDto & {
  data: User;
};

export type MunicipalityUsersResponseDto = ResponseDto & {
  data: User[];
};

export type MunicipalityUserIdResponseDto = ResponseDto & {
  data: { id: string };
};

export type OfficesResponseDto = {
  success: boolean;
  data: Office[];
};

export type CreateReportDto = {
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  address?: string;
  categoryId: string;
  isAnonymous?: boolean;
};

export type UpdateReportDto = {
  title?: string;
  description?: string;
  status?: ReportStatus;
  longitude?: number;
  latitude?: number;
  address?: string;
  images?: string[];
  categoryId?: string;
  explanation?: string;
  assignedOfficerId?: string;
  assignedExternalMaintainerId?: string;
};

export type FilterReportsDto = {
  status?: ReportStatus;
  categoryId?: string;
  userId?: string;
  minLongitude?: number;
  maxLongitude?: number;
  minLatitude?: number;
  maxLatitude?: number;
  searchLongitude?: number;
  searchLatitude?: number;
  radiusMeters?: number;
};

export type ReportsResponseDto = ResponseDto & {
  data: Report[];
};

export type ReportResponseDto = ResponseDto & {
  data: Report;
};

export type DashboardStatsDto = {
  total: number;
  pending: number;
  in_progress: number;
  assigned: number;
  rejected: number;
  resolved: number;
  user_assigned: number;
  user_rejected: number;
  user_in_progress: number;
  user_resolved: number;
};

export type DashboardStatsResponseDto = ResponseDto & {
  data: DashboardStatsDto;
};

export type RolesResponseDto = ResponseDto & {
  data: Role[];
};

export type UpdateProfileDto = {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
  emailNotificationsEnabled?: string;
};

export type ProfileResponseDto = ResponseDto & {
  data: Profile;
};

export type CreateCommentDto = {
  content: string;
};

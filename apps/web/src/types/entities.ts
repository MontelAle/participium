export type Account = {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  user: User;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MultiPolygon = {
  type: 'MultiPolygon';
  coordinates: number[][][][];
};

export type Boundary = {
  id: string;
  name: string;
  label: string;
  geometry: MultiPolygon;
};

export type Category = {
  id: string;
  name: string;
  office: Office;
  externalOffice?: Office;
};

export type Office = {
  id: string;
  name: string;
  label: string;
  isExternal: boolean;
  categories: Category[];
};

export type Point = {
  type: 'Point';
  coordinates: [number, number];
};

export type Profile = {
  id: string;
  telegramUsername?: string | null;
  emailNotificationsEnabled: boolean;
  profilePictureUrl?: string | null;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'assigned';

export type Report = {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  location: Point;
  address?: string;
  images?: string[];
  userId: string;
  user: User;
  isAnonymous: boolean;
  categoryId: string;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
  explanation?: string;
  assignedOfficerId?: string;
  assignedOfficer?: User;
  assignedExternalMaintainerId?: string;
  assignedExternalMaintainer?: User;
};

export type Role = {
  id: string;
  name: string;
  label: string;
  isMunicipal: boolean;
};

export type Session = {
  id: string;
  expiresAt: Date;
  hashedSecret: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
  user: User;
  impersonatedBy?: string;
};

export type User = {
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
};

export type Comment = {
  id: string;
  content: string;
  userId: string;
  user: User;
  reportId: string;
  report: Report;
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  id: string;
  content: string;
  userId: string;
  user: User;
  reportId: string;
  report: Report;
  createdAt: Date;
  updatedAt: Date;
};

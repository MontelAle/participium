import { Point } from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ASSIGNED = 'assigned',
}

export interface Report {
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
}

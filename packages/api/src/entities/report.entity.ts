import { Point } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

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
  categoryId: string;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
  explanation?: string;
  assignedOfficerId?: string;
  assignedOfficer?: User;
}

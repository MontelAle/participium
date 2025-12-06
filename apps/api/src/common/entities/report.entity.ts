import type { Report as ReportType } from '@repo/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Point,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ASSIGNED = 'assigned',
}

@Entity('report')
export class Report implements ReportType {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar', { nullable: true })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;

  @Column('varchar', { nullable: true })
  address?: string;

  @Column('varchar', { array: true })
  images: string[];

  @Column('varchar')
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column('varchar', { nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column('text', { nullable: true })
  explanation: string;

  @Column('varchar', { nullable: true })
  assignedOfficerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedOfficerId' })
  assignedOfficer?: User;
}

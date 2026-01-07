import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Report } from './report.entity';
import { User } from './user.entity';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('varchar')
  type: string;

  @Column('text', { nullable: true })
  message?: string;

  @Column('varchar', { nullable: true })
  reportId?: string;

  @ManyToOne(() => Report, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report?: Report;

  @Column('boolean', { default: false })
  read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

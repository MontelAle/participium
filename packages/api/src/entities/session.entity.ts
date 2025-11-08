import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('session')
export class Session {
  @PrimaryColumn('varchar')
  id: string;

  @Column('timestamp')
  expiresAt: Date;

  @Column('varchar', { unique: true })
  token: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column('varchar', { nullable: true })
  ipAddress?: string;

  @Column('varchar', { nullable: true })
  userAgent?: string;

  @Column('varchar')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('varchar', { nullable: true })
  impersonatedBy?: string;
}

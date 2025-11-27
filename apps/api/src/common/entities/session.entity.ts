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
import { Exclude } from 'class-transformer';
import { Session as SessionInterface } from '@repo/api';

@Entity('session')
export class Session implements SessionInterface {
  @PrimaryColumn('varchar')
  id: string;

  @Column('timestamptz')
  expiresAt: Date;

  @Column('varchar')
  @Exclude()
  hashedSecret: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
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

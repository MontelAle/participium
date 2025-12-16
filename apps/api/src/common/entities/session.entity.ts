import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('session')
export class Session {
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

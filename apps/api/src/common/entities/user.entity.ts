import type { User as UserType } from '@repo/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Office } from './office.entity';
import { Role } from './role.entity';

@Entity('user')
export class User implements UserType {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ unique: true, nullable: false })
  username: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: false })
  roleId: string;

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  officeId: string;

  @ManyToOne(() => Office, { nullable: true })
  @JoinColumn({ name: 'officeId' })
  office: Office;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

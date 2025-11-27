import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User as UserInterface } from '@repo/api';
import { Role } from './role.entity';
import { Office } from './office.entity';

@Entity('user')
export class User implements UserInterface {
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

  @Column({ nullable: true })
  telegramUsername: string | null;

  @Column({ default: false })
  emailNotificationsEnabled: boolean;

  @Column({ nullable: true })
  profilePictureUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

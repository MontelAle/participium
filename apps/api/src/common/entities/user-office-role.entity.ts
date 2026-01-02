import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Office } from './office.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('user_office_role')
@Index(['userId', 'officeId'], { unique: true })
export class UserOfficeRole {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('varchar')
  officeId: string;

  @ManyToOne(() => Office, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'officeId' })
  office: Office;

  @Column('varchar')
  roleId: string;

  @ManyToOne(() => Role, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

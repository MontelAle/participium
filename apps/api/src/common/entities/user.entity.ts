import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Office } from './office.entity';
import { Role } from './role.entity';
import { UserOfficeRole } from './user-office-role.entity';

@Entity('user')
export class User {
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

  /**
   * @deprecated Use officeRoles relation instead for multi-role support
   * Kept for backward compatibility during transition period
   */
  @Column({ nullable: false })
  roleId: string;

  /**
   * @deprecated Use officeRoles relation instead for multi-role support
   * Kept for backward compatibility during transition period
   */
  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  /**
   * @deprecated Use officeRoles relation instead for multi-role support
   * Kept for backward compatibility during transition period
   */
  @Column({ nullable: true })
  officeId: string;

  /**
   * @deprecated Use officeRoles relation instead for multi-role support
   * Kept for backward compatibility during transition period
   */
  @ManyToOne(() => Office, { nullable: true })
  @JoinColumn({ name: 'officeId' })
  office: Office;

  @OneToMany(() => UserOfficeRole, (userOfficeRole) => userOfficeRole.user, {
    cascade: true,
  })
  officeRoles: UserOfficeRole[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

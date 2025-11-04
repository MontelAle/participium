import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('account')
export class Account {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  accountId: string;

  @Column('text')
  providerId: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column('text', { nullable: true })
  password?: string;

  @CreateDateColumn({ type: 'date' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'date' })
  updatedAt: Date;

  
}

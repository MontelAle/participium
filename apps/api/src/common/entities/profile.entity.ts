import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Profile as ProfileInterface } from '@repo/api';
import { User } from './user.entity';

@Entity('profile')
export class Profile implements ProfileInterface {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

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

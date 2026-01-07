import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('profile')
export class Profile {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @OneToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  telegramUsername: string | null;

  @Column({ nullable: true, unique: true })
  telegramId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  telegramLinkedAt: Date | null;

  @Column({ default: true })
  emailNotificationsEnabled: boolean;

  @Column({ nullable: true })
  profilePictureUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

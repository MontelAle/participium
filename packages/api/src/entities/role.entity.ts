import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('role')
export class Role {
  @PrimaryColumn('text')
  roleId: string;

  @Column('text')
  name: string;
}

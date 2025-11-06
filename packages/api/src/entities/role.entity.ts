import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity('role')
export class Role {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string;
}

import { Role as RoleInterface } from '@repo/api';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('role')
export class Role implements RoleInterface {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  label: string;

  @Column('boolean', { default: false })
  isMunicipal: boolean;
}

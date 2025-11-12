import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('role')
export class Role {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('boolean', { default: false })
  isMunicipal: boolean;
}

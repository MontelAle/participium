import { Entity, PrimaryColumn, Column } from 'typeorm';
import { Office as OfficeInterface } from '@repo/api';

@Entity('office')
export class Office implements OfficeInterface {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  label: string;
}

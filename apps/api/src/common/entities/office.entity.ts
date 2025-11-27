import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Office as OfficeInterface } from '@repo/api';
import { Category } from './category.entity';

@Entity('office')
export class Office implements OfficeInterface {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  label: string;

  @OneToMany(() => Category, (category) => category.office)
  categories: Category[];
}

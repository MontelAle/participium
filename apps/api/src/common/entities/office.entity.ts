import type { Office as OfficeType } from '@repo/api';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Category } from './category.entity';

@Entity('office')
export class Office implements OfficeType {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  label: string;

  @OneToMany(() => Category, (category) => category.office)
  categories: Category[];
}

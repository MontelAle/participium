import { Entity, PrimaryColumn, Column } from 'typeorm';
import { Category as CategoryInterface } from '@repo/api';

@Entity('category')
export class Category implements CategoryInterface {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;
}

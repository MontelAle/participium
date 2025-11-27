import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Category as CategoryInterface } from '@repo/api';
import { Office } from './office.entity';

@Entity('category')
export class Category implements CategoryInterface {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @ManyToOne(() => Office, (office) => office.categories)
  office: Office;
}

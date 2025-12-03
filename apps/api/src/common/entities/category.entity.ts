import { Category as CategoryInterface } from '@repo/api';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
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

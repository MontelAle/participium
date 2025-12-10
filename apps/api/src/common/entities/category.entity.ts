import type { Category as CategoryType } from '@repo/api';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Office } from './office.entity';

@Entity('category')
export class Category implements CategoryType {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @ManyToOne(() => Office, (office) => office.categories)
  office: Office;

  @ManyToOne(() => Office, { nullable: true })
  externalOffice?: Office;
}

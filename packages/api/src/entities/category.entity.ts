import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;
}

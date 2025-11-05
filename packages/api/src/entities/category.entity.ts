import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity ('category')
export class Category {
  @PrimaryColumn('text')
  categoryId: string;

  @Column('text')
  name: string;
}

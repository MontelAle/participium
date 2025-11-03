import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity('accounts')
export class Account{
  @PrimaryGeneratedColumn()
  id: number;  

  @Column({ nullable: false })
  password: string;
}
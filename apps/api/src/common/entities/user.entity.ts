import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true , nullable: false })
  email: string;

  @Column({ unique: true , nullable: false  })
  username: string;

  @Column({nullable: false})
  firstName: string;

  @Column({nullable: false})
  lastName: string;
  
}

import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('telegram_link_code')
export class TelegramLinkCode {
  @PrimaryColumn('varchar')
  code: string;

  @Column('varchar')
  telegramId: string;

  @Column('varchar')
  telegramUsername: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @Column('varchar', { nullable: true })
  userId: string | null;
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../common/entities/account.entity';
import { Category } from '../../common/entities/category.entity';
import { Office } from '../../common/entities/office.entity';
import { Profile } from '../../common/entities/profile.entity';
import { Report } from '../../common/entities/report.entity';
import { Role } from '../../common/entities/role.entity';
import { Session } from '../../common/entities/session.entity';
import { User } from '../../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<'postgres'>('db.type'),
        host: configService.get<string>('db.host'),
        port: configService.get<number>('db.port'),
        username: configService.get<string>('db.username'),
        password: configService.get<string>('db.password'),
        database: configService.get<string>('db.database'),
        entities: [
          User,
          Session,
          Role,
          Category,
          Account,
          Report,
          Office,
          Profile,
        ],
        synchronize: configService.get<string>('app.env') !== 'production',
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

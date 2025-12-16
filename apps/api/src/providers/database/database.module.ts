import {
  Account,
  Boundary,
  Category,
  Office,
  Profile,
  Report,
  Role,
  Session,
  User,
} from '@entities';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
          Boundary,
        ],
        synchronize: configService.get<string>('app.env') !== 'production',
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

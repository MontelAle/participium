import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { DataSource } from 'typeorm';
import { User, Account, Role } from '@repo/api';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { faker, fi } from '@faker-js/faker';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  // Seed role
  const role = await dataSource.getRepository(Role).save({
    roleId: '1',
    name: 'user',
    description: 'Standard user role',
  });

  console.log(`✅ Seeded role: ${role.name}`);

  // Seed user
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = faker.internet.username({ firstName });
  const email = `${firstName.toLowerCase()}@example.com`;
  const password = 'password';

  const user = await dataSource.getRepository(User).save({
    id: nanoid(32),
    firstName,
    lastName,
    username,
    email,
    role: role,
  });

  // Seed account
  await dataSource.getRepository(Account).save({
    id: nanoid(32),
    user,
    providerId: 'local',
    accountId: user.email,
    password: await bcrypt.hash(password, 10),
  });

  console.log(`✅ Seeded user: ${email} / password: ${password}`);
  await app.close();
}

runSeed().catch((err) => {
  console.error('❌ Error seeding database', err);
  process.exit(1);
});
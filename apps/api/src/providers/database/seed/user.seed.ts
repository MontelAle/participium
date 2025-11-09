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

  // Seed roles
  let userRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'user' } });
  if (!userRole) {
    userRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'user' });
    userRole = await dataSource.getRepository(Role).save(userRole);
  }

  let adminRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'admin' });
    adminRole = await dataSource.getRepository(Role).save(adminRole);
  }

  console.log(`✅ Seeded roles: ${userRole.name}, ${adminRole.name}`);

  // Seed admin user
  const adminFirstName = 'Admin';
  const adminLastName = 'User';
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const adminUser = await dataSource.getRepository(User).save({
    id: nanoid(),
    firstName: adminFirstName,
    lastName: adminLastName,
    username: adminUsername,
    email: adminEmail,
    role: adminRole,
  });

  await dataSource.getRepository(Account).save({
    id: nanoid(),
    user: adminUser,
    providerId: 'local',
    accountId: adminUser.email,
    password: await bcrypt.hash(adminPassword, 10),
  });

  console.log(
    `✅ Seeded admin user: ${adminEmail} / password: ${adminPassword}`,
  );

  // Seed regular user
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = faker.internet.username({ firstName });
  const email = `${firstName.toLowerCase()}@example.com`;
  const password = 'password';

  const user = await dataSource.getRepository(User).save({
    id: nanoid(),
    firstName,
    lastName,
    username,
    email,
    role: userRole,
  });

  // Seed account
  await dataSource.getRepository(Account).save({
    id: nanoid(),
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

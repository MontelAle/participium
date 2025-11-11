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

  let municipalPRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'municipal_pr_officer' } });
  if (!municipalPRole) {
    municipalPRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'municipal_pr_officer' });
    municipalPRole = await dataSource.getRepository(Role).save(municipalPRole);
  }

  let municipalAdminRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'municipal_administrator' } });
  if (!municipalAdminRole) {
    municipalAdminRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'municipal_administrator' });
    municipalAdminRole = await dataSource.getRepository(Role).save(municipalAdminRole);
  }

  let technicalOfficerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'technical_officer' } });
  if (!technicalOfficerRole) {
    technicalOfficerRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'technical_officer' });
    technicalOfficerRole = await dataSource.getRepository(Role).save(technicalOfficerRole);
  }

  let transportOfficerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'transport_officer' } });
  if (!transportOfficerRole) {
    transportOfficerRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'transport_officer' });
    transportOfficerRole = await dataSource.getRepository(Role).save(transportOfficerRole);
  }

  let SpecialProjectsRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'special_projects_officer' } });
  if (!SpecialProjectsRole) {
    SpecialProjectsRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'special_projects_officer' });
    SpecialProjectsRole = await dataSource.getRepository(Role).save(SpecialProjectsRole);
  }

  let environmentalOfficerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'environmental_officer' } });
  if (!environmentalOfficerRole) {
    environmentalOfficerRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'environmental_officer' });
    environmentalOfficerRole = await dataSource.getRepository(Role).save(environmentalOfficerRole);
  }

  console.log(`✅ Seeded roles: 
    ${userRole.name}, ${adminRole.name}, 
    ${municipalPRole.name}, ${municipalAdminRole.name}, 
    ${technicalOfficerRole.name}, ${transportOfficerRole.name}, 
    ${SpecialProjectsRole.name}, ${environmentalOfficerRole.name}`);

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

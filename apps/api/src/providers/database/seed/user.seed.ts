import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { DataSource } from 'typeorm';
import { Role } from '../../../common/entities/role.entity';
import { User } from '../../../common/entities/user.entity';
import { Account } from '../../../common/entities/account.entity';
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
      .create({ id: nanoid(), name: 'user', label: 'User' });
    userRole = await dataSource.getRepository(Role).save(userRole);
  }

  let adminRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = dataSource.getRepository(Role).create({
      id: nanoid(),
      name: 'admin',
      isMunicipal: true,
      label: 'Administrator',
    });
    adminRole = await dataSource.getRepository(Role).save(adminRole);
  }

  let officeManagerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'office_manager' } });
  if (!officeManagerRole) {
    officeManagerRole = dataSource.getRepository(Role).create({
      id: nanoid(),
      name: 'office_manager',
      isMunicipal: true,
      label: 'Office Manager',
    });
    officeManagerRole = await dataSource
      .getRepository(Role)
      .save(officeManagerRole);
  }

  let officeWorkerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'office_worker' } });
  if (!officeWorkerRole) {
    officeWorkerRole = dataSource.getRepository(Role).create({
      id: nanoid(),
      name: 'office_worker',
      isMunicipal: true,
      label: 'Office Worker',
    });
    officeWorkerRole = await dataSource
      .getRepository(Role)
      .save(officeWorkerRole);
  }

  // Seed offices
  let waterSupplyOffice = await dataSource
    .getRepository('office')
    .findOne({ where: { name: 'Water Supply' } });
  if (!waterSupplyOffice) {
    waterSupplyOffice = dataSource.getRepository('office').create({
      id: nanoid(),
      name: 'water-supply',
      label: 'Water Supply',
    });
    waterSupplyOffice = await dataSource
      .getRepository('office')
      .save(waterSupplyOffice);
  }

  let architecturalBarriersOffice = await dataSource
    .getRepository('office')
    .findOne({ where: { name: 'Architectural Barriers' } });
  if (!architecturalBarriersOffice) {
    architecturalBarriersOffice = dataSource.getRepository('office').create({
      id: nanoid(),
      name: 'architectural-barriers',
      label: 'Architectural Barriers',
    });
    architecturalBarriersOffice = await dataSource
      .getRepository('office')
      .save(architecturalBarriersOffice);
  }

  let sewerSystemOffice = await dataSource
    .getRepository('office')
    .findOne({ where: { name: 'Sewer System' } });
  if (!sewerSystemOffice) {
    sewerSystemOffice = dataSource.getRepository('office').create({
      id: nanoid(),
      name: 'sewer-system',
      label: 'Sewer System',
    });
    sewerSystemOffice = await dataSource
      .getRepository('office')
      .save(sewerSystemOffice);
  }

  let publicLightingOffice = await dataSource
    .getRepository('office')
    .findOne({ where: { name: 'Public Lighting' } });
  if (!publicLightingOffice) {
    publicLightingOffice = dataSource.getRepository('office').create({
      id: nanoid(),
      name: 'public-lighting',
      label: 'Public Lighting',
    });
    publicLightingOffice = await dataSource
      .getRepository('office')
      .save(publicLightingOffice);
  }

  let wasteOffice = await dataSource
    .getRepository('office')
    .findOne({ where: { name: 'Waste' } });
  if (!wasteOffice) {
    wasteOffice = dataSource.getRepository('office').create({
      id: nanoid(),
      name: 'waste',
      label: 'Waste',
    });
    wasteOffice = await dataSource.getRepository('office').save(wasteOffice);
  }

  let roadsOffice = await dataSource
    .getRepository('office')
    .findOne({ where: { name: 'Roads' } });
  if (!roadsOffice) {
    roadsOffice = dataSource.getRepository('office').create({
      id: nanoid(),
      name: 'roads',
      label: 'Roads',
    });
    roadsOffice = await dataSource.getRepository('office').save(roadsOffice);
  }

  let parksOffice = await dataSource
    .getRepository('office')
    .findOne({ where: { name: 'Parks' } });
  if (!parksOffice) {
    parksOffice = dataSource.getRepository('office').create({
      id: nanoid(),
      name: 'parks',
      label: 'Parks',
    });
    parksOffice = await dataSource.getRepository('office').save(parksOffice);
  }

  // Seed admin user
  const adminFirstName = 'Admin';
  const adminLastName = 'User';
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  let adminUser = await dataSource
    .getRepository(User)
    .findOne({ where: { username: adminUsername } });
  if (!adminUser) {
    adminUser = await dataSource.getRepository(User).save({
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
      accountId: adminUser.username,
      password: await bcrypt.hash(adminPassword, 10),
    });

    console.log(
      `✅ Seeded admin\n username: ${adminUsername} / password: ${adminPassword}`,
    );
  } else {
    console.log(`ℹ️ Admin user already exists: ${adminUsername}`);
  }

  // ...existing code...
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
    accountId: user.username,
    password: await bcrypt.hash(password, 10),
  });

  console.log(`✅ Seeded user\n username: ${username} / password: ${password}`);
  await app.close();
}

runSeed().catch((err) => {
  console.error('❌ Error seeding database', err);
  process.exit(1);
});
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { DataSource } from 'typeorm';
import { Role } from '../../../common/entities/role.entity';
import { User } from '../../../common/entities/user.entity';
import { Account } from '../../../common/entities/account.entity';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { faker, fi } from '@faker-js/faker';

//
import { Category } from '../../../common/entities/category.entity';
//

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
      .create({ id: nanoid(), name: 'admin', isMunicipal: true });
    adminRole = await dataSource.getRepository(Role).save(adminRole);
  }

  let municipalPRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'municipal_pr_officer' } });
  if (!municipalPRole) {
    municipalPRole = dataSource.getRepository(Role).create({
      id: nanoid(),
      name: 'municipal_pr_officer',
      isMunicipal: true,
    });
    municipalPRole = await dataSource.getRepository(Role).save(municipalPRole);
  }

  let municipalAdminRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'municipal_administrator' } });
  if (!municipalAdminRole) {
    municipalAdminRole = dataSource.getRepository(Role).create({
      id: nanoid(),
      name: 'municipal_administrator',
      isMunicipal: true,
    });
    municipalAdminRole = await dataSource
      .getRepository(Role)
      .save(municipalAdminRole);
  }

  let technicalOfficerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'technical_officer' } });
  if (!technicalOfficerRole) {
    technicalOfficerRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'technical_officer', isMunicipal: true });
    technicalOfficerRole = await dataSource
      .getRepository(Role)
      .save(technicalOfficerRole);
  }

  let transportOfficerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'transport_officer' } });
  if (!transportOfficerRole) {
    transportOfficerRole = dataSource
      .getRepository(Role)
      .create({ id: nanoid(), name: 'transport_officer', isMunicipal: true });
    transportOfficerRole = await dataSource
      .getRepository(Role)
      .save(transportOfficerRole);
  }

  let SpecialProjectsRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'special_projects_officer' } });
  if (!SpecialProjectsRole) {
    SpecialProjectsRole = dataSource.getRepository(Role).create({
      id: nanoid(),
      name: 'special_projects_officer',
      isMunicipal: true,
    });
    SpecialProjectsRole = await dataSource
      .getRepository(Role)
      .save(SpecialProjectsRole);
  }

  let environmentalOfficerRole = await dataSource
    .getRepository(Role)
    .findOne({ where: { name: 'environmental_officer' } });
  if (!environmentalOfficerRole) {
    environmentalOfficerRole = dataSource.getRepository(Role).create({
      id: nanoid(),
      name: 'environmental_officer',
      isMunicipal: true,
    });
    environmentalOfficerRole = await dataSource
      .getRepository(Role)
      .save(environmentalOfficerRole);
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
    accountId: adminUser.username,
    password: await bcrypt.hash(adminPassword, 10),
  });

  console.log(
    `✅ Seeded admin\n username: ${adminUsername} / password: ${adminPassword}`,
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

/////////////////////////////////////////////////
//category 
const categories = [
  'Water Supply Drinking Water',
  'Architectural Barriers',
  'Sewer System',
  'Public Lighting',
  'Waste',
  'Road Signs and Traffic Lights',
  'Roads and Urban Furnishings',
  'Public Green Areas and Playgrounds',
  'Other',
];

async function runCategorySeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  for (const name of categories) {
    let existing = await dataSource
      .getRepository(Category)
      .findOne({ where: { name } });

    if (!existing) {
      const category = dataSource.getRepository(Category).create({
        id: nanoid(),
        name,
      });
      await dataSource.getRepository(Category).save(category);
    }
  }

  console.log(`✅ Seeded categories: ${categories.join(', ')}`);
  await app.close();
}

runCategorySeed().catch((err) => {
  console.error('❌ Error seeding categories', err);
  process.exit(1);
});

export { runCategorySeed };
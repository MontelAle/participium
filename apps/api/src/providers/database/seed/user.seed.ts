import { DataSource } from 'typeorm';
import { Role } from '../../../common/entities/role.entity';
import { User } from '../../../common/entities/user.entity';
import { Account } from '../../../common/entities/account.entity';
import { Category } from '../../../common/entities/category.entity';
import { Report, ReportStatus } from '../../../common/entities/report.entity';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const TORINO_LAT = 45.0703;
const TORINO_LNG = 7.6869;

export async function seedDatabase(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const accountRepo = dataSource.getRepository(Account);
  const categoryRepo = dataSource.getRepository(Category);
  const reportRepo = dataSource.getRepository(Report);

  const rolesData = [
    { name: 'user', isMunicipal: false },
    { name: 'admin', isMunicipal: true },
    { name: 'municipal_pr_officer', isMunicipal: true },
    { name: 'municipal_administrator', isMunicipal: true },
    { name: 'technical_officer', isMunicipal: true },
    { name: 'transport_officer', isMunicipal: true },
    { name: 'special_projects_officer', isMunicipal: true },
    { name: 'environmental_officer', isMunicipal: true },
  ];

  const rolesMap = new Map<string, Role>();

  for (const r of rolesData) {
    let role = await roleRepo.findOne({ where: { name: r.name } });
    if (!role) {
      role = roleRepo.create({
        id: nanoid(),
        name: r.name,
        isMunicipal: r.isMunicipal,
      });
      await roleRepo.save(role);
    }
    rolesMap.set(r.name, role);
  }

  const categoriesData = [
    { name: 'Road Maintenance', description: 'Potholes, damaged asphalt' },
    {
      name: 'Waste Management',
      description: 'Overflowing bins, abandoned waste',
    },
    { name: 'Public Lighting', description: 'Broken street lamps' },
    { name: 'Vandalism', description: 'Graffiti, broken benches' },
    { name: 'Green Areas', description: 'Uncut grass, fallen trees' },
  ];

  const categories: Category[] = [];
  for (const c of categoriesData) {
    let category = await categoryRepo.findOne({ where: { name: c.name } });
    if (!category) {
      category = categoryRepo.create({
        id: nanoid(),
        name: c.name,
      });
      await categoryRepo.save(category);
    }
    categories.push(category);
  }

  const createUser = async (
    username: string,
    roleName: string,
    firstName: string,
    lastName: string,
  ) => {
    let user = await userRepo.findOne({ where: { username } });

    if (!user) {
      user = userRepo.create({
        id: nanoid(),
        firstName,
        lastName,
        username,
        email: `${username}@example.com`,
        role: rolesMap.get(roleName),
      });
      await userRepo.save(user);

      await accountRepo.save({
        id: nanoid(),
        user,
        providerId: 'local',
        accountId: username,
        password: await bcrypt.hash('password', 10),
      });
    }
    return user;
  };

  const adminUser = await createUser('admin', 'admin', 'Super', 'Admin');
  const regularUser = await createUser('user', 'user', 'Mario', 'Rossi');
  const municipalUser = await createUser(
    'officer',
    'municipal_administrator',
    'Luigi',
    'Verdi',
  );

  const reportsCount = await reportRepo.count();

  if (reportsCount < 5) {
    const reportsToCreate = 20;
    const newReports: Report[] = [];

    for (let i = 0; i < reportsToCreate; i++) {
      const lat = TORINO_LAT + (Math.random() - 0.5) * 0.04;
      const lng = TORINO_LNG + (Math.random() - 0.5) * 0.04;

      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];
      const isPending = Math.random() > 0.5;

      const report = reportRepo.create({
        id: nanoid(),
        title: faker.lorem.sentence(3),
        description: faker.lorem.paragraph(),
        status: isPending ? ReportStatus.PENDING : ReportStatus.RESOLVED,
        address: 'Torino, Italy',
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        images: [faker.image.url()],
        user: regularUser,
        category: randomCategory,
      });

      newReports.push(report);
    }

    await reportRepo.save(newReports);
  } else {
    console.log(
      `Reports already present (${reportsCount}). Skipping generation.`,
    );
  }

  console.log(' Database seed check completed.');
}

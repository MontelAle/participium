import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { DataSource, Repository } from 'typeorm';
import { Account } from '../../../common/entities/account.entity';
import { Boundary } from '../../../common/entities/boundary.entity';
import { Category } from '../../../common/entities/category.entity';
import { Office } from '../../../common/entities/office.entity';
import { Report, ReportStatus } from '../../../common/entities/report.entity';
import { Role } from '../../../common/entities/role.entity';
import { User } from '../../../common/entities/user.entity';
import { MinioProvider } from '../../minio/minio.provider';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Profile } from '../../../common/entities/profile.entity';
import { randomInt } from 'node:crypto';

// ============================================================================
// Constants
// ============================================================================

const OFFICES_DATA = [
  { name: 'maintenance', label: 'Maintenance and Technical Services' },
  { name: 'infrastructure', label: 'Infrastructure' },
  { name: 'public_services', label: 'Local Public Services' },
  { name: 'environment', label: 'Environment Quality' },
  { name: 'green_parks', label: 'Green Areas and Parks' },
  { name: 'civic_services', label: 'Decentralization and Civic Services' },
  { name: 'organization_office', label: 'Organization Office' },
];

const BOUNDARIES_DATA = [
  { name: 'torino', label: 'Comune di Torino' },
];

const CATEGORIES_DATA = [
  { name: 'Roads and Urban Furnishings', office: 'maintenance' },
  { name: 'Architectural Barriers', office: 'maintenance' },
  { name: 'Road Signs and Traffic Lights', office: 'infrastructure' },
  { name: 'Public Lighting', office: 'infrastructure' },
  { name: 'Water Supply – Drinking Water', office: 'public_services' },
  { name: 'Sewer System', office: 'public_services' },
  { name: 'Waste', office: 'environment' },
  { name: 'Public Green Areas and Playgrounds', office: 'green_parks' },
  { name: 'Other', office: 'civic_services' },
];

const ROLES_DATA = [
  { name: 'user', label: 'User', isMunicipal: false },
  { name: 'admin', label: 'Admin', isMunicipal: true },
  { name: 'pr_officer', label: 'PR Officer', isMunicipal: true },
  { name: 'tech_officer', label: 'Technical Officer', isMunicipal: true },
];

const CITIZENS_DATA = [
  {
    username: 'mario_rossi',
    first: 'Mario',
    last: 'Rossi',
    email: 'mario.rossi@gmail.com',
  },
  {
    username: 'luigi_verdi',
    first: 'Luigi',
    last: 'Verdi',
    email: 'luigi.verdi@gmail.com',
  },
];

const REAL_REPORTS = [
  {
    title: 'Detached Road Sign Held Up with Red and White Tape ',
    description:
      'I would like to report that the road sign in this area is detached from its original support. Someone has put it back in place using only red and white tape, but it’s clearly a temporary and unsafe fix. The sign is unstable and could fall, creating a danger for people passing by. A proper repair is needed.',
    address: 'Via Gorizia, 57, Torino',
    lat: 45.049784,
    lng: 7.641252,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['DetachedRoadSign1.jpg', 'DetachedRoasSign2.jpg'],
  },
  {
    title: 'Damaged Sidewalk',
    description:
      'Street corner with broken pavement, posing a hazard to pedestrians and vehicles. Repair needed.',
    address: 'Via Amalia Guglielminetti, Torino',
    lat: 45.052937,
    lng: 7.638527,
    categoryName: 'Roads and Urban Furnishings',
    images: [
      'DamageSidewalk1.jpg',
      'DamageSidewalk2.jpg',
      'DamageSidewalk3.jpg',
    ],
  },
  {
    title:
      'Road Sign Completely Destroyed and Lying in the Middle of the Street',
    description:
      'I would like to report that the road sign in this area is completely destroyed and lying on the ground in the middle of the roadway. Its presence poses a danger to drivers and cyclists, who might not notice the obstacle in time. It should be removed and the signage restored as soon as possible.',
    address: 'Via Gorizia, 37, Torino',
    lat: 45.051301,
    lng: 7.641507,
    categoryName: 'Road Signs and Traffic Lights',
    images: [
      'RoadSignCompletelyDestroyed1.jpg',
      'RoadSignCompletelyDestroyed2.jpg',
      'RoadSignCompletelyDestroyed3.jpg',
    ],
  },
  {
    title: 'Cracked Sidewalk with Grass Growing Through the Gaps Description',
    description:
      'I would like to report that the sidewalk in this area has several cracks, with grass growing through them. The surface is uneven and could be dangerous for pedestrians, especially for elderly people or those with mobility issues. It would be helpful to have the sidewalk repaired and cleaned.',
    address: 'Via Amalia Guglielminetti, Torino',
    lat: 45.053499,
    lng: 7.636862,
    categoryName: 'Roads and Urban Furnishings',
    images: ['CrackedSidewalkWithGras1s.jpg', 'CrackedSidewalkWithGrass2.jpg'],
  },
  {
    title: 'Public Water Fountain Out of Service',
    description:
      'The public water fountain is currently out of service: the water flow is completely absent. A technical intervention is needed to make the fountain operational again.',
    address: 'Corso Quattro Novembre, Torino',
    lat: 45.043917,
    lng: 7.6502,
    categoryName: 'Water Supply – Drinking Water',
    images: ['Fountain.png'],
  },
  {
    title: 'Street Light Not Working',
    description:
      'The street light does not turn on after sunset and remains completely dark. This causes reduced visibility in the area during evening hours. A maintenance check is requested to restore proper operation.',
    address: 'Via Valgioie, 21, Torino',
    lat: 45.076697,
    lng: 7.632842,
    categoryName: 'Public Lighting',
    images: ['StreetLight.jpg'],
  },
  {
    title: 'Bent Pedestrian Bollard',
    description:
      'One of the pedestrian bollards is visibly bent and leaning, likely due to an impact. The deformation disrupts the proper alignment of the bollards and may reduce the protection of the sidewalk.',
    address: 'Via Dante Di Nanni, 122, Torino',
    lat: 45.062138,
    lng: 7.647218,
    categoryName: 'Roads and Urban Furnishings',
    images: ['PedestrianBollard.jpg'],
  },
  {
    title: 'Sidewalk in Very Bad Condition',
    description:
      'The sidewalk is severely damaged, with large cracks, broken sections, and an uneven surface. Its condition poses a clear risk to pedestrians.',
    address: 'Via Duchessa Jolanda, 20, Torino',
    lat: 45.073873,
    lng: 7.662128,
    categoryName: 'Roads and Urban Furnishings',
    images: ['SidewalkBadCondition1.jpg', 'SidewalkBadCondition2.jpg'],
  },
  {
    title: 'Traffic Light Not Working',
    description:
      'The traffic light is not functioning, preventing proper signaling and creating a potential safety hazard.',
    address: 'Corso Peschiera, 173, Torino',
    lat: 45.064987,
    lng: 7.648226,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['TrafficLight.jpg'],
  },
  {
    title: 'Sidewalk in Poor Condition',
    description:
      'The sidewalk is cracked and uneven, making walking difficult and potentially unsafe.',
    address: 'Via Luigi Tarino, 11, Torino',
    lat: 45.071205,
    lng: 7.695782,
    categoryName: 'Roads and Urban Furnishings',
    images: ['SidewalkPoorCondition.jpg'],
  },
  {
    title: 'Pole on the Ground (Possibly a Taxi Stand, Uncertain)',
    description:
      'There is a pole lying on the ground, with a metal box at its base and wires emerging from the ground connected to it. It may be related to a taxi stand, but this is not certain. The structure appears exposed and could pose a safety concern.',
    address: 'Piazza Sabotino, Torino',
    lat: 45.065305,
    lng: 7.648741,
    categoryName: 'Roads and Urban Furnishings',
    images: ['PoleOnTheGround1.jpg', 'PoleOnTheGround2.jpg'],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

interface Repositories {
  roleRepo: Repository<Role>;
  userRepo: Repository<User>;
  accountRepo: Repository<Account>;
  categoryRepo: Repository<Category>;
  reportRepo: Repository<Report>;
  officeRepo: Repository<Office>;
  profileRepo: Repository<Profile>;
  boundaryRepo: Repository<Boundary>;
}

interface UserCreationContext {
  userRepo: Repository<User>;
  accountRepo: Repository<Account>;
  profileRepo: Repository<Profile>;
  commonPassword: string;
  rolesMap: Map<string, Role>;
  officesMap: Map<string, Office>;
}

interface UserData {
  username: string;
  roleName: string;
  firstName: string;
  lastName: string;
  email: string;
  officeName?: string;
}

function getRepositories(dataSource: DataSource): Repositories {
  return {
    roleRepo: dataSource.getRepository(Role),
    userRepo: dataSource.getRepository(User),
    accountRepo: dataSource.getRepository(Account),
    categoryRepo: dataSource.getRepository(Category),
    reportRepo: dataSource.getRepository(Report),
    officeRepo: dataSource.getRepository(Office),
    profileRepo: dataSource.getRepository(Profile),
    boundaryRepo: dataSource.getRepository(Boundary),
  };
}

async function seedOffices(
  officeRepo: Repository<Office>,
): Promise<Map<string, Office>> {
  const officesMap = new Map<string, Office>();

  for (const officeData of OFFICES_DATA) {
    let office = await officeRepo.findOne({ where: { name: officeData.name } });
    
    if (!office) {
      office = officeRepo.create({
        id: nanoid(),
        name: officeData.name,
        label: officeData.label,
      });
      await officeRepo.save(office);
    }
    
    officesMap.set(officeData.name, office);
  }

  return officesMap;
}

function getBoundariesGeoJsonPath(): string {
  let assetsDir = path.join(__dirname, 'assets');

  if (__dirname.includes('/dist/')) {
    assetsDir = path.join(
      __dirname,
      '../../../../../src/providers/database/seed/assets',
    );
  }

  return path.join(assetsDir, 'torino_boundaries.json');
}

async function seedBoundaries(
  boundaryRepo: Repository<Boundary>,
): Promise<void> {
  for (const boundaryData of BOUNDARIES_DATA) {
    const existing = await boundaryRepo.findOne({ where: { name: boundaryData.name } });
    
    if (!existing) {
      const geoJsonPath = getBoundariesGeoJsonPath();
      const geoJsonContent = fs.readFileSync(geoJsonPath, 'utf-8');
      const geometry = JSON.parse(geoJsonContent);

      const boundary = boundaryRepo.create({
        id: nanoid(),
        name: boundaryData.name,
        label: boundaryData.label,
        geometry,
      });
      await boundaryRepo.save(boundary);
      console.log(`Created boundary: ${boundaryData.label}`);
    }
  }
}

async function seedCategories(
  categoryRepo: Repository<Category>,
  officesMap: Map<string, Office>,
): Promise<Map<string, Category>> {
  const categoriesMap = new Map<string, Category>();

  for (const categoryData of CATEGORIES_DATA) {
    let category = await categoryRepo.findOne({
      where: { name: categoryData.name },
    });

    if (!category) {
      const assignedOffice = officesMap.get(categoryData.office);
      if (assignedOffice) {
        category = categoryRepo.create({
          id: nanoid(),
          name: categoryData.name,
          office: assignedOffice,
        });
        await categoryRepo.save(category);
      }
    }

    if (category) {
      categoriesMap.set(categoryData.name, category);
    }
  }

  return categoriesMap;
}

async function seedRoles(
  roleRepo: Repository<Role>,
): Promise<Map<string, Role>> {
  const rolesMap = new Map<string, Role>();

  for (const roleData of ROLES_DATA) {
    let role = await roleRepo.findOne({ where: { name: roleData.name } });
    
    if (!role) {
      role = roleRepo.create({ id: nanoid(), ...roleData });
      await roleRepo.save(role);
    }
    
    rolesMap.set(roleData.name, role);
  }

  return rolesMap;
}

async function createUserWithAccountAndProfile(
  context: UserCreationContext,
  userData: UserData,
): Promise<User> {
  const { userRepo, accountRepo, profileRepo, commonPassword, rolesMap, officesMap } = context;
  const { username, roleName, firstName, lastName, email, officeName } = userData;

  const existingUser = await userRepo.findOne({ where: { username } });
  if (existingUser) {
    return existingUser;
  }

  const user = userRepo.create({
    id: nanoid(),
    firstName,
    lastName,
    username,
    email,
    role: rolesMap.get(roleName),
    office: officeName ? officesMap.get(officeName) : null,
  });
  await userRepo.save(user);

  await accountRepo.save({
    id: nanoid(),
    user,
    providerId: 'local',
    accountId: username,
    password: commonPassword,
  });

  await profileRepo.save(
    profileRepo.create({
      id: nanoid(),
      userId: user.id,
      user: user,
    }),
  );

  return user;
}

async function seedMunicipalUsers(
  context: UserCreationContext,
): Promise<void> {
  await createUserWithAccountAndProfile(context, {
    username: 'admin',
    roleName: 'admin',
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@participium.com',
    officeName: 'organization_office',
  });

  for (const officeData of OFFICES_DATA) {
    if (officeData.name === 'organization_office') continue;

    for (let i = 1; i <= 2; i++) {
      const techUsername = `tech_${officeData.name}_${i}`;
      await createUserWithAccountAndProfile(context, {
        username: techUsername,
        roleName: 'tech_officer',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `${techUsername}@participium.com`.toLowerCase(),
        officeName: officeData.name,
      });
    }
  }

  for (let i = 1; i <= 4; i++) {
    await createUserWithAccountAndProfile(context, {
      username: `pr_officer_${i}`,
      roleName: 'pr_officer',
      firstName: 'PR',
      lastName: `Officer ${i}`,
      email: `pr.officer.${i}@participium.com`,
      officeName: 'organization_office',
    });
  }
}

async function seedCitizenUsers(
  context: UserCreationContext,
): Promise<User[]> {
  const citizenUsers: User[] = [];

  for (const citizenData of CITIZENS_DATA) {
    const user = await createUserWithAccountAndProfile(context, {
      username: citizenData.username,
      roleName: 'user',
      firstName: citizenData.first,
      lastName: citizenData.last,
      email: citizenData.email,
    });
    citizenUsers.push(user);
  }

  return citizenUsers;
}

function getImagesDirectory(): string {
  let imagesDir = path.join(__dirname, 'images');

  if (__dirname.includes('/dist/')) {
    imagesDir = path.join(
      __dirname,
      '../../../../../src/providers/database/seed/images',
    );
  }

  return imagesDir;
}

function determineReportUser(
  idx: number,
  luigiVerdi: User | undefined,
  citizenUsers: User[],
): { user: User; isAnonymous: boolean } {
  if (idx === 0 && luigiVerdi) {
    return { user: luigiVerdi, isAnonymous: false };
  }

  if (idx === 1 && luigiVerdi) {
    return { user: luigiVerdi, isAnonymous: true };
  }

  const randomUser = citizenUsers[randomInt(0, citizenUsers.length)];
  const isAnonymous = randomInt(0, 100) < 20;

  return { user: randomUser, isAnonymous };
}

function getMimeType(fileName: string): string {
  return fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

async function uploadReportImage(
  minioProvider: MinioProvider,
  imagesDir: string,
  imageName: string,
  reportId: string,
): Promise<string | null> {
  try {
    const imagePath = path.join(imagesDir, imageName);

    if (!fs.existsSync(imagePath)) {
      console.warn(`Image file not found: ${imagePath}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = getMimeType(imageName);
    const timestamp = Date.now();
    const minioFileName = `reports/${reportId}/${timestamp}-${imageName}`;

    const imageUrl = await minioProvider.uploadFile(
      minioFileName,
      imageBuffer,
      mimeType,
    );

    console.log(`Uploaded image: ${imageName} -> ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error(`Failed to upload image ${imageName}:`, error);
    return null;
  }
}

async function uploadReportImages(
  minioProvider: MinioProvider,
  imagesDir: string,
  imageNames: string[],
  reportId: string,
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const imageName of imageNames) {
    const imageUrl = await uploadReportImage(
      minioProvider,
      imagesDir,
      imageName,
      reportId,
    );
    if (imageUrl) {
      uploadedUrls.push(imageUrl);
    }
  }

  return uploadedUrls;
}

async function createReport(
  reportRepo: Repository<Report>,
  minioProvider: MinioProvider,
  realReport: typeof REAL_REPORTS[0],
  user: User,
  isAnonymous: boolean,
  category: Category,
  imagesDir: string,
): Promise<Report> {
  const reportId = nanoid();

  const uploadedImageUrls = await uploadReportImages(
    minioProvider,
    imagesDir,
    realReport.images,
    reportId,
  );

  const report = reportRepo.create({
    id: reportId,
    title: realReport.title,
    description: realReport.description,
    status: ReportStatus.RESOLVED,
    address: realReport.address,
    location: {
      type: 'Point',
      coordinates: [realReport.lng, realReport.lat],
    },
    images: uploadedImageUrls,
    user,
    category,
    createdAt: faker.date.recent({ days: 30 }),
    isAnonymous,
  });

  return report;
}

async function seedReports(
  reportRepo: Repository<Report>,
  minioProvider: MinioProvider,
  citizenUsers: User[],
  categoriesMap: Map<string, Category>,
): Promise<void> {
  const currentReportCount = await reportRepo.count();
  const shouldSeed =
    process.env.FORCE_SEED === 'true' || currentReportCount < 10;

  if (!shouldSeed) {
    console.log(
      `Reports already present (${currentReportCount}). Skipping generation.`,
    );
    return;
  }

  const imagesDir = getImagesDirectory();
  console.log('Looking for images in:', imagesDir);

  const luigiVerdi = citizenUsers.find((u) => u.username === 'luigi_verdi');
  const reportsToSave: Report[] = [];

  for (let idx = 0; idx < REAL_REPORTS.length; idx++) {
    const realReport = REAL_REPORTS[idx];
    const { user, isAnonymous } = determineReportUser(
      idx,
      luigiVerdi,
      citizenUsers,
    );

    const category = categoriesMap.get(realReport.categoryName);
    if (!category) {
      console.warn(`Category not found for report: ${realReport.title}`);
      continue;
    }

    const report = await createReport(
      reportRepo,
      minioProvider,
      realReport,
      user,
      isAnonymous,
      category,
      imagesDir,
    );

    reportsToSave.push(report);
  }

  await reportRepo.save(reportsToSave);
  console.log(`Created ${reportsToSave.length} real reports in Torino.`);
}

// ============================================================================
// Main Seed Function
// ============================================================================

export async function seedDatabase(
  dataSource: DataSource,
  minioProvider: MinioProvider,
): Promise<void> {
  const repositories = getRepositories(dataSource);
  const commonPassword = await bcrypt.hash('password', 10);

  const officesMap = await seedOffices(repositories.officeRepo);
  await seedBoundaries(repositories.boundaryRepo);
  const categoriesMap = await seedCategories(
    repositories.categoryRepo,
    officesMap,
  );
  const rolesMap = await seedRoles(repositories.roleRepo);

  const userContext: UserCreationContext = {
    userRepo: repositories.userRepo,
    accountRepo: repositories.accountRepo,
    profileRepo: repositories.profileRepo,
    commonPassword,
    rolesMap,
    officesMap,
  };

  await seedMunicipalUsers(userContext);
  const citizenUsers = await seedCitizenUsers(userContext);

  await seedReports(
    repositories.reportRepo,
    minioProvider,
    citizenUsers,
    categoriesMap,
  );
}

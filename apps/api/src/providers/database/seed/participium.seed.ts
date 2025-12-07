import { DataSource } from 'typeorm';
import { Role } from '../../../common/entities/role.entity';
import { User } from '../../../common/entities/user.entity';
import { Account } from '../../../common/entities/account.entity';
import { Category } from '../../../common/entities/category.entity';
import { Report, ReportStatus } from '../../../common/entities/report.entity';
import { Office } from '../../../common/entities/office.entity';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { MinioProvider } from '../../minio/minio.provider';
import * as fs from 'fs';
import * as path from 'path';

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
  {
    title: 'Faded Pedestrian Crossing',
    description:
      'Poorly visible crosswalk that needs repainting to ensure pedestrian safety. The faded markings make it difficult for drivers to notice pedestrians, especially at night or in bad weather, increasing the risk of accidents.',
    address: 'Via Osoppo, 20e, Torino',
    lat: 45.052893,
    lng: 7.638379,
    categoryName: 'Roads and Urban Furnishings',
    images: ['FadedPedestrianCrossing1.jpg', 'FadedPedestrianCrossing2.jpg'],
  },
  {
    title: 'Faded Bike Line Markings',
    description:
      'The bike lane markings on the road are no longer clearly visible, making it difficult for both cyclists and drivers to notice them. This increases the risk of accidents, especially during low-light conditions or heavy traffic.',
    address: 'Via Tolmino, Torino',
    lat: 45.054293,
    lng: 7.642011,
    categoryName: 'Roads and Urban Furnishings',
    images: ['FadedBikeLine1.jpg', 'FadedBikeLine2.jpg', 'FadedBikeLine3.jpg' ],
  },
  {
    title: 'Damaged Pedestrian Railing',
    description:
      'The green railing along the sidewalk is damaged. Repair needed to ensure pedestrian safety.',
    address: 'Corso Racconigi, 208, Torino',
    lat: 45.056554,
    lng: 7.647711,
    categoryName: 'Architectural Barriers',
    images: ['DamagedPedestrianRailing.jpg'],
  },
  {
    title: 'Vandalized road sign',
    description:
      'The sign has graffiti that compromises its visibility and effectiveness.',
    address: 'Via Spalato, Torino',
    lat: 45.059737,
    lng: 7.652716,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['VandalizedRoadSign.jpg'],
  },
  {
    title: 'Damaged Road Signs with Graffiti',
    description:
      'Two road signs have graffiti, reducing their readability and compromising road safety for drivers and pedestrians. Immediate cleaning or replacement is recommended.',
    address: 'Via Paolo Braccini, Torino',
    lat: 45.059915,
    lng: 7.652474,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['RoadSignWithGraffiti.jpg'],
  },
  {
    title: 'Severely Damaged Reflective Panel',
    description:
      'The sign is almost completely destroyed; the reflective film is no longer effective. Immediate replacement required.',
    address: 'Corso Peschiera, Torino',
    lat: 45.062229,
    lng: 7.655716,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['DamagedReflectivePanel.jpg'],
  },
  {
    title: 'Skating Rink with Damaged Wooden Edges',
    description:
      'The skating rink located inside the park has low wooden edges that are severely damaged along the entire perimeter. In several areas, the wood is broken, unstable, or completely detached, and numerous pieces are scattered throughout the surrounding area. This situation poses a concrete risk to children and animals who frequent the park, as they may trip, get injured, or come into contact with sharp or unstable fragments.',
    address: 'Via Osoppo, Torino',
    lat: 45.053219,
    lng: 7.639716,
    categoryName: 'Public Green Areas and Playgrounds',
    images: ['SkatingRink1.jpg', 'SkatingRink2.jpg', 'SkatingRink3.jpg'],
  },
  {
    title: 'Bent Sign',
    description:
      'The sign in the area is bent, and the deformation makes it difficult to read, reducing the effectiveness of the signal.',
    address: 'Via Paolo Braccini, 2, Torino',
    lat: 45.059449,
    lng: 7.656176,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['BentSign.jpg'],
  },
  {
    title: 'Bent and Illegible Road Sign',
    description:
      'I report a bent road sign that is crooked and difficult to read, causing confusion for drivers. Intervention is requested to restore the sign and ensure it is clearly visible.',
    address: 'Via Bobbio, 3, Torino',
    lat: 45.057927,
    lng: 7.654953,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['BentAndIllegibleRoadSign1.jpg','BentAndIllegibleRoadSign2.jpg'],
  },
  {
    title: 'Damaged Wall in the Park',
    description:
      'I am reporting a wall in a park that is in poor condition, visibly damaged and deteriorated, requiring maintenance and restoration.',
    address: 'Corso Mediterraneo, Torino',
    lat: 45.060608,
    lng: 7.657127,
    categoryName: 'Public Green Areas and Playgrounds',
    images: ['DamagedWallInThePark1.jpg','DamagedWallInThePark2.jpg','DamagedWallInThePark3.jpg'],
  },
  {
    title: 'Wall Covered with Graffiti',
    description:
      'I am reporting a wall covered with graffiti, which damages its appearance. Cleaning or restoration of the surface would be advisable.',
    address: 'Via Gorizia, 9a, Torino',
    lat: 45.051959,
    lng: 7.641575,
    categoryName: 'Other',
    images: ['WallWithGraffiti.jpg'],
  },
  {
    title: 'Vegetation Encroaching on the Sidewalk',
    description:
      'I am reporting vegetation encroaching on the sidewalk from the side, obstructing pedestrian passage. Pruning or removal would be advisable.',
    address: 'Via Tolmino, 80a, Torino',
    lat: 45.054390,
    lng: 7.642114,
    categoryName: 'Roads and Urban Furnishings',
    images: ['VegetationOnSidewalk1.jpg','VegetationOnSidewalk2.jpg'],
  },
  {
    title: 'Scattered Trash',
    description:
      'I am reporting scattered trash in the area, which makes the place look neglected and in need of cleaning.',
    address: 'Corso Carlo e Nello Rosselli, 153, Torino',
    lat: 45.055148,
    lng: 7.646663,
    categoryName: 'Waste',
    images: ['ScatteredTrash1.jpg','ScatteredTrash2.jpg','ScatteredTrash3.jpg'],
  },
  {
    title: 'Confusing Road Markings',
    description:
      'I am reporting that after construction work, new pedestrian crossings and stop lines were painted without removing the old ones. The presence of double lines causes confusion for both pedestrians and drivers, and the markings need clarification.',
    address: 'Via Gorizia, 9a, Torino',
    lat: 45.052070,
    lng: 7.641613,
    categoryName: 'Roads and Urban Furnishings',
    images: ['ConfusingRoadMarking.jpg'],
  },
  {
    title: 'Vegetation Occupying Parking Spaces',
    description:
      'I am reporting vegetation growing from the ground in the parking lot, occupying some parking spaces and reducing the available area.',
    address: 'Via Spalato, 14, Torino',
    lat: 45.061404,
    lng: 7.653820,
    categoryName: 'Roads and Urban Furnishings',
    images: ['VegetationParkingSpace.jpg'],
  },
  {
    title: 'Traffic Lights with Damaged or Missing Sun Protection',
    description:
      'I am reporting traffic lights with damaged or missing sun protection, making the signals harder to see for drivers.',
    address: 'Corso Luigi Einaudi, Torino',
    lat: 45.061338,
    lng: 7.658394,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['TrafficLightsDamaged1.jpg','TrafficLightsDamaged2.jpg','TrafficLightsDamaged3.jpg'],
  },
  {
    title: 'Damaged Traffic Lights and Road Sign',
    description:
      'I am reporting that some traffic lights have damaged or missing sun protection, reducing the visibility of the signals for drivers. Additionally, a road sign is damaged and has graffiti on it, affecting the clarity of the information.',
    address: 'Corso Peschiera, Torino',
    lat: 45.061494,
    lng: 7.657612,
    categoryName: 'Road Signs and Traffic Lights',
    images: ['TrafficLightAndRoadSign1.jpg','TrafficLightAndRoadSign2.jpg','TrafficLightAndRoadSign3.jpg'],
  },
];

export async function seedDatabase(
  dataSource: DataSource,
  minioProvider: MinioProvider,
) {
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const accountRepo = dataSource.getRepository(Account);
  const categoryRepo = dataSource.getRepository(Category);
  const reportRepo = dataSource.getRepository(Report);
  const officeRepo = dataSource.getRepository(Office);

  const commonPassword = await bcrypt.hash('password', 10);

  const officesData = [
    {
      name: 'maintenance',
      label: 'Maintenance and Technical Services',
    },
    {
      name: 'infrastructure',
      label: 'Infrastructure',
    },
    {
      name: 'public_services',
      label: 'Local Public Services',
    },
    {
      name: 'environment',
      label: 'Environment Quality',
    },
    {
      name: 'green_parks',
      label: 'Green Areas and Parks',
    },
    {
      name: 'civic_services',
      label: 'Decentralization and Civic Services',
    },
    {
      name: 'organization_office',
      label: 'Organization Office',
    },
  ];

  const officesMap = new Map<string, Office>();

  for (const o of officesData) {
    let office = await officeRepo.findOne({ where: { name: o.name } });
    if (!office) {
      office = officeRepo.create({
        id: nanoid(),
        name: o.name,
        label: o.label,
      });
      await officeRepo.save(office);
    }
    officesMap.set(o.name, office);
  }

  const categoriesData = [
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

  const categoriesMap = new Map<string, Category>();

  for (const c of categoriesData) {
    let category = await categoryRepo.findOne({ where: { name: c.name } });
    if (!category) {
      const assignedOffice = officesMap.get(c.office);
      if (assignedOffice) {
        category = categoryRepo.create({
          id: nanoid(),
          name: c.name,
          office: assignedOffice,
        });
        await categoryRepo.save(category);
      }
    }
    if (!category)
      category = await categoryRepo.findOne({ where: { name: c.name } });
    if (category) categoriesMap.set(c.name, category);
  }

  const rolesData = [
    { name: 'user', label: 'User', isMunicipal: false },
    { name: 'admin', label: 'Admin', isMunicipal: true },
    { name: 'pr_officer', label: 'PR Officer', isMunicipal: true },
    { name: 'tech_officer', label: 'Technical Officer', isMunicipal: true },
  ];

  const rolesMap = new Map<string, Role>();
  for (const r of rolesData) {
    let role = await roleRepo.findOne({ where: { name: r.name } });
    if (!role) {
      role = roleRepo.create({ id: nanoid(), ...r });
      await roleRepo.save(role);
    }
    rolesMap.set(r.name, role);
  }

  const createUser = async (
    username: string,
    roleName: string,
    firstName: string,
    lastName: string,
    email: string,
    officeName?: string,
  ) => {
    let user = await userRepo.findOne({ where: { username } });
    if (!user) {
      user = userRepo.create({
        id: nanoid(),
        firstName,
        lastName,
        username,
        email: email,
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
    }
    return user;
  };

  await createUser(
    'admin',
    'admin',
    'System',
    'Admin',
    'admin@participium.com',
    'organization_office',
  );

  for (const officeData of officesData) {
    for (let i = 1; i <= 2; i++) {
      const fakeFirstName = faker.person.firstName();
      const fakeLastName = faker.person.lastName();
      const techUsername = `tech_${officeData.name}_${i}`;

      if (officeData.name === 'organization_office') continue;
      await createUser(
        techUsername,
        'tech_officer',
        fakeFirstName,
        fakeLastName,
        `${techUsername}@participium.com`.toLowerCase(),
        officeData.name,
      );
    }
  }

  const prOfficersCount = 4;
  for (let i = 1; i <= prOfficersCount; i++) {
    await createUser(
      `pr_officer_${i}`,
      'pr_officer',
      'PR',
      `Officer ${i}`,
      `pr.officer.${i}@participium.com`,
      'organization_office',
    );
  }

  const citizenUsers: User[] = [];
  const citizensData = [
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

  for (const c of citizensData) {
    const u = await createUser(c.username, 'user', c.first, c.last, c.email);
    citizenUsers.push(u);
  }

  const currentReportCount = await reportRepo.count();

  const shouldSeed =
    process.env.FORCE_SEED === 'true' || currentReportCount < 10;

  if (shouldSeed) {
    const reportsToSave: Report[] = [];

    let imagesDir = path.join(__dirname, 'images');

    if (__dirname.includes('/dist/')) {
      imagesDir = path.join(
        __dirname,
        '../../../../../src/providers/database/seed/images',
      );
    }

    console.log('Looking for images in:', imagesDir);

    // Get Luigi Verdi user (the second citizen user)
    const luigiVerdi = citizenUsers.find((u) => u.username === 'luigi_verdi');

    for (let idx = 0; idx < REAL_REPORTS.length; idx++) {
      const realReport = REAL_REPORTS[idx];

      // Assign first 2 reports to Luigi Verdi (one anonymous, one not)
      let reportUser: User;
      let isAnonymous: boolean;

      if (idx === 0 && luigiVerdi) {
        // First report: Luigi Verdi, not anonymous
        reportUser = luigiVerdi;
        isAnonymous = false;
      } else if (idx === 1 && luigiVerdi) {
        // Second report: Luigi Verdi, anonymous
        reportUser = luigiVerdi;
        isAnonymous = true;
      } else {
        // Other reports: random user with 20% chance of being anonymous
        reportUser =
          citizenUsers[Math.floor(Math.random() * citizenUsers.length)];
        isAnonymous = Math.random() < 0.2;
      }

      const category = categoriesMap.get(realReport.categoryName);
      if (!category) {
        console.warn(`Category not found for report: ${realReport.title}`);
        continue;
      }

      const reportId = nanoid();

      const uploadedImageUrls: string[] = [];
      for (const imageName of realReport.images) {
        try {
          const imagePath = path.join(imagesDir, imageName);

          // Check if file exists
          if (!fs.existsSync(imagePath)) {
            console.warn(`Image file not found: ${imagePath}`);
            continue;
          }

          const imageBuffer = fs.readFileSync(imagePath);
          const mimeType = imageName.endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';

          // Generate unique filename for MinIO
          const timestamp = Date.now();
          const minioFileName = `reports/${reportId}/${timestamp}-${imageName}`;

          // Upload to MinIO
          const imageUrl = await minioProvider.uploadFile(
            minioFileName,
            imageBuffer,
            mimeType,
          );

          uploadedImageUrls.push(imageUrl);
          console.log(`Uploaded image: ${imageName} -> ${imageUrl}`);
        } catch (error) {
          console.error(`Failed to upload image ${imageName}:`, error);
        }
      }

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
        user: reportUser,
        category: category,
        createdAt: faker.date.recent({ days: 30 }),
        isAnonymous: isAnonymous,
      });

      reportsToSave.push(report);
    }

    await reportRepo.save(reportsToSave);
    console.log(`Created ${reportsToSave.length} real reports in Torino.`);
  } else {
    console.log(
      `Reports already present (${currentReportCount}). Skipping generation.`,
    );
  }
}

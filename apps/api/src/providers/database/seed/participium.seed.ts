import {
  Account,
  Boundary,
  Category,
  Office,
  Profile,
  Report,
  ReportStatus,
  Role,
  User,
  UserOfficeRole,
} from '@entities';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { randomInt } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DataSource, Repository } from 'typeorm';
import { MinioProvider } from '../../minio/minio.provider';

// ============================================================================
// Constants
// ============================================================================

const OFFICES_DATA = [
  {
    name: 'maintenance',
    label: 'Maintenance and Technical Services',
    isExternal: false,
  },
  { name: 'infrastructure', label: 'Infrastructure', isExternal: false },
  {
    name: 'public_services',
    label: 'Local Public Services',
    isExternal: false,
  },
  { name: 'environment', label: 'Environment Quality', isExternal: false },
  { name: 'green_parks', label: 'Green Areas and Parks', isExternal: false },
  {
    name: 'civic_services',
    label: 'Decentralization and Civic Services',
    isExternal: false,
  },
  {
    name: 'organization_office',
    label: 'Organization Office',
    isExternal: false,
  },
];

const EXTERNAL_OFFICES_DATA = [
  {
    name: 'external_company_1',
    label: 'External Company 1',
    isExternal: true,
  },
  {
    name: 'external_company_2',
    label: 'External Company 2',
    isExternal: true,
  },
  {
    name: 'external_company_3',
    label: 'External Company 3',
    isExternal: true,
  },
];

const BOUNDARIES_DATA = [{ name: 'torino', label: 'Comune di Torino' }];

const CATEGORIES_DATA = [
  {
    name: 'Roads and Urban Furnishings',
    office: 'maintenance',
    externalOffice: 'external_company_1',
  },
  {
    name: 'Architectural Barriers',
    office: 'maintenance',
    externalOffice: 'external_company_2',
  },
  {
    name: 'Road Signs and Traffic Lights',
    office: 'infrastructure',
    externalOffice: 'external_company_3',
  },
  {
    name: 'Public Lighting',
    office: 'infrastructure',
    externalOffice: 'external_company_1',
  },
  {
    name: 'Water Supply – Drinking Water',
    office: 'public_services',
    externalOffice: 'external_company_2',
  },
  {
    name: 'Sewer System',
    office: 'public_services',
    externalOffice: 'external_company_3',
  },
  {
    name: 'Waste',
    office: 'environment',
    externalOffice: 'external_company_1',
  },
  {
    name: 'Public Green Areas and Playgrounds',
    office: 'green_parks',
    externalOffice: 'external_company_2',
  },
  {
    name: 'Other',
    office: 'civic_services',
    externalOffice: 'external_company_3',
  },
];

const ROLES_DATA = [
  { name: 'user', label: 'User', isMunicipal: false },
  { name: 'admin', label: 'Admin', isMunicipal: true },
  { name: 'pr_officer', label: 'PR Officer', isMunicipal: true },
  { name: 'tech_officer', label: 'Technical Officer', isMunicipal: true },
  {
    name: 'external_maintainer',
    label: 'External Maintainer',
    isMunicipal: true,
  },
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
    images: ['FadedBikeLine1.jpg', 'FadedBikeLine2.jpg', 'FadedBikeLine3.jpg'],
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
    images: ['BentAndIllegibleRoadSign1.jpg', 'BentAndIllegibleRoadSign2.jpg'],
  },
  {
    title: 'Damaged Wall in the Park',
    description:
      'I am reporting a wall in a park that is in poor condition, visibly damaged and deteriorated, requiring maintenance and restoration.',
    address: 'Corso Mediterraneo, Torino',
    lat: 45.060608,
    lng: 7.657127,
    categoryName: 'Public Green Areas and Playgrounds',
    images: [
      'DamagedWallInThePark1.jpg',
      'DamagedWallInThePark2.jpg',
      'DamagedWallInThePark3.jpg',
    ],
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
    lat: 45.05439,
    lng: 7.642114,
    categoryName: 'Roads and Urban Furnishings',
    images: ['VegetationOnSidewalk1.jpg', 'VegetationOnSidewalk2.jpg'],
  },
  {
    title: 'Scattered Trash',
    description:
      'I am reporting scattered trash in the area, which makes the place look neglected and in need of cleaning.',
    address: 'Corso Carlo e Nello Rosselli, 153, Torino',
    lat: 45.055148,
    lng: 7.646663,
    categoryName: 'Waste',
    images: [
      'ScatteredTrash1.jpg',
      'ScatteredTrash2.jpg',
      'ScatteredTrash3.jpg',
    ],
  },
  {
    title: 'Confusing Road Markings',
    description:
      'I am reporting that after construction work, new pedestrian crossings and stop lines were painted without removing the old ones. The presence of double lines causes confusion for both pedestrians and drivers, and the markings need clarification.',
    address: 'Via Gorizia, 9a, Torino',
    lat: 45.05207,
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
    lng: 7.65382,
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
    images: [
      'TrafficLightsDamaged1.jpg',
      'TrafficLightsDamaged2.jpg',
      'TrafficLightsDamaged3.jpg',
    ],
  },
  {
    title: 'Damaged Traffic Lights and Road Sign',
    description:
      'I am reporting that some traffic lights have damaged or missing sun protection, reducing the visibility of the signals for drivers. Additionally, a road sign is damaged and has graffiti on it, affecting the clarity of the information.',
    address: 'Corso Peschiera, Torino',
    lat: 45.061494,
    lng: 7.657612,
    categoryName: 'Road Signs and Traffic Lights',
    images: [
      'TrafficLightAndRoadSign1.jpg',
      'TrafficLightAndRoadSign2.jpg',
      'TrafficLightAndRoadSign3.jpg',
    ],
  },
  {
    title: 'Report of Missing Pedestrian Safety Barrier',
    description:
      'A section of the pedestrian safety barrier along the sidewalk is missing. The barrier is located on the side opposite the roadway, where the ground level is lower, and its absence creates a potentially hazardous situation due to the existing height difference.',
    address: 'Via San Paolo, 160a, Torino',
    lat: 45.056609,
    lng: 7.635214,
    categoryName: 'Architectural Barriers',
    images: [
      'MissingPedestrianBarrier.jpg',
    ],
  },
  {
    title: 'Damaged Bench Seat',
    description:
      'The bench in the park has one of the two planks on its seat missing. This makes sitting on the bench uncomfortable and uneven, reducing its usability for park visitors.',
    address: 'Viale Leonardo Bistolfi, 20a, Torino',
    lat: 45.058771,
    lng: 7.632521,
    categoryName: 'Public Green Areas and Playgrounds',
    images: [
      'DamagedBenchSeat1.jpg',
      'DamagedBenchSeat2.jpg',
    ],
  },
  {
    title: 'Bench Missing Backrest',
    description:
      'The bench in the park is missing its backrest, making it less comfortable to sit on.',
    address: 'Corso Siracusa, Torino',
    lat: 45.054345,
    lng: 7.635278,
    categoryName: 'Public Green Areas and Playgrounds',
    images: [
      'BenchMissingBackrest.jpg',
    ],
  },
  {
    title: 'Wall and Fence in Poor Condition',
    description:
      'The wall is damaged and in several areas is detached and disconnected, showing clear signs of instability. The red metal fence above it is tilted in multiple points and is not continuously fixed between its elements. Overall, the structure appears precarious and may pose a potential risk to pedestrians.',
    address: 'Via Mombasiglio, 111, Torino',
    lat: 45.051319,
    lng: 7.637198,
    categoryName: 'Roads and Urban Furnishings',
    images: [
      'WallFencePoorCondition1.jpg',
      'WallFencePoorCondition2.jpg',
      'WallFencePoorCondition3.jpg',
    ],
  },
  {
    title: 'Street Sign on the Ground',
    description:
      'A steet sign is lying on the ground.',
    address: 'Via Boston, 139a, Torino',
    lat: 45.044602,
    lng: 7.629369,
    categoryName: 'Road Signs and Traffic Lights',
    images: [
      'StreetSignOnTheGround1.jpg',
      'StreetSignOnTheGround2.jpg',
    ],
  },
  {
    title: 'Broken Transparent Panel at Bus Stop',
    description:
      'The transparent panel at the bus stop is damaged. There is a hole in the panel, several scratches across its surface, and part of the frame seems to be detached from the panel.',
    address: 'Via Guido Reni, 230a, Torino',
    lat: 45.039402,
    lng: 7.628599,
    categoryName: 'Roads and Urban Furnishings',
    images: [
      'BrokenPanelBusStop1.jpg',
      'BrokenPanelBusStop2.jpg',
      'BrokenPanelBusStop3.jpg',
    ],
  },
  {
    title: 'Street Light Not Turning On',
    description:
      'The street light is not working. It remains off in the evenings, making the area less illuminated than usual.',
    address: 'Via Tolmino, 80a, Torino',
    lat: 45.054348,
    lng: 7.642136,
    categoryName: 'Public Lighting',
    images: [
      'StreetLightNotTurningOn1.jpg',
      'StreetLightNotTurningOn2.jpg',
    ],
  },
  {
    title: 'Missing Road Sign',
    description:
      'The road sign is missing, leaving only the metal pole and an empty circular frame where the sign should be. The structure is still standing, but without the sign it is unclear what type of instruction or warning was intended. The empty frame is noticeable and could be confusing for drivers.',
    address: 'Via Gabriele D\'Annunzio, 2a, Torino',
    lat: 45.060403,
    lng: 7.656218,
    categoryName: 'Road Signs and Traffic Lights',
    images: [
      'MissingRoadSign.jpg',
    ],
  },
  {
    title: 'Bike Stand Leaning Badly',
    description:
      'There is a bike stand that is leaning badly . In its current condition, it doesn’t seem usable for locking a bike safely.',
    address: 'Via Guido Reni, 188a, Torino',
    lat: 45.042308,
    lng: 7.628811,
    categoryName: 'Roads and Urban Furnishings',
    images: [
      'BikeStandLeaningBadly1.jpg',
      'BikeStandLeaningBadly2.jpg',
      'BikeStandLeaningBadly3.jpg',
    ],
  },
  {
    title: 'Leaning Post',
    description:
      'The post in front of the crosswalk is leaning to one side.',
    address: 'Via Giuseppe Peano, 11i, Torino',
    lat: 45.060776,
    lng: 7.660105,
    categoryName: 'Architectural Barriers',
    images: [
      'LeaningPost.jpg',
    ],
  },
  {
    title: 'Leaning Road Sign and Barrier',
    description:
      'The road sign post is leaning, and the barriers next to it is also leaning and misaligned.',
    address: 'Corso Siracusa, 51, Torino',
    lat: 45.050265,
    lng: 7.634725,
    categoryName: 'Road Signs and Traffic Lights',
    images: [
      'LeanRoadSignAndBarrier1.jpg',
      'LeanRoadSignAndBarrier2.jpg',
      'LeanRoadSignAndBarrier3.jpg',
    ],
  },
  {
    title: 'Cracked Road/Sidewalk',
    description:
      'The road/sidewalk is in very poor condition, with potholes and cracks that make walking and driving difficult.',
    address: 'Corso Siracusa, 49b, Torino',
    lat: 45.050587,
    lng: 7.635093,
    categoryName: 'Roads and Urban Furnishings',
    images: [
      'CrackedRoadSidewalk.jpg',
    ],
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

  const OFFICES = [...OFFICES_DATA, ...EXTERNAL_OFFICES_DATA];

  for (const officeData of OFFICES) {
    let office = await officeRepo.findOne({ where: { name: officeData.name } });

    if (!office) {
      office = officeRepo.create({
        id: nanoid(),
        name: officeData.name,
        label: officeData.label,
        isExternal: officeData.isExternal,
      });
      await officeRepo.save(office);
    }

    officesMap.set(officeData.name, office);
  }

  return officesMap;
}

function getBoundariesGeoJsonPath(): string {
  let assetsDir = path.join(__dirname, 'assets');

  if (__dirname.includes('/dist/') || __dirname.includes('\\dist\\')) {
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
    const existing = await boundaryRepo.findOne({
      where: { name: boundaryData.name },
    });

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
      const externalOffice = officesMap.get(categoryData.externalOffice);
      if (assignedOffice) {
        category = categoryRepo.create({
          id: nanoid(),
          name: categoryData.name,
          office: assignedOffice,
          externalOffice: externalOffice || null,
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
  const {
    userRepo,
    accountRepo,
    profileRepo,
    commonPassword,
    rolesMap,
    officesMap,
  } = context;
  const { username, roleName, firstName, lastName, email, officeName } =
    userData;

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
    isEmailVerified: true,
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

async function seedMunicipalUsers(context: UserCreationContext): Promise<void> {
  await createUserWithAccountAndProfile(context, {
    username: 'system_admin',
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

async function seedExternalMaintainers(
  context: UserCreationContext,
): Promise<void> {
  for (const officeData of EXTERNAL_OFFICES_DATA) {
    for (let i = 1; i <= 2; i++) {
      const externalMaintainerUsername = `${officeData.name}_${i}`;
      await createUserWithAccountAndProfile(context, {
        username: externalMaintainerUsername,
        roleName: 'external_maintainer',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `${externalMaintainerUsername}@participium.com`.toLowerCase(),
        officeName: officeData.name,
      });
    }
  }
}

/**
 * Seeds a single tech_officer with multiple office assignments
 * to demonstrate multi-role functionality
 */
async function seedMultiRoleTechOfficer(
  dataSource: DataSource,
  context: UserCreationContext,
): Promise<void> {
  const { userRepo, accountRepo, profileRepo, commonPassword, rolesMap, officesMap } = context;
  
  const username = 'tech_multi_role';
  const existingUser = await userRepo.findOne({ where: { username } });
  
  if (existingUser) {
    console.log(`Multi-role tech officer already exists: ${username}`);
    return;
  }

  // Create user with deprecated fields (first office as primary)
  const techRole = rolesMap.get('tech_officer');
  const maintenanceOffice = officesMap.get('maintenance');
  
  const user = userRepo.create({
    id: nanoid(),
    firstName: 'Multi',
    lastName: 'Role Tech',
    username,
    email: 'tech.multi@participium.com',
    role: techRole,
    office: maintenanceOffice,
  });
  await userRepo.save(user);

  // Create account and profile
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

  // Create UserOfficeRole assignments for multiple offices
  const userOfficeRoleRepo = dataSource.getRepository(UserOfficeRole);
  const officesToAssign = ['maintenance', 'infrastructure', 'public_services'];
  
  for (const officeName of officesToAssign) {
    const office = officesMap.get(officeName);
    if (office) {
      const assignment = userOfficeRoleRepo.create({
        id: nanoid(),
        userId: user.id,
        officeId: office.id,
        roleId: techRole.id,
      });
      await userOfficeRoleRepo.save(assignment);
      console.log(`✓ Assigned ${username} to office: ${office.label}`);
    }
  }

  console.log(`Created multi-role tech officer: ${username} with ${officesToAssign.length} office assignments`);
}

async function seedCitizenUsers(context: UserCreationContext): Promise<User[]> {
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

  if (__dirname.includes('/dist/') || __dirname.includes('\\dist\\')) {
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
  realReport: (typeof REAL_REPORTS)[0],
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
  await seedMultiRoleTechOfficer(dataSource, userContext);
  await seedExternalMaintainers(userContext);
  const citizenUsers = await seedCitizenUsers(userContext);

  await seedReports(
    repositories.reportRepo,
    minioProvider,
    citizenUsers,
    categoriesMap,
  );
}

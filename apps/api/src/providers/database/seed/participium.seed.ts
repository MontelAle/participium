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

const REAL_REPORTS = [
  {
    title: 'Deep pothole in the middle of the lane',
    description:
      'There is a very deep pothole in the center of the road. Dangerous for motorcycles.',
    address: 'Corso Vittorio Emanuele II, 50, Torino',
    lat: 45.0621,
    lng: 7.6784,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Traffic light not working',
    description: 'The traffic light is flashing yellow since this morning.',
    address: 'Piazza Statuto, Torino',
    lat: 45.0763,
    lng: 7.669,
    categoryName: 'Road Signs and Traffic Lights',
  },
  {
    title: 'Broken street lamp',
    description: 'Street lamp totally burnt out, the sidewalk is pitch black.',
    address: 'Via Po, 18, Torino',
    lat: 45.0695,
    lng: 7.69,
    categoryName: 'Public Lighting',
  },
  {
    title: 'Missing wheelchair ramp',
    description: 'Impossible to access the sidewalk with a wheelchair here.',
    address: 'Via Garibaldi, 10, Torino',
    lat: 45.072,
    lng: 7.683,
    categoryName: 'Architectural Barriers',
  },
  {
    title: 'Water leak from manhole',
    description: 'Clean water is gushing out from the ground.',
    address: 'Piazza Castello, Torino',
    lat: 45.071,
    lng: 7.686,
    categoryName: 'Water Supply – Drinking Water',
  },
  {
    title: 'Clogged drain',
    description: 'The drain is full of leaves, creating a huge puddle.',
    address: 'Via Roma, 30, Torino',
    lat: 45.065,
    lng: 7.682,
    categoryName: 'Sewer System',
  },
  {
    title: 'Overflowing bins',
    description: 'Trash is all over the floor, bins are full.',
    address: 'Piazza San Carlo, Torino',
    lat: 45.068,
    lng: 7.683,
    categoryName: 'Waste',
  },
  {
    title: 'Graffiti on monument',
    description: 'Someone sprayed graffiti on the historical wall.',
    address: 'Via Accademia delle Scienze, 6, Torino',
    lat: 45.0685,
    lng: 7.6845,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Broken bench',
    description: 'The wooden slats of the bench are broken.',
    address: 'Giardini Reali, Torino',
    lat: 45.073,
    lng: 7.689,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'Loud noise from bar',
    description: 'Music is too loud after midnight.',
    address: 'Piazza Vittorio Veneto, Torino',
    lat: 45.065,
    lng: 7.693,
    categoryName: 'Other',
  },
  {
    title: 'Damaged sidewalk',
    description: 'Tiles are lifted, I tripped and almost fell.',
    address: 'Via Lagrange, 15, Torino',
    lat: 45.064,
    lng: 7.68,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Faded pedestrian crossing',
    description: 'Zebra crossing is barely visible, cars do not stop.',
    address: 'Corso Matteotti, 25, Torino',
    lat: 45.063,
    lng: 7.67,
    categoryName: 'Road Signs and Traffic Lights',
  },
  {
    title: 'Tree covering street sign',
    description: 'You cannot see the stop sign because of the branches.',
    address: 'Corso Re Umberto, 10, Torino',
    lat: 45.06,
    lng: 7.675,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'Abandoned bike',
    description: 'A bike frame has been chained here for months.',
    address: 'Via Verdi, 5, Torino',
    lat: 45.069,
    lng: 7.688,
    categoryName: 'Waste',
  },
  {
    title: 'Dangerous hole in park',
    description: 'Dog park has a deep hole near the entrance.',
    address: 'Parco del Valentino, Torino',
    lat: 45.055,
    lng: 7.685,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'No water pressure',
    description: 'Water pressure in the building is almost zero today.',
    address: 'Via Cavour, 12, Torino',
    lat: 45.066,
    lng: 7.685,
    categoryName: 'Water Supply – Drinking Water',
  },
  {
    title: 'Bad smell from sewer',
    description: 'Unbearable smell coming from the drains.',
    address: 'Via delle Rosine, 4, Torino',
    lat: 45.067,
    lng: 7.691,
    categoryName: 'Sewer System',
  },
  {
    title: 'Glass on the bike lane',
    description: 'Broken bottles on the cycle path.',
    address: 'Lungo Po Cadorna, Torino',
    lat: 45.0665,
    lng: 7.694,
    categoryName: 'Waste',
  },
  {
    title: 'Broken swing',
    description: 'The swing set is broken and dangerous for kids.',
    address: 'Giardino Aiuola Balbo, Torino',
    lat: 45.0655,
    lng: 7.687,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'Street sign bent',
    description: 'The No Entry sign is bent and facing the wrong way.',
    address: 'Via Carlo Alberto, 20, Torino',
    lat: 45.0635,
    lng: 7.684,
    categoryName: 'Road Signs and Traffic Lights',
  },
  {
    title: 'Flickering street light',
    description: 'The light is flickering constantly like a disco.',
    address: 'Via Rossini, 12, Torino',
    lat: 45.0688,
    lng: 7.692,
    categoryName: 'Public Lighting',
  },
  {
    title: 'Elevator not working',
    description: 'Public elevator to the parking is stuck.',
    address: 'Piazza Bodoni, Torino',
    lat: 45.0638,
    lng: 7.6825,
    categoryName: 'Architectural Barriers',
  },
  {
    title: 'Illegal dumping',
    description: 'Pile of construction waste left on the corner.',
    address: 'Corso San Maurizio, 15, Torino',
    lat: 45.07,
    lng: 7.695,
    categoryName: 'Waste',
  },
  {
    title: 'Fallen tree branch',
    description: 'Large branch blocking half the road.',
    address: 'Corso Galileo Ferraris, 30, Torino',
    lat: 45.065,
    lng: 7.665,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'Missing manhole cover',
    description: 'Extremely dangerous, manhole cover is missing!',
    address: 'Via XX Settembre, 50, Torino',
    lat: 45.0725,
    lng: 7.6855,
    categoryName: 'Sewer System',
  },
  {
    title: 'Confusing road markings',
    description: 'Old yellow lines are confusing drivers with white lines.',
    address: 'Piazza Solferino, Torino',
    lat: 45.069,
    lng: 7.678,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Dark pedestrian crossing',
    description: 'The light above the crossing is out.',
    address: 'Corso Bolzano, Torino',
    lat: 45.072,
    lng: 7.665,
    categoryName: 'Public Lighting',
  },
  {
    title: 'Homeless encampment',
    description: 'Tents blocking the public passage.',
    address: 'Portici di Via Nizza, Torino',
    lat: 45.06,
    lng: 7.678,
    categoryName: 'Other',
  },
  {
    title: 'Broken fountain',
    description: 'The Toret drinking fountain is not working.',
    address: 'Piazza Carlina, Torino',
    lat: 45.0675,
    lng: 7.6885,
    categoryName: 'Water Supply – Drinking Water',
  },
  {
    title: 'Paving stones missing',
    description: 'Several cobblestones are missing creating a hole.',
    address: 'Via Milano, Torino',
    lat: 45.074,
    lng: 7.684,
    categoryName: 'Roads and Urban Furnishings',
  },

  {
    title: 'Abandoned car',
    description: 'Car without wheels left here for weeks.',
    address: 'Corso Giulio Cesare, 100, Torino',
    lat: 45.085,
    lng: 7.69,
    categoryName: 'Waste',
  },
  {
    title: 'Overgrown weeds',
    description: 'Weeds are 1 meter high on the sidewalk.',
    address: 'Via Bologna, 50, Torino',
    lat: 45.088,
    lng: 7.695,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'Pothole chain',
    description: 'Series of potholes destroying tires.',
    address: 'Corso Vercelli, 80, Torino',
    lat: 45.09,
    lng: 7.698,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Broken traffic light',
    description: 'Red light is not working.',
    address: 'Piazza della Repubblica, Torino',
    lat: 45.076,
    lng: 7.684,
    categoryName: 'Road Signs and Traffic Lights',
  },
  {
    title: 'Trash everywhere',
    description: 'Market area left very dirty.',
    address: 'Corso Novara, 20, Torino',
    lat: 45.085,
    lng: 7.7,
    categoryName: 'Waste',
  },
  {
    title: 'Damaged guardrail',
    description: 'Guardrail bent after an accident.',
    address: 'Lungo Dora Napoli, Torino',
    lat: 45.08,
    lng: 7.68,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Flooded underpass',
    description: 'Underpass completely flooded.',
    address: 'Corso Mortara, Torino',
    lat: 45.088,
    lng: 7.665,
    categoryName: 'Sewer System',
  },

  {
    title: 'Broken benches in park',
    description: 'Vandals broke all benches.',
    address: 'Parco Di Vittorio, Torino',
    lat: 45.035,
    lng: 7.66,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'Hole in the asphalt',
    description: 'Dangerous hole near the factory entrance.',
    address: 'Via Traiano, Torino',
    lat: 45.028,
    lng: 7.65,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Dark street',
    description: 'Entire row of lights is out.',
    address: 'Corso Unione Sovietica, 300, Torino',
    lat: 45.03,
    lng: 7.64,
    categoryName: 'Public Lighting',
  },
  {
    title: 'Abandoned mattresses',
    description: 'Two mattresses dumped on the corner.',
    address: 'Via Tunisi, 50, Torino',
    lat: 45.045,
    lng: 7.655,
    categoryName: 'Waste',
  },
  {
    title: 'Bus stop sign damaged',
    description: 'Sign is on the ground.',
    address: 'Via Nizza, 230, Torino',
    lat: 45.032,
    lng: 7.665,
    categoryName: 'Road Signs and Traffic Lights',
  },
  {
    title: 'Water pipe burst',
    description: 'Flooding the street.',
    address: 'Corso Traiano, 40, Torino',
    lat: 45.025,
    lng: 7.645,
    categoryName: 'Water Supply – Drinking Water',
  },
  {
    title: 'Blocked sidewalk',
    description: 'Construction work left barriers blocking passage.',
    address: 'Via Onorato Vigliani, Torino',
    lat: 45.02,
    lng: 7.64,
    categoryName: 'Architectural Barriers',
  },
  {
    title: 'Dog waste bins full',
    description: 'Please empty the bins.',
    address: 'Piazza Bengasi, Torino',
    lat: 45.015,
    lng: 7.65,
    categoryName: 'Waste',
  },

  {
    title: 'Pothole near school',
    description: 'Dangerous for kids crossing.',
    address: 'Via Monginevro, 80, Torino',
    lat: 45.065,
    lng: 7.64,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'No street light',
    description: 'Bulb burnt out.',
    address: 'Corso Peschiera, 150, Torino',
    lat: 45.062,
    lng: 7.635,
    categoryName: 'Public Lighting',
  },
  {
    title: 'Playground maintenance needed',
    description: 'Slide is rusty.',
    address: 'Parco Ruffini, Torino',
    lat: 45.058,
    lng: 7.63,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'Illegal parking',
    description: 'Cars parked on pedestrian crossing constantly.',
    address: 'Via Di Nanni, Torino',
    lat: 45.063,
    lng: 7.65,
    categoryName: 'Road Signs and Traffic Lights',
  },
  {
    title: 'Sewer blocked',
    description: 'Bad smell and slow drainage.',
    address: 'Corso Trapani, Torino',
    lat: 45.06,
    lng: 7.625,
    categoryName: 'Sewer System',
  },
  {
    title: 'Graffiti on school wall',
    description: 'Offensive graffiti appeared overnight.',
    address: 'Via Dante di Nanni, 40, Torino',
    lat: 45.064,
    lng: 7.648,
    categoryName: 'Other',
  },
  {
    title: 'Broken curb',
    description: 'Stone curb is detached.',
    address: 'Piazza Sabotino, Torino',
    lat: 45.066,
    lng: 7.642,
    categoryName: 'Roads and Urban Furnishings',
  },

  {
    title: 'Landslide risk',
    description: 'Mud sliding onto the road after rain.',
    address: 'Strada del Nobile, Torino',
    lat: 45.05,
    lng: 7.71,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Fallen tree',
    description: 'Tree blocking the lane.',
    address: 'Strada Val San Martino, Torino',
    lat: 45.06,
    lng: 7.72,
    categoryName: 'Public Green Areas and Playgrounds',
  },
  {
    title: 'No lighting in curve',
    description: 'Very dangerous curve without light.',
    address: 'Strada dei Colli, Torino',
    lat: 45.07,
    lng: 7.73,
    categoryName: 'Public Lighting',
  },
  {
    title: 'Water leaking on road',
    description: 'Stream of water running down the street.',
    address: 'Corso Picco, Torino',
    lat: 45.065,
    lng: 7.705,
    categoryName: 'Water Supply – Drinking Water',
  },
  {
    title: 'Hidden sign',
    description: 'Speed limit sign hidden by bushes.',
    address: 'Strada Comunale di Superga, Torino',
    lat: 45.08,
    lng: 7.75,
    categoryName: 'Road Signs and Traffic Lights',
  },
  {
    title: 'Trash in the woods',
    description: 'Picnic leftovers dumped in the nature.',
    address: 'Parco della Maddalena, Torino',
    lat: 45.035,
    lng: 7.715,
    categoryName: 'Waste',
  },
  {
    title: 'Pot holes',
    description: 'Road is full of holes.',
    address: 'Via dei Colli, Torino',
    lat: 45.045,
    lng: 7.7,
    categoryName: 'Roads and Urban Furnishings',
  },
  {
    title: 'Broken railing',
    description: 'Protective railing is rusted through.',
    address: 'Ponte Isabella, Torino',
    lat: 45.04,
    lng: 7.68,
    categoryName: 'Roads and Urban Furnishings',
  },
];

export async function seedDatabase(dataSource: DataSource) {
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
    'civic_services',
  );

  for (const officeData of officesData) {
    for (let i = 1; i <= 2; i++) {
      const fakeFirstName = faker.person.firstName();
      const fakeLastName = faker.person.lastName();
      const techUsername = `tech_${officeData.name}_${i}`;

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
      'civic_services',
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
      username: 'luca_bianchi',
      first: 'Luca',
      last: 'Bianchi',
      email: 'luca.b@libero.it',
    },
    {
      username: 'sofia_verdi',
      first: 'Sofia',
      last: 'Verdi',
      email: 'sofia.v88@hotmail.com',
    },
    {
      username: 'julia_black',
      first: 'Julia',
      last: 'Black',
      email: 'juliablack@gmail.com',
    },
    {
      username: 'anthony_count',
      first: 'Anthony',
      last: 'Count',
      email: 'anto.count@email.it',
    },
  ];

  for (const c of citizensData) {
    const u = await createUser(c.username, 'user', c.first, c.last, c.email);
    citizenUsers.push(u);
  }

  const currentReportCount = await reportRepo.count();

  if (currentReportCount < 10) {
    const reportsToSave: Report[] = [];

    for (const realReport of REAL_REPORTS) {
      const randomUser =
        citizenUsers[Math.floor(Math.random() * citizenUsers.length)];

      const category = categoriesMap.get(realReport.categoryName);
      if (!category) {
        console.warn(`Category not found for report: ${realReport.title}`);
        continue;
      }

      const isResolved = Math.random() > 0.8;

      const report = reportRepo.create({
        id: nanoid(),
        title: realReport.title,
        description: realReport.description,
        status: isResolved ? ReportStatus.RESOLVED : ReportStatus.PENDING,
        address: realReport.address,
        location: {
          type: 'Point',
          coordinates: [realReport.lng, realReport.lat],
        },
        images: [faker.image.url()],
        user: randomUser,
        category: category,
        createdAt: faker.date.recent({ days: 30 }),
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

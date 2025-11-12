/**
 * Seed script for Report entity with geospatial data
 * Creates sample reports with locations in Turin, Italy
 * Run with: pnpm seed:reports
 */

import { DataSource } from 'typeorm';
import { Report, ReportStatus, User, Category } from '@repo/api';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'participium',
  entities: [Report, User, Category],
  synchronize: false,
});

const turinLocations = [
  { name: 'Piazza Castello', longitude: 7.686864, latitude: 45.070312, address: 'Piazza Castello, 10121 Torino' },
  { name: 'Mole Antonelliana', longitude: 7.693242, latitude: 45.068947, address: 'Via Montebello 20, 10124 Torino' },
  { name: 'Parco del Valentino', longitude: 7.685853, latitude: 45.057363, address: 'Corso Massimo d\'Azeglio, 10126 Torino' },
  { name: 'Porta Palazzo', longitude: 7.682551, latitude: 45.078451, address: 'Piazza della Repubblica, 10152 Torino' },
  { name: 'Stazione Porta Nuova', longitude: 7.678421, latitude: 45.061389, address: 'Corso Vittorio Emanuele II, 10121 Torino' },
];

const reportTemplates = [
  { title: 'Lampione stradale non funzionante', description: 'Il lampione non si accende dalla scorsa settimana, creando problemi di sicurezza per i pedoni.', status: ReportStatus.PENDING },
  { title: 'Buca pericolosa sulla strada', description: 'Grande buca sul manto stradale che può causare danni ai veicoli.', status: ReportStatus.PENDING },
];

async function seed() {
  try {
    await AppDataSource.initialize();

    const reportRepository = AppDataSource.getRepository(Report);
    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getRepository(Category);

    const user = await userRepository.findOne({ where: {} });
    const category = await categoryRepository.findOne({ where: {} });

    if (!user || !category) {
      console.error('Error: Missing user or category. Run user seed first.');
      return;
    }

    const reports: Report[] = [];

    for (const location of turinLocations) {
      for (const template of reportTemplates) {
        const report = reportRepository.create({
          id: nanoid(),
          title: `${template.title} - ${location.name}`,
          description: template.description,
          status: template.status,
          location: `POINT(${location.longitude} ${location.latitude})`,
          address: location.address,
          userId: user.id,
          categoryId: category.id,
        });
        reports.push(report);
      }
    }

    await reportRepository.save(reports);
    console.log(`✅ Created ${reports.length} reports in Turin area`);
    
  } catch (error) {
    console.error('Error seeding reports:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();

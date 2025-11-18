import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { DataSource } from 'typeorm';
import { Category } from '../../../common/entities/category.entity';
import { nanoid } from 'nanoid';

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
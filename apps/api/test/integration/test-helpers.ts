import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

/**
 * Setup function for PostgreSQL testcontainer with PostGIS extension
 * This container will be used for all integration tests
 */
export const setupTestDB = async (): Promise<StartedPostgreSqlContainer> => {
  const container = await new PostgreSqlContainer('postgis/postgis:15-3.3')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .withExposedPorts(5432)
    .start();

  return container;
};

/**
 * TypeORM configuration for testing
 * Automatically loads all entities from src directory using glob pattern
 */
export const TypeOrmTestModule = (container: StartedPostgreSqlContainer) =>
  TypeOrmModule.forRoot({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: ['src/**/*.entity.ts'], // Point to entity files in src
    synchronize: true,
  });

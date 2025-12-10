import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Injectable } from '@nestjs/common';

/////////// COMMON FUNCTIONS FOR INTEGRATION TESTINGS ///////////

/**
 * Mock MinioProvider for testing
 * This prevents real MinIO connections during integration tests
 * Uses the same structure as e2e tests for consistency
 */
@Injectable()
export class MockMinioProvider {
  uploadFile = jest
    .fn()
    .mockResolvedValue(
      'http://localhost:9000/bucket/reports/mocked-id/test.jpg',
    );
  
  deleteFile = jest.fn().mockResolvedValue(undefined);
  
  deleteFiles = jest.fn().mockResolvedValue(undefined);
  
  extractFileNameFromUrl = jest.fn((url: string) => url.split('/').pop());
}

export const setupTestDB = async (): Promise<StartedPostgreSqlContainer> => {
  const container = await new PostgreSqlContainer('postgis/postgis:15-3.3')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .withExposedPorts(5432)
    .start();

  return container;
};


export const TypeOrmTestModule = (container: StartedPostgreSqlContainer) =>
  TypeOrmModule.forRoot({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: ['src/**/*.entity.ts'],
    synchronize: true,
  });

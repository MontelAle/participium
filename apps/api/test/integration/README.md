# Integration Tests with Testcontainers

This directory contains integration tests that use [Testcontainers](https://testcontainers.com/) to spin up real PostgreSQL database instances for testing.

## Prerequisites

**IMPORTANT:** These tests require Docker to be running on your system. Testcontainers will automatically start and stop PostgreSQL containers for each test suite.

- Install Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Ensure Docker is running before executing tests
- Docker must be accessible without sudo (Linux users may need to add their user to the docker group)

## Overview

Integration tests verify that different parts of your application work together correctly with real dependencies. Unlike unit tests that use mocks, these tests use actual PostgreSQL containers to ensure your database queries and business logic work as expected.

## Test Structure

Each test file follows this pattern:

```typescript
// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { YourModule } from '../../../src/modules/your-module/your-module.module';
import appConfig from '../../../src/config/app.config';
import { setupTestDB, TypeOrmTestModule } from '../test-helpers';

const request = require('supertest');

describe('YourModule (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    // 1. Start PostgreSQL container
    container = await setupTestDB();

    // 2. Create testing module with real database connection
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
        TypeOrmTestModule(container),
        YourModule, // The module you're testing
      ],
    }).compile();

    // 3. Create and initialize the application
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    // 4. Get DataSource for direct database access
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up resources
    await dataSource.destroy();
    await app.close();
    await container.stop();
  });

  afterEach(async () => {
    // Clean data between tests (order matters due to foreign keys)
    await dataSource.query('TRUNCATE TABLE "session" CASCADE');
    await dataSource.query('TRUNCATE TABLE "account" CASCADE');
    await dataSource.query('TRUNCATE TABLE "profile" CASCADE');
    await dataSource.query('TRUNCATE TABLE "user" CASCADE');
    await dataSource.query('TRUNCATE TABLE "role" CASCADE');
    // Add other tables as needed
  });

  describe('Your test suite', () => {
    it('should test something', async () => {
      // Use supertest to make HTTP requests
      const response = await request(app.getHttpServer())
        .post('/your-endpoint')
        .send({ data: 'value' })
        .expect(200);

      expect(response.body).toEqual(/* expected result */);

      // Verify database state directly
      const record = await dataSource
        .getRepository(YourEntity)
        .findOne({ where: { id: 'something' } });
      expect(record).toBeDefined();
    });
  });
});
```

## Key Points

### 1. **Mock nanoid at the Top**
Always mock nanoid before any imports to avoid ESM module issues:

```typescript
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));
```

### 2. **Use Shared Helper Functions**
All integration tests use shared helper functions from `test-helpers.ts`:

- `setupTestDB()`: Starts a PostgreSQL container with PostGIS extension
- `TypeOrmTestModule(container)`: Configures TypeORM with the test database

These helpers are located in `test/integration/test-helpers.ts` and should be imported in all integration test files:

```typescript
import { setupTestDB, TypeOrmTestModule } from '../test-helpers';
```

### 3. **Entity Configuration**
The `TypeOrmTestModule` helper uses the glob pattern `'src/**/*.entity.ts'` to automatically load all entities from the source directory. This is better than importing and listing each entity individually.

However, you still need to import specific entity classes when you want to use them in your tests for database queries:

```typescript
import { User } from '../../../src/common/entities/user.entity';
import { Account } from '../../../src/common/entities/account.entity';
import { Session } from '../../../src/common/entities/session.entity';
// Import only the entities you need for your specific test
```

### 4. **Container Lifecycle**
- `beforeAll`: Start the container once for all tests (faster)
- `afterAll`: Stop the container and clean up
- `afterEach`: Clean data between tests to ensure test isolation

### 5. **Data Cleanup**
Use `TRUNCATE TABLE` with `CASCADE` to clean up data between tests. Order matters due to foreign key constraints:

```typescript
afterEach(async () => {
  // Clean dependent tables first
  await dataSource.query('TRUNCATE TABLE "session" CASCADE');
  await dataSource.query('TRUNCATE TABLE "account" CASCADE');
  await dataSource.query('TRUNCATE TABLE "profile" CASCADE');
  await dataSource.query('TRUNCATE TABLE "user" CASCADE');
  await dataSource.query('TRUNCATE TABLE "role" CASCADE');
});
```

### 6. **Testing HTTP Endpoints**
Use `supertest` to make HTTP requests:

```typescript
const response = await request(app.getHttpServer())
  .post('/auth/login')
  .send({ username: 'test', password: 'pass' })
  .set('Cookie', 'session_token=abc123')
  .expect(200);
```

### 7. **Direct Database Access**
Use `dataSource` to verify database state:

```typescript
const user = await dataSource
  .getRepository(User)
  .findOne({ where: { username: 'test' }, relations: ['role', 'office'] });
```

### 8. **Testing Cookies**
Extract and use cookies from responses:

```typescript
const cookies = response.headers['set-cookie'];
const sessionCookie = cookies.find((c: string) => c.startsWith('session_token='));
const token = sessionCookie.split(';')[0].split('=')[1];

// Use in subsequent requests
await request(app.getHttpServer())
  .post('/auth/logout')
  .set('Cookie', `session_token=${token}`)
  .expect(200);
```

## Running Tests

```bash
# Run all integration tests
pnpm test:int

# Run specific test file
pnpm test:int auth.int-spec

# Run with coverage
pnpm test:int --coverage
```

## Configuration

The test configuration is in `test/jest-int.json`:

```json
{
  "testRegex": ".int-spec.ts$",
  "testTimeout": 30000,
  "maxWorkers": 1,
  "forceExit": true,
  "detectOpenHandles": true
}
```

- `testTimeout`: 30 seconds to allow container startup
- `maxWorkers: 1`: Run tests sequentially (containers are resource-intensive)
- `forceExit`: Force exit after tests complete
- `detectOpenHandles`: Detect and warn about hanging async operations

## Best Practices

1. **Test Real Scenarios**: Test complete user flows, not just individual functions
2. **Isolate Tests**: Each test should be independent and not rely on others
3. **Test Edge Cases**: Test validation errors, duplicate data, missing fields, etc.
4. **Verify Database State**: Don't just check HTTP responses—verify the data was actually saved correctly
5. **Use Descriptive Names**: Test names should clearly describe what they're testing
6. **Group Related Tests**: Use nested `describe` blocks to organize related tests

## Example: Auth Module Tests

See `auth/auth.int-spec.ts` for a complete example that tests:
- User registration with validation
- Login/logout flows
- Session management
- Cookie handling
- Database state verification
- Error cases (duplicates, invalid credentials, etc.)

## Troubleshooting

### Container Won't Start
- Ensure Docker is running
- Check Docker has enough resources (memory, disk space)
- Try pulling the image manually: `docker pull postgres:16-alpine`

### Tests Timing Out
- Increase timeout in `jest-int.json`
- Check for hanging database connections
- Ensure `forceExit: true` is set

### Foreign Key Violations
- Ensure correct order in `TRUNCATE` statements
- Always use `CASCADE` option
- Check entity relationships are properly configured

### Type Errors
- Ensure all entities are imported from `src/common/entities`
- Check TypeORM decorators are correctly applied
- Verify entity classes implement their corresponding types from `@repo/api`

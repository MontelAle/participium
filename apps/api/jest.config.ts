import type { Config } from 'jest';

export const baseConfig = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'ts', 'json'],
  testEnvironment: 'node',
} as const satisfies Config;

export const nestConfig = {
  ...baseConfig,
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
} as const satisfies Config;

const config: Config = {
  ...nestConfig,
  displayName: 'api',
  rootDir: '.',
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '^@entities$': '<rootDir>/src/common/entities/index.ts',
    '^@entities/(.*)$': '<rootDir>/src/common/entities/$1',
  },
  coverageReporters: ['lcov', 'text-summary'],
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/seed/**/*.ts',
    '!src/**/*.type.ts',
    '!src/common/dto/**/*.ts',
    '!src/common/entities/**/*.ts',
    '!src/**/constants/error-messages.ts',
  ],
};

export default config;

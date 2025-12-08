import { nestConfig } from '@repo/jest-config';
import type { Config } from 'jest';

const config: Config = {
  ...nestConfig,
  displayName: 'api',
  rootDir: '.', 
  coverageDirectory: './coverage',
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
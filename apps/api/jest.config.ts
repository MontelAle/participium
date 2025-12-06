import { nestConfig } from '@repo/jest-config';
import type { Config } from 'jest';

const config: Config = {
  ...nestConfig,
  coverageDirectory: './coverage',
  coverageReporters: ['lcov', 'text-summary'],
  collectCoverageFrom: [
    '<rootDir>/**/*.(t|j)s',
    '!<rootDir>/**/*.spec.ts',
    '!<rootDir>/**/*.module.ts',
    '!<rootDir>/main.ts',
    '!<rootDir>/**/seed/**/*.ts',
    '!<rootDir>/**/*.type.ts',
    '!<rootDir>/common/dto/**/*.ts',
    '!<rootDir>/common/entities/**/*.ts',
    '!<rootDir>/**/constants/error-messages.ts',
  ],
};

export default config;
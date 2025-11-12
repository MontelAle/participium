import { nestConfig } from '@repo/jest-config';
import type { Config } from 'jest';

const config: Config = {
  ...nestConfig,
  collectCoverageFrom: [
    '<rootDir>/**/*.(t|j)s',
    '!<rootDir>/**/*.spec.ts',
    '!<rootDir>/**/*.module.ts',
    '!<rootDir>/main.ts',
    '!<rootDir>/**/seed/**/*.ts',
    '!<rootDir>/**/*.type.ts',
  ],
};

export default config;

import type { Config } from 'jest';
import type { Config as ConfigNamespace } from '@jest/types';
import nextJest from 'next/jest';
import { config as baseConfig } from './base';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  ...baseConfig,
  moduleFileExtensions: [...baseConfig.moduleFileExtensions, 'jsx', 'tsx'],
} as const satisfies Config;

const nextConfig = createJestConfig(config);

export default nextConfig;

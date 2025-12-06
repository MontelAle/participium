import nextJest from 'next/jest';
import { config as baseConfig } from './base';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  ...baseConfig,
  moduleFileExtensions: [...baseConfig.moduleFileExtensions, 'jsx', 'tsx'],
};

const nextConfig: any = createJestConfig(config);

export default nextConfig;

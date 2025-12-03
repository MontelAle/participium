import type { Config } from 'jest';

export const nestConfig = {
    collectCoverage: true,
    coverageProvider: 'v8',
    moduleFileExtensions: ['js', 'ts', 'json'],
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

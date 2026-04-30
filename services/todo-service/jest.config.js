/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@vocmap/shared$': '<rootDir>/../../packages/shared/src',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};

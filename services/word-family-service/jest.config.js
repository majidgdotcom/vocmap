module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@vocmap/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};

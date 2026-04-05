/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/services/communityFallback*.ts',
    '!**/index.ts',
    '!**/index.tsx',
    '!**/*.html',
  ],
  coverageThreshold: {
    global: {
      statements: 65,
      branches: 35,
      functions: 85,
      lines: 65,
    },
  },
  coverageReporters: ['text-summary', 'lcov', 'html'],
};

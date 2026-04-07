/**
 * Jest configuration for TypeScript unit tests (ts-jest).
 *
 * Connor Bashaw — BugFix-Count-Endpoint:
 * - preset ts-jest compiles .ts test files on the fly.
 * - testEnvironment node matches this Express backend (no jsdom).
 * - roots + testMatch limit discovery to src slash glob test.ts files under src.
 * - clearMocks resets mock call history between tests (cleaner count tests).
 *
 * @type {import('jest').Config}
 */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    clearMocks: true,
    setupFiles: ['<rootDir>/jest.setup.js']
};

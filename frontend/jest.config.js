// babel
module.exports = {
  roots: ['<rootDir>/'],
  // "testTimeout": 15000,
  // Add more setup options before each test is run
  setupFiles: ['<rootDir>/jest/setEnvVars'],
  setupFilesAfterEnv: ['<rootDir>/jest/setup.js'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/jest',
  coverageReporters: ['lcov', 'json'],
  // on node 14.x coverage provider v8 offers good speed and more or less good report
  coverageProvider: 'babel',
  collectCoverageFrom: [
    '**/src/**',
    '!**/__unused__/**',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/src/app/**',
    '!**/src/interfaces/**',
    '!**/src/data-contracts/**',
    '!**/src/middleware.ts',
    '!**/src/swagger-typescript-api.ts',
  ],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle module aliases (this will be automatically configured for you soon)
    '@services/(.*)$': ['<rootDir>/src/services/$1'],
    '@components/(.*)$': ['<rootDir>/src/components/$1'],
    '@interfaces/(.*)$': ['<rootDir>/src/interfaces/$1'],
    '@contexts/(.*)$': ['<rootDir>/src/contexts/$1'],
    '@layouts/(.*)$': ['<rootDir>/src/layouts/$1'],
    '@styles/(.*)$': ['<rootDir>/src/styles/$1'],
    '@utils/(.*)$': ['<rootDir>/src/utils/$1'],
    '@pages/(.*)$': ['<rootDir>/src/pages/$1'],
    '@middlewares/(.*)$': ['<rootDir>/src/utils/middlewares/$1'],
    '@public/(.*)$': ['<rootDir>/public/$1'],
    '@jestRoot/(.*)$': ['<rootDir>/jest/$1'],
    '@data-contracts/(.*)$': ['<rootDir>/src/data-contracts/$1'],
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }],
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/jest/fileTransformer.js',
  },
  transformIgnorePatterns: [
    // '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.[jt]sx?$',
};

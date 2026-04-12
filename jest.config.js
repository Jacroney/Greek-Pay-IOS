module.exports = {
  testEnvironment: 'node',
  transform: {
    '\\.[jt]sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@supabase|expo-.*|nativewind|react-native-css-interop|lucide-react-native)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock native modules that can't run in Node
    '^react-native$': '<rootDir>/jest/react-native-mock.js',
    '^react-native/(.*)$': '<rootDir>/jest/react-native-mock.js',
    '^react-native-url-polyfill/auto$': '<rootDir>/jest/empty-mock.js',
    '^expo-local-authentication$': '<rootDir>/jest/expo-local-auth-mock.js',
    '^expo-secure-store$': '<rootDir>/jest/expo-secure-store-mock.js',
    '^expo-notifications$': '<rootDir>/jest/expo-notifications-mock.js',
    '^expo-device$': '<rootDir>/jest/expo-device-mock.js',
    '^expo-haptics$': '<rootDir>/jest/empty-mock.js',
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    'utils/**/*.ts',
    'hooks/**/*.tsx',
    '!**/*.d.ts',
    '!**/__mocks__/**',
  ],
};

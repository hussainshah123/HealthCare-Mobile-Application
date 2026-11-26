module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: [
    '<rootDir>/node_modules/@react-native-documents/picker/jest/build/jest/setup.js',
    '<rootDir>/jest/setup.js',
  ],
  // lucide's ESM build is .mjs, which babel-jest skips; use its CommonJS build in tests.
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  // These packages ship untranspiled ESM / TypeScript and must go through babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-native-documents|@react-navigation|react-native-maps|react-native-screens|react-native-safe-area-context|react-native-svg|lucide-react-native)/)',
  ],
};

/**
 * Cucumber configuration for the Dojo dashboard tests.
 *
 * Uses tsx for ESM-native TypeScript loading (package.json has "type": "module").
 *
 * Run with: npm run test:features
 */

export default {
  default: {
    import: [
      "tests/support/**/*.ts",
      "tests/step-definitions/**/*.ts",
    ],
    loader: ["tsx"],
    paths: ["tests/features/**/*.feature"],
    format: [
      "progress-bar",
      "summary",
    ],
    publishQuiet: true,
  },
};

import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Arhitektonsko pravilo: src/core je čista logika i ne smije uvoziti render/ui/platform/audio.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/render/**', '**/ui/**', '**/platform/**', '**/audio/**', '**/i18n/**'], message: 'src/core mora ostati čista logika.' },
      ] }],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'navigator'],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'Koristi seeded RNG iz src/core/rng.ts.' },
        { object: 'Date', property: 'now', message: 'Core ne smije čitati vrijeme.' }],
    },
  },
);

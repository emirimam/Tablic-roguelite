import { defineConfig } from 'vite';

export default defineConfig({
  build: { target: 'es2022', outDir: 'dist', assetsInlineLimit: 0 },
  test: { include: ['src/**/*.test.ts', 'sim/**/*.test.ts'], environment: 'node' },
});

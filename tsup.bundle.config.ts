import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist-bundle',
  minify: true,
  noExternal: [/.*/], // Bundle all dependencies
  splitting: false,
  clean: true,
});

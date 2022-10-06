import ts from 'rollup-plugin-ts';
import { Addon } from '@embroider/addon-dev/rollup';
import { defineConfig } from 'rollup';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

export default defineConfig({
  // https://github.com/rollup/rollup/issues/1828
  watch: {
    chokidar: {
      usePolling: true,
    },
  },
  external: ['ember-cached-decorator-polyfill'],
  output: {
    ...addon.output(),
    sourcemap: true,
    hoistTransitiveImports: false,
  },
  plugins: [
    // These are the modules that users should be able to import from your
    // addon. Anything not listed here may get optimized away.
    addon.publicEntrypoints(['**/*.ts']),

    // This babel config should *not* apply presets or compile away ES modules.
    // It exists only to provide development niceties for you, like automatic
    // template colocation.
    //
    // By default, this will load the actual babel config from the file
    // babel.config.json.
    ts({
      // can be changed to swc or other transpilers later
      // but we need the ember plugins converted first
      // (template compilation and co-location)
      transpiler: 'babel',
      babelConfig: './babel.config.json',
      browserslist: ['last 2 firefox versions', 'last 2 chrome versions'],
      tsconfig: {
        fileName: 'tsconfig.json',
        hook: (config) => ({
          ...config,
          declaration: true,
          declarationMap: true,
          // See: https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/#beta-delta
          // Allows us to use `exports` to define types per export
          // However, it was declared as not ready
          // as a result, we need extra / fallback references in the package.json
          declarationDir: './dist',
          // Retain docs (false is default)
          removeComments: false,
        }),
      },
    }),

    // Follow the V2 Addon rules about dependencies. Your code can import from
    // `dependencies` and `peerDependencies` as well as standard Ember-provided
    // package names.
    addon.dependencies(),

    // Remove leftover build artifacts when starting a new build.
    addon.clean(),
  ],
});

import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/node_modules/.pnpm/esbuild@0.27.7/node_modules/esbuild/package.json');
const { build } = require('esbuild');
await build({
  entryPoints: ['/Users/shiwei/code/mengpo/demo/main.tsx'],
  bundle: true,
  format: 'iife',
  outfile: '/Users/shiwei/code/mengpo/demo/demo-dist/bundle.js',
  platform: 'browser',
  target: 'es2020',
  loader: { '.json': 'json' },
  jsx: 'automatic',
  logLevel: 'warning',
});
console.log('bundled');

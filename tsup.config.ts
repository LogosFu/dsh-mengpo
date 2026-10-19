import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/host/index.ts', scanner: 'src/host/scanner.ts', types: 'src/host/types.ts' },
    format: ['esm'],
    platform: 'node',
    target: 'node18',
    outDir: 'lib',
    sourcemap: false,
    dts: false,
    clean: true,
    // host 侧零运行时依赖：只 import node 内置模块与本包源码
    noExternal: [/./],
  },
  {
    entry: { client: 'src/client/index.ts' },
    format: ['cjs'],
    platform: 'browser',
    target: 'es2020',
    outDir: 'lib',
    sourcemap: false,
    dts: false,
    clean: false,
    // Web shell 模块表 seed 词：运行时由 window.__ModuleLoader__ 的 require 提供
    external: ['react', 'react-dom', 'react/jsx-runtime', '@deepseek-ai/cordis', 'zod'],
    outExtension: () => ({ js: '.js' }),
    esbuildOptions(options) {
      options.banner = {
        js: 'window.__ModuleLoader__.load({id:"dsh-mengpo",factory:(require)=>{var module={exports:{}};var exports=module.exports;',
      };
      options.footer = { js: 'return module.exports;}});' };
    },
  },
]);

import { defineConfig } from 'vite';
import vitePluginJavascriptObfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
  root: 'www',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    vitePluginJavascriptObfuscator({
      include: ['**/*.js'],
      exclude: [/node_modules/],
      apply: 'build',
      debugger: false,
      options: {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: false,
        stringArray: true,
        stringArrayEncoding: [],
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
      }
    })
  ]
});

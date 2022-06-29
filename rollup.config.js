import buble from '@rollup/plugin-buble'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/index.cjs', format: 'cjs', exports: 'default' },
    { file: 'dist/index.mjs', format: 'esm' }
  ],
  plugins: [buble()],
  external: ['fs', 'https', 'http', 'path', 'mime', 'opener']
}

import buble from '@rollup/plugin-buble'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/index.cjs.js', format: 'cjs', exports: 'default' },
    { file: 'dist/index.es.js', format: 'es' },
  ],
  plugins: [buble()],
  external: ['fs', 'https', 'http', 'path', 'mime', 'opener'],
}

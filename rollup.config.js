import buble from '@rollup/plugin-buble'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/index.cjs.js', format: 'cjs' },
    { file: 'dist/index.es.js', format: 'esm' }
  ],
  plugins: [buble()],
  onwarn ({ code, message }) {
    if (code !== 'UNRESOLVED_IMPORT') {
      console.warn(message)
    }
  }
}

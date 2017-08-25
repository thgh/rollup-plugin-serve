import buble from 'rollup-plugin-buble'

export default {
  input: 'src/index.js',
  output: 'dist/index.cjs.js',
  plugins: [
    buble()
  ],
  onwarn ({ code, message }) {
    if (code !== 'UNRESOLVED_IMPORT') {
      console.warn(message)
    }
  }
}

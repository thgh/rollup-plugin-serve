import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/index.js',
  dest: 'dist/index.cjs.js',
  plugins: [
    buble()
  ],
  // Cleaner console
  onwarn (msg) {
    if (msg && msg.startsWith('Treating')) {
      return
    }
  }
}

import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/index.cjs.js', format: 'cjs' },
    { file: 'dist/index.es.js', format: 'esm' }
  ],
  plugins: [commonjs(), resolve(), buble()],
  external: [].concat(
    require('module').builtinModules || Object.keys(process.binding('natives'))
  )
}

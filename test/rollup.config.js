import serve from 'rollup-plugin-serve'

export default {
  entry: 'entry.js',
  dest: 'dest.js',
  plugins: [
    serve({
      historyApiFallback: true,
      contentBase: ['.', 'base1', 'base2']
    })
  ]
}

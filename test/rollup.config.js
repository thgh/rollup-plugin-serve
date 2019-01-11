import serve from '..'

export default {
  input: 'entry.js',
  output: {
    file: 'dest.js',
    format: 'cjs'
  },
  plugins: [
    serve({
      open: true,
      openPage: '/frames.html',
      historyApiFallback: '/fallback.html',
      contentBase: ['.', 'base1', 'base2']
    })
  ]
}

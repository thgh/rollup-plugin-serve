import serve from './dist/index.cjs.js'

const testOnListening = () => {
  const timeout = 3
  const timer = setTimeout(() => {
    const msg = `onListening was not called within ${timeout}s`
    console.error(msg)
    throw new Error(msg)
  }, timeout * 1000)
  return server => {
    clearTimeout(timer)
    console.log('onListening works', server.address())
  }
}

export default {
  input: 'test/entry.js',
  output: {
    file: 'test/dest.js',
    format: 'cjs'
  },
  watch: {
    clearScreen: false
  },
  plugins: [
    serve({
      open: true,
      openPage: '/frames.html',
      historyApiFallback: '/fallback.html',
      contentBase: ['test', 'test/base1', 'test/base2'],
      onListening: testOnListening()
    })
  ]
}

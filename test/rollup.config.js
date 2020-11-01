import serve from '../src/index.js'

const testOnListening = () => {
  const timeout = 3
  const timer = setTimeout(() => {
    const msg = `onListening was not called within ${timeout}s`
    console.error(msg)
    throw new Error(msg)
  }, timeout * 1000)
  return (server) => {
    clearTimeout(timer)
    console.log('onListening works', server.address())
  }
}

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
      contentBase: ['.', 'base1', 'base2'],
      onListening: testOnListening(),
    })
  ]
}

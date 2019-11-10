import { createServer as createHttpsServer } from 'https'
import { createServer } from 'http'
import { resolve } from 'path'

import opener from 'opener'
import sirv from 'sirv'
import compose from 'connect-compose'

let server

/**
 * Serve your rolled up bundle like webpack-dev-server
 * @param {ServeOptions|string|string[]} options
 */
export default function serve(options = { contentBase: '' }) {
  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options }
  }
  options.contentBase = Array.isArray(options.contentBase)
    ? options.contentBase
    : [options.contentBase || '']
  options.port = options.port || 10001
  options.headers = options.headers || {}
  options.https = options.https || false
  options.openPage = options.openPage || ''

  // Release previous server instance if rollup is reloading configuration in watch mode
  if (server) {
    server.close()
  } else {
    closeServerOnTermination()
  }

  // Serve all folders
  const middlewares = options.contentBase.map(base => sirv(base, { dev: true }))

  // Send custom headers
  if (options.headers) {
    middlewares.unshift(setHeaders)
  }

  // Fallback to another page
  let { historyApiFallback: fallback } = options
  if (fallback) {
    // Defaults to index.html, sirv know where to look
    fallback = typeof fallback === 'string' ? fallback : '/'

    // Must start with /
    fallback = (fallback.startsWith('/') ? '' : '/') + fallback

    // Swap out the requested page with the fallback page
    middlewares.push((req, res, next) => {
      req.originalUrl = req.url
      req.url = fallback
      next()
    })

    // Serve the static files again, this time looking for the fallback page
    const serveStatic = middlewares.slice(-3, -1)
    serveStatic.forEach(middleware => middlewares.push(middleware))
  }

  middlewares.push(errorPage)

  // Combine all middlewares into one
  const app = compose(middlewares)

  // If HTTPS options are available, create an HTTPS server
  if (options.https) {
    server = createHttpsServer(options.https, app).listen(
      options.port,
      options.host
    )
  } else {
    server = createServer(app).listen(options.port, options.host)
  }

  let running = options.verbose === false

  return {
    name: 'serve',
    generateBundle() {
      if (!running) {
        running = true

        // Log which url to visit
        const url =
          (options.https ? 'https' : 'http') +
          '://' +
          (options.host || 'localhost') +
          ':' +
          options.port
        options.contentBase.forEach(base => {
          console.log(green(url) + ' -> ' + resolve(base))
        })

        // Open browser
        if (options.open) {
          if (/https?:\/\/.+/.test(options.openPage)) {
            opener(options.openPage)
          } else {
            opener(url + options.openPage)
          }
        }
      }
    }
  }

  function setHeaders(req, res, next) {
    Object.keys(options.headers).forEach(key => {
      res.setHeader(key, options.headers[key])
    })
    next()
  }

  function errorPage(req, res) {
    res.writeHead(404)
    res.end(
      '404 Not Found' + '\n\n' + req.originalUrl + '\n\n(rollup-plugin-serve)',
      'utf-8'
    )
  }
}

function green(text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination() {
  const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP']
  terminationSignals.forEach(signal => {
    process.on(signal, () => {
      if (server) {
        server.close()
        process.exit()
      }
    })
  })
}

/**
 * @typedef {Object} ServeOptions
 * @property {boolean} [open=false] Launch in browser (default: `false`)
 * @property {string} [openPage=''] Page to navigate to when opening the browser. Will not do anything if `open` is `false`. Remember to start with a slash e.g. `'/different/page'`
 * @property {boolean} [verbose=true] Show server address in console (default: `true`)
 * @property {string|string[]} [contentBase=''] Folder(s) to serve files from
 * @property {string|boolean} [historyApiFallback] Path to fallback page. Set to `true` to return index.html (200) instead of error page (404)
 * @property {string} [host='localhost'] Server host (default: `'localhost'`)
 * @property {number} [port=10001] Server port (default: `10001`)
 * @property {ServeOptionsHttps} [https=false] By default server will be served over HTTP (https: `false`). It can optionally be served over HTTPS
 * @property {{[header:string]: string}} [headers] Set headers
 */

/**
 * @typedef {Object} ServeOptionsHttps
 * @property {string|Buffer|Buffer[]|Object[]} key
 * @property {string|Buffer|Array<string|Buffer>} cert
 * @property {string|Buffer|Array<string|Buffer>} ca
 * @see https.ServerOptions
 */

import Express from 'express'
import killable from 'killable'
import compress from 'compression'
import serveIndex from 'serve-index'
import historyApiFallback from 'connect-history-api-fallback'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { createServer as createHttpsServer } from 'https'
import { createServer } from 'http'
import { resolve } from 'path'

import mime from 'mime'
import opener from 'opener'

let server
let app

/**
 * Serve your rolled up bundle like webpack-dev-server
 * @param {ServeOptions|string|string[]} options
 */
function serve (options = { contentBase: '' }) {
  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options }
  }
  options.contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase || '']
  options.contentBasePublicPath = options.contentBasePublicPath || '/'
  options.port = options.port || 10001
  options.headers = options.headers || {}
  options.https = options.https || false
  options.openPage = options.openPage || ''
  options.compress = !!options.compress
  options.serveIndex = options.serveIndex || (options.serveIndex === undefined)
  mime.default_type = 'text/plain'

  function setupProxy () {
    /**
     * Assume a proxy configuration specified as:
     * proxy: {
     *   'context': { options }
     * }
     * OR
     * proxy: {
     *   'context': 'target'
     * }
     */
    if (!Array.isArray(options.proxy)) {
      if (Object.prototype.hasOwnProperty.call(options.proxy, 'target')) {
        options.proxy = [options.proxy]
      } else {
        options.proxy = Object.keys(options.proxy).map((context) => {
          let proxyOptions
          // For backwards compatibility reasons.
          const correctedContext = context
            .replace(/^\*$/, '**')
            .replace(/\/\*$/, '')

          if (typeof options.proxy[context] === 'string') {
            proxyOptions = {
              context: correctedContext,
              target: options.proxy[context]
            }
          } else {
            proxyOptions = Object.assign({}, options.proxy[context])
            proxyOptions.context = correctedContext
          }

          proxyOptions.logLevel = proxyOptions.logLevel || 'warn'

          return proxyOptions
        })
      }
    }

    const getProxyMiddleware = (proxyConfig) => {
      const context = proxyConfig.context || proxyConfig.path

      // It is possible to use the `bypass` method without a `target`.
      // However, the proxy middleware has no use in this case, and will fail to instantiate.
      if (proxyConfig.target) {
        return createProxyMiddleware(context, proxyConfig)
      }
    }
    /**
     * Assume a proxy configuration specified as:
     * proxy: [
     *   {
     *     context: ...,
     *     ...options...
     *   },
     *   // or:
     *   function() {
     *     return {
     *       context: ...,
     *       ...options...
     *     };
     *   }
     * ]
     */
    options.proxy.forEach((proxyConfigOrCallback) => {
      let proxyMiddleware

      let proxyConfig =
        typeof proxyConfigOrCallback === 'function'
          ? proxyConfigOrCallback()
          : proxyConfigOrCallback

      proxyMiddleware = getProxyMiddleware(proxyConfig)

      function proxyHandle (req, res, next) {
        if (typeof proxyConfigOrCallback === 'function') {
          const newProxyConfig = proxyConfigOrCallback()

          if (newProxyConfig !== proxyConfig) {
            proxyConfig = newProxyConfig
            proxyMiddleware = getProxyMiddleware(proxyConfig)
          }
        }

        // - Check if we have a bypass function defined
        // - In case the bypass function is defined we'll retrieve the
        // bypassUrl from it otherwise bypassUrl would be null
        const isByPassFuncDefined = typeof proxyConfig.bypass === 'function'
        const bypassUrl = isByPassFuncDefined
          ? proxyConfig.bypass(req, res, proxyConfig)
          : null

        if (typeof bypassUrl === 'boolean') {
          // skip the proxy
          req.url = null
          next()
        } else if (typeof bypassUrl === 'string') {
          // byPass to that url
          req.url = bypassUrl
          next()
        } else if (proxyMiddleware) {
          return proxyMiddleware(req, res, next)
        } else {
          next()
        }
      }

      app.use(proxyHandle)
      // Also forward error requests to the proxy so it can handle them.
      // eslint-disable-next-line handle-callback-err
      app.use((error, req, res, next) => proxyHandle(req, res, next))
    })
  }

  // release previous server instance if rollup is reloading configuration in watch mode
  if (server) {
    server.kill()
  } else {
    closeServerOnTermination()
  }

  app = new Express()

  // Implement webpack-dev-server features
  const features = {
    compress: () => {
      if (options.compress) {
        app.use(compress())
      }
    },
    proxy: () => {
      if (options.proxy) {
        setupProxy()
      }
    },
    historyApiFallback: () => {
      if (options.historyApiFallback) {
        const fallback =
          typeof options.historyApiFallback === 'object'
            ? options.historyApiFallback
            : typeof options.historyApiFallback === 'string'
              ? { index: options.historyApiFallback, disableDotRule: true } : null

        app.use(historyApiFallback(fallback))
      }
    },
    contentBaseFiles: () => {
      if (Array.isArray(options.contentBase)) {
        options.contentBase.forEach((item) => {
          app.use(options.contentBasePublicPath, Express.static(item))
        })
      } else {
        app.use(
          options.contentBasePublicPath,
          Express.static(options.contentBase, options.staticOptions)
        )
      }
    },
    contentBaseIndex: () => {
      if (options.contentBase && options.serveIndex) {
        const getHandler = item => function indexHandler (req, res, next) {
          // serve-index doesn't fallthrough non-get/head request to next middleware
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next()
          }

          serveIndex(item)(req, res, next)
        }
        if (Array.isArray(options.contentBase)) {
          options.contentBase.forEach((item) => {
            app.use(options.contentBasePublicPath, getHandler(item))
          })
        } else {
          app.use(options.contentBasePublicPath, getHandler(options.contentBase))
        }
      }
    },
    before: () => {
      if (typeof options.before === 'function') {
        options.before(app)
      }
    },
    after: () => {
      if (typeof options.after === 'function') {
        options.after(app)
      }
    },
    headers: () => {
      app.all('*', function headersHandler (req, res, next) {
        if (options.headers) {
          for (const name in options.headers) {
            res.setHeader(name, options.headers[name])
          }
        }
        next()
      })
    }
  }

  const runnableFeatures = []

  if (options.compress) {
    runnableFeatures.push('compress')
  }

  runnableFeatures.push('before', 'headers')

  if (options.proxy) {
    runnableFeatures.push('proxy')
  }

  if (options.contentBase !== false) {
    runnableFeatures.push('contentBaseFiles')
  }

  if (options.historyApiFallback) {
    runnableFeatures.push('historyApiFallback')

    if (options.contentBase !== false) {
      runnableFeatures.push('contentBaseFiles')
    }
  }

  if (options.contentBase && options.serveIndex) {
    runnableFeatures.push('contentBaseIndex')
  }

  if (options.after) {
    runnableFeatures.push('after')
  }

  (options.features || runnableFeatures).forEach((feature) => {
    features[feature]()
  })

  // If HTTPS options are available, create an HTTPS server
  if (options.https) {
    server = createHttpsServer(options.https, app).listen(options.port, options.host)
  } else {
    server = createServer(app).listen(options.port, options.host)
  }

  killable(server)

  let running = options.verbose === false

  return {
    name: 'serve',
    generateBundle () {
      if (!running) {
        running = true

        // Log which url to visit
        const url = (options.https ? 'https' : 'http') + '://' + (options.host || 'localhost') + ':' + options.port
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
}

function green (text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination () {
  const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP']
  terminationSignals.forEach(signal => {
    process.on(signal, () => {
      if (server) {
        server.kill()
        process.exit()
      }
    })
  })
}

export default serve

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

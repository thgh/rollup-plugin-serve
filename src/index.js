import { createServer as createHttpsServer } from 'https'
import { createServer } from 'http'
import { resolve } from 'path'
import { Mime } from 'mime/lite'

import standardTypes from 'mime/types/standard.js'
import otherTypes from 'mime/types/other.js'

import opener from 'opener'

import express from 'express'
import killable from 'killable'
import compress from 'compression'
import serveIndex from 'serve-index'
import historyApiFallback from 'connect-history-api-fallback'
import { createProxyMiddleware } from 'http-proxy-middleware'

let server
let app

/**
 * Serve your rolled up bundle like webpack-dev-server
 * @param {import('..').RollupServeOptions} options
 */
function serve(options = { contentBase: '' }) {
  const mime = new Mime(standardTypes, otherTypes)
  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options }
  }
  options.contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase || '']
  options.contentBasePublicPath = options.contentBasePublicPath || '/'
  options.port = options.port || 10001
  options.headers = options.headers || {}
  options.https = options.https || false
  options.openPage = options.openPage || ''
  options.onListening = options.onListening || function noop() {}

  if (options.mimeTypes) {
    mime.define(options.mimeTypes, true)
  }

  // release previous server instance if rollup is reloading configuration in watch mode
  if (server) {
    server.kill()
  } else {
    closeServerOnTermination()
  }

  app = express()

  // has to be the first, see https://stackoverflow.com/a/62771495/623816
  if (options.compress) {
    const compressOptions = typeof options.compress === 'object' ? options.compress : {}
    app.use(compress(compressOptions))
  }

  if (typeof options.before === 'function') {
    options.before(app)
  }

  if (options.headers) {
    function headersHandler(req, res, next) {
      for (const name in options.headers) {
        res.setHeader(name, options.headers[name])
      }
      next()
    }

    app.use(headersHandler)
  }

  if (options.proxy) {
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
          const correctedContext = context.replace(/^\*$/, '**').replace(/\/\*$/, '')

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
     *     }
     *   }
     * ]
     */
    options.proxy.forEach((proxyConfigOrCallback) => {
      let proxyMiddleware

      let proxyConfig = typeof proxyConfigOrCallback === 'function' ? proxyConfigOrCallback() : proxyConfigOrCallback

      proxyMiddleware = getProxyMiddleware(proxyConfig)

      function proxyHandle(req, res, next) {
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
        const bypassUrl = isByPassFuncDefined ? proxyConfig.bypass(req, res, proxyConfig) : null

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

  for (const contentDir of options.contentBase) {
    app.use(options.contentBasePublicPath, express.static(contentDir, options.staticOptions))
  }

  if (options.historyApiFallback) {
    const fallback =
      typeof options.historyApiFallback === 'object'
        ? options.historyApiFallback
        : typeof options.historyApiFallback === 'string'
          ? { index: options.historyApiFallback, disableDotRule: true }
          : null

    app.use(historyApiFallback(fallback))

    // serve-static once more, see https://github.com/webpack/webpack-dev-server/pull/2670#discussion_r464946541
    for (const contentDir of options.contentBase) {
      app.use(options.contentBasePublicPath, express.static(contentDir, options.staticOptions))
    }
  }

  if (options.serveIndex) {
    const getHandler = (item) =>
      function indexHandler(req, res, next) {
        // serve-index doesn't fallthrough non-get/head request to next middleware
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          return next()
        }

        const indexOptions = typeof options.serveIndex === 'object' ? options.serveIndex : {}
        serveIndex(item, indexOptions)(req, res, next)
      }
    for (const contentDir of options.contentBase) {
      app.use(options.contentBasePublicPath, getHandler(contentDir))
    }
  }

  if (typeof options.after === 'function') {
    options.after(app)
  }

  // If HTTPS options are available, create an HTTPS server
  server = options.https ? createHttpsServer(options.https, app) : createServer(app)
  killable(server)
  server.listen(options.port, options.host, () => options.onListening(server))

  // Assemble url for error and info messages
  const url = (options.https ? 'https' : 'http') + '://' + (options.host || 'localhost') + ':' + options.port

  // Handle common server errors
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(url + ' is in use, either stop the other server or use a different port.')
      process.exit()
    } else {
      throw e
    }
  })

  let first = true

  return {
    name: 'serve',
    generateBundle() {
      if (first) {
        first = false

        // Log which url to visit
        if (options.verbose !== false) {
          options.contentBase.forEach((base) => {
            console.log(green(url) + ' -> ' + resolve(base))
          })
        }

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

function green(text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination() {
  const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP']
  terminationSignals.forEach((signal) => {
    process.on(signal, () => {
      if (server) {
        server.kill()
        process.exit()
      }
    })
  })
}

export default serve

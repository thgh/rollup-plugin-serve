import { readFile } from 'fs'
import { createServer as createHttpsServer } from 'https'
import { createServer } from 'http'
import { resolve, posix } from 'path'

import mime from 'mime'
import opener from 'opener'

let server

/**
 * Serve your rolled up bundle like webpack-dev-server
 * @param {import('..').RollupServeOptions} options
 */
function serve (options = { contentBase: '' }) {
  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options }
  }
  options.contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase || '']
  options.contentBasePublicPath = options.contentBasePublicPath || ''
  options.port = options.port || 10001
  options.headers = options.headers || {}
  options.https = options.https || false
  options.openPage = options.openPage || ''
  options.onListening = options.onListening || function noop () { }
  mime.default_type = 'text/plain'

  if (options.mimeTypes) {
    mime.define(options.mimeTypes, true)
  }

  const requestListener = (request, response) => {
    // Remove querystring
    const unsafePath = decodeURI(request.url.split('?')[0])

    // Don't allow path traversal
    const urlPath = posix.normalize(unsafePath)

    Object.keys(options.headers).forEach((key) => {
      response.setHeader(key, options.headers[key])
    })

    readFileFromContentBase(options.contentBase, options.contentBasePublicPath, urlPath, function (error, content, filePath) {
      if (!error) {
        return found(response, filePath, content)
      }
      if (error.code !== 'ENOENT') {
        response.writeHead(500)
        response.end('500 Internal Server Error' +
          '\n\n' + filePath +
          '\n\n' + Object.values(error).join('\n') +
          '\n\n(rollup-plugin-serve)', 'utf-8')
        return
      }
      if (options.historyApiFallback) {
        const fallbackPath = typeof options.historyApiFallback === 'string' ? options.historyApiFallback : '/index.html'
        readFileFromContentBase(options.contentBase, options.contentBasePublicPath, fallbackPath, function (error, content, filePath) {
          if (error) {
            notFound(response, filePath)
          } else {
            found(response, filePath, content)
          }
        })
      } else {
        notFound(response, filePath)
      }
    })
  }

  // release previous server instance if rollup is reloading configuration in watch mode
  if (server) {
    server.close()
  } else {
    closeServerOnTermination()
  }

  // If HTTPS options are available, create an HTTPS server
  server = options.https
    ? createHttpsServer(options.https, requestListener)
    : createServer(requestListener)
  server.listen(options.port, options.host, () => options.onListening(server))

  // Assemble url for error and info messages
  const url = (options.https ? 'https' : 'http') + '://' + (options.host || 'localhost') + ':' + options.port

  // Handle common server errors
  server.on('error', e => {
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
    generateBundle () {
      if (first) {
        first = false

        // Log which url to visit
        if (options.verbose !== false) {
          options.contentBase.forEach(base => {
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

function readFileFromContentBase (contentBase, contentBasePublicPath, urlPath, callback) {
  let internalUrlPath = urlPath
  if (contentBasePublicPath) {
    if (urlPath === contentBasePublicPath) {
      internalUrlPath = '/'
    } else if (urlPath.startsWith(contentBasePublicPath)) {
      internalUrlPath = internalUrlPath.replace(contentBasePublicPath, '')
    }
  }

  let filePath = resolve(contentBase[0] || '.', '.' + internalUrlPath)

  // Load index.html in directories
  if (internalUrlPath.endsWith('/')) {
    filePath = resolve(filePath, 'index.html')
  }

  readFile(filePath, (error, content) => {
    if (error && contentBase.length > 1) {
      // Try to read from next contentBase
      readFileFromContentBase(contentBase.slice(1), contentBasePublicPath, urlPath, callback)
    } else {
      // We know enough
      callback(error, content, filePath)
    }
  })
}

function notFound (response, filePath) {
  response.writeHead(404)
  response.end('404 Not Found' +
    '\n\n' + filePath +
    '\n\n(rollup-plugin-serve)', 'utf-8')
}

function found (response, filePath, content) {
  response.writeHead(200, { 'Content-Type': mime.getType(filePath) })
  response.end(content, 'utf-8')
}

function green (text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination () {
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

export default serve

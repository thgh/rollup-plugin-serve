import { readFile } from 'fs'
import { createServer as createHttpsServer } from 'https'
import { createServer } from 'http'
import { resolve } from 'path'

import mime from 'mime'
import opener from 'opener'

let server

/**
 * Serve your rolled up bundle like webpack-dev-server
 * @param {ServeOptions|string|string[]} options
 */
function serve (options = { contentBase: '' }) {
  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options }
  }
  options.contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase]
  options.host = options.host || 'localhost'
  options.port = options.port || 10001
  options.headers = options.headers || {}
  options.https = options.https || false
  options.openPage = options.openPage || ''
  mime.default_type = 'text/plain'

  const requestListener = (request, response) => {
    // Remove querystring
    const urlPath = decodeURI(request.url.split('?')[0])

    Object.keys(options.headers).forEach((key) => {
      response.setHeader(key, options.headers[key])
    })

    // Get range request header, For example: `range: bytes=0-5``
    const range = request.headers['range']
    let rangeSta = 0
    let rangeEnd = 0
    if (range) {
      const [, start, end] = range.match(/(\d*)-(\d*)/)
      rangeSta = +start || 0
      rangeEnd = +end || 0
    }

    readFileFromContentBase(options.contentBase, urlPath, function (error, content, filePath) {
      if (!error) {
        return found(response, filePath, content, rangeSta, rangeEnd)
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
        var fallbackPath = typeof options.historyApiFallback === 'string' ? options.historyApiFallback : '/index.html'
        readFileFromContentBase(options.contentBase, fallbackPath, function (error, content, filePath) {
          if (error) {
            notFound(response, filePath)
          } else {
            found(response, filePath, content, rangeSta, rangeEnd)
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
  }

  // If HTTPS options are available, create an HTTPS server
  if (options.https) {
    server = createHttpsServer(options.https, requestListener).listen(options.port, options.host)
  } else {
    server = createServer(requestListener).listen(options.port, options.host)
  }

  closeServerOnTermination(server)

  var running = options.verbose === false

  return {
    name: 'serve',
    generateBundle () {
      if (!running) {
        running = true

        // Log which url to visit
        const url = (options.https ? 'https' : 'http') + '://' + options.host + ':' + options.port
        options.contentBase.forEach(base => {
          console.log(green(url) + ' -> ' + resolve(base))
        })

        // Open browser
        if (options.open) {
          opener(url + options.openPage)
        }
      }
    }
  }
}

function readFileFromContentBase (contentBase, urlPath, callback) {
  let filePath = resolve(contentBase[0] || '.', '.' + urlPath)

  // Load index.html in directories
  if (urlPath.endsWith('/')) {
    filePath = resolve(filePath, 'index.html')
  }

  readFile(filePath, (error, content) => {
    if (error && contentBase.length > 1) {
      // Try to read from next contentBase
      readFileFromContentBase(contentBase.slice(1), urlPath, callback)
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

function found (response, filePath, content, rangeSta, rangeEnd) {
  const headers = {
    'Content-Type': mime.getType(filePath)
  }
  let statusCode = 200
  if (rangeSta !== 0 || rangeEnd !== 0) {
    statusCode = 206
    const len = content.length
    const maxEnd = len - 1;
    if (rangeEnd === 0) {
      rangeEnd = maxEnd
    }
    rangeEnd = Math.min(maxEnd, rangeEnd)
    content = content.slice(rangeSta, rangeEnd)
    headers['Accept-Ranges'] = 'bytes'
    headers['Content-Range'] = `bytes ${rangeSta}-${rangeEnd}/${len}`
  }
  headers['Content-Length'] = content.length
  response.writeHead(statusCode, headers)
  response.end(content, 'utf-8')
}

function green (text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination (server) {
  const terminationSignals = ['SIGINT', 'SIGTERM']
  terminationSignals.forEach((signal) => {
    process.on(signal, () => {
      server.close()
      process.exit()
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

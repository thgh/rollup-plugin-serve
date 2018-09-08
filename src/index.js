import { readFile } from 'fs'
import { createServer as createHttpsServer } from 'https'
import { createServer } from 'http'
import { resolve } from 'path'

import mime from 'mime'
import opener from 'opener'

export default function serve (options) {
  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options }
  }

  options = Object.assign({
    contentBase: '',
    indexFiles: 'index.html',
    fileExtensions: [],
    host: 'localhost',
    port: 10001,
    headers: {},
    https: false
  }, options)

  options.contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase]
  options.indexFiles = Array.isArray(options.indexFiles) ? options.indexFiles : [options.indexFiles]
  options.fileExtensions = Array.isArray(options.fileExtensions) ? options.fileExtensions : [options.fileExtensions]
  mime.default_type = 'text/plain'

  const requestListener = (request, response) => {
    // Remove querystring
    const urlPath = decodeURI(request.url.split('?')[0])

    Object.keys(options.headers).forEach((key) => {
      response.setHeader(key, options.headers[key])
    })

    readFileFromContentBase(options, urlPath, response, function (error, content, filePath) {
      if (!error) {
        return found(response, filePath, content)
      }
      if (error.code !== 'ENOENT') {
        response.writeHead(500)
        response.end('500 Internal Server Error' +
          '\n\n' + filePath +
          '\n\n' + Object.keys(error).map(function (k) {
            return error[k]
          }).join('\n') +
          '\n\n(rollup-plugin-serve)', 'utf-8')
        return
      }
      if (request.url === '/favicon.ico') {
        filePath = resolve(__dirname, '../dist/favicon.ico')
        readFile(filePath, function (error, content) {
          if (error) {
            notFound(response, filePath)
          } else {
            found(response, filePath, content)
          }
        })
      } else if (options.historyApiFallback) {
        readFileFromContentBase(options, '/index.html', response, function (error, content, filePath) {
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

  // If HTTPS options are available, create an HTTPS server
  let server
  if (options.https) {
    server = createHttpsServer(options.https, requestListener).listen(options.port)
  } else {
    server = createServer(requestListener).listen(options.port)
  }

  closeServerOnTermination(server)

  var running = options.verbose === false

  return {
    name: 'serve',
    ongenerate () {
      if (!running) {
        running = true

        // Log which url to visit
        const url = (options.https ? 'https' : 'http') + '://' + options.host + ':' + options.port
        options.contentBase.forEach(base => {
          console.log(green(url) + ' -> ' + resolve(base))
        })

        // Open browser
        if (options.open) {
          opener(url)
        }
      }
    }
  }
}

function readFileFromContentBase (options, urlPath, response, callback) {
  const contentBase = options.contentBase
  const candidateFiles = [''].concat(options.indexFiles)
  const fileExtensions = [''].concat(options.fileExtensions)

  let extIdx = 0
  let baseIdx = 0
  let fileIdx = 0

  function tryFile () {
    const crtExt = fileExtensions[extIdx]
    const crtBase = contentBase[baseIdx]
    const crtFile = candidateFiles[fileIdx]

    const filePath = resolve(crtBase || '.', '.' + urlPath, crtFile) + crtExt

    readFile(filePath, (error, content) => {
      if (error) {
        // when not found, try all the configured file extensions
        if (extIdx < fileExtensions.length - 1) {
          extIdx += 1
          return tryFile()
        } else {
          extIdx = 0
        }

        // when still not found, try all the configured folder indexes
        if (fileIdx < candidateFiles.length - 1) {
          fileIdx += 1
          return tryFile()
        } else {
          fileIdx = 0
        }

        // when still not found, try all the configured content bases
        if (baseIdx < contentBase.length - 1) {
          baseIdx += 1
          return tryFile()
        }
      }

      // when found a file match, but it is one folder deeper, redirect (needed for esm loding)
      if (!error && crtFile !== '') {
        const location = urlPath.replace(/\/+$/, '') + '/' + crtFile
        return redirect(response, location)
      }

      // all done.
      callback(error, content, filePath)
    })
  }
  tryFile()
}

function redirect (response, location) {
  response.writeHead(307, { 'Location': location })
  response.end()
}

function notFound (response, filePath) {
  response.writeHead(404)
  response.end('404 Not Found' +
    '\n\n' + filePath +
    '\n\n(rollup-plugin-serve)', 'utf-8')
}

function found (response, filePath, content) {
  response.writeHead(200, { 'Content-Type': mime.lookup(filePath) })
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

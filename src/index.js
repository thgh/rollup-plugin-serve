import { readFile } from 'fs'
import { createServer } from 'http'
import { resolve } from 'path'

import mime from 'mime'
import opener from 'opener'

export default function serve (options = {}) {
  options.contentBase = options.contentBase || ''
  options.host = options.host || 'localhost'
  options.port = options.port || 10001
  const url = 'http://' + options.host + ':' + options.port

  mime.default_type = 'text/plain'

  createServer(function (request, response) {
    // Remove querystring
    const urlPath = request.url.split('?')[0]
    var filePath = resolve(options.contentBase, '.' + urlPath)

    // Load index.html in directories
    if (urlPath.endsWith('/')) {
      filePath = resolve(filePath, 'index.html')
    }

    readFile(filePath, function (error, content) {
      if (!error)  {
        return found(response, filePath, content)
      }
      if (error.code !== 'ENOENT') {
        response.writeHead(500)
        response.end('500 Internal Server Error' +
          '\n\n' + filePath +
          '\n\n' + Object.keys(error).map(function (k) { return error[k]; }).join('\n') +
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
        filePath = resolve(options.contentBase, 'index.html')
        readFile(filePath, function (error, content) {
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
  }).listen(options.port)

  var running = options.verbose === false

  return {
    name: 'serve',
    ongenerate () {
      if (!running) {
        running = true
        console.log(green(url) + ' -> ' + resolve(options.contentBase))

        // Open browser
        if (options.open) {
          opener(url)
        }
      }
    }
  }
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

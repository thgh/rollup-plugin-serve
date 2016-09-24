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
    var filePath = options.contentBase + request.url.split('?')[0]

    // Load index.html in directories
    if (filePath.endsWith('/')) {
      filePath += 'index.html'
    }

    readFile('.' + filePath, function (error, content) {
      if (error) {
        if (error.code === 'ENOENT') {
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
        } else {
          response.writeHead(500)
          response.end('500 Internal Server Error' +
            '\n\n' + filePath +
            '\n\n' + Object.keys(error).map(k => error[k]).join('\n') +
            '\n\n(rollup-plugin-serve)', 'utf-8')
        }
      } else {
        found(response, filePath, content)
      }
    })
  }).listen(options.port)

  var running = false

  return {
    name: 'serve',
    ongenerate () {
      if (!running && options.open) {
        running = true
        console.log('Server running at ' + green(url))

        // Open browser
        opener(url)
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

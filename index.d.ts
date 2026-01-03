import { Plugin } from 'rollup'
import { IncomingHttpHeaders, OutgoingHttpHeaders, Server } from 'http'
import { ServerOptions } from 'https'
import { TypeMap } from 'mime'
import { Application } from 'express'

export interface RollupServeOptions {
  /**
   * Launch the browser after the first bundle is generated (default: `false`)
   */
  open?: boolean

  /**
   * Change the page that is opened when the browser is launched.
   * Will not do anything if `open = false`.
   * Remember to start with a slash, e.g. `'/different/page'`
   */
  openPage?: string

  /**
   * Show server address in console (default: `true`)
   */
  verbose?: boolean

  /**
   * Serve static files from the specified folder(s).
   */
  contentBase?: string | string[]

  /**
   * URL root path to serve the static content at (default: `'/'`)
   */
  contentBasePublicPath?: string

  /**
   * Options to be passed to the serve-static middleware, see the documentation
   * at https://expressjs.com/en/resources/middleware/serve-static.html.
   */
  staticOptions?: object

  /**
   * Enable compression of the served content. If you want to customize the default
   * settings, see https://expressjs.com/en/resources/middleware/compression.html.
   */
  compress?: boolean | object

  /**
   * Enable directory indexes. If you want to customize the default
   * settings, see https://expressjs.com/en/resources/middleware/serve-index.html.
   */
  serveIndex?: boolean | object

  /**
   * Set to `true` to return index.html (200) instead of error page (404)
   * or path to fallback page
   */
  historyApiFallback?: boolean | string

  /**
   * Change the host of the server (default: `'localhost'`)
   */
  host?: string

  /**
   * Change the port that the server will listen on (default: `10001`)
   */
  port?: number | string

  /**
   * Automatically choose an available port if the specified port is already in use.
   * If set to `true`, the meaning of `port` changes to the initial port to try. (default: `false`)
   */
  autoPort?: boolean

  /**
   * By default server will be served over HTTP (https: `false`). It can optionally be served over HTTPS.
   */
  https?: ServerOptions

  /**
   * Set custom response headers
   */
  headers?:
    | IncomingHttpHeaders
    | OutgoingHttpHeaders
    | {
        // i.e. Parameters<OutgoingMessage["setHeader"]>
        [name: string]: number | string | ReadonlyArray<string>
      }

  /**
   * Set custom mime types, usage https://github.com/broofa/mime#mimedefinetypemap-force--false
   */
  mimeTypes?: TypeMap

  /**
   * Let some requests be forwarded to other servers by their URL path. For example,
   * requests to /api/* be can be forwarded to http://localhost:3000/*. See the full
   * documentation at https://webpack.js.org/configuration/dev-server/#devserverproxy.
   */
  proxy?: object[]

  /**
   * Function to be called before all Express middlewares are installed.
   */
  before?: (app: Application) => void

  /**
   * Function to be called after all Express middlewares are installed.
   */
  after?: (app: Application) => void

  /**
   * Execute function after server has begun listening
   */
  onListening?: (server: Server) => void
}

/**
 * Serve your rolled up bundle like webpack-dev-server
 */
export default function serve(options?: RollupServeOptions | string): Plugin

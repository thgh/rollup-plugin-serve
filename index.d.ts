import { Plugin } from 'rollup'
import { IncomingHttpHeaders, OutgoingHttpHeaders, Server } from 'http'
import { ServerOptions } from 'https'
import { TypeMap } from 'mime'

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
   * Execute function after server has begun listening
   */
  onListening?: (server: Server) => void
}

/**
 * Serve your rolled up bundle like webpack-dev-server
 */
export default function serve(options?: RollupServeOptions | string): Plugin

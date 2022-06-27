import { Plugin } from 'rollup'
import { Server } from 'http'

export interface RollupServeOptions {

  /**
   * Launch in browser (default: false)
   */
  open?: boolean

  /**
   * Page to navigate to when opening the browser.
   * Will not do anything if open=false.
   * Remember to start with a slash.
   */
  openPage?: string

  /**
   * Show server address in console (default: true)
   */
  verbose?: boolean

  /**
   * Folder or multiple folders to serve files from
   */
  contentBase?: string | string[]

  /**
   * Set to true to return index.html (200) instead of error page (404)
   * or path to fallback page
   */
   historyApiFallback?: boolean | string

  /**
   * Host option used in setting up server (default: 'localhost')
   */
  host?: string

  /**
   * Post option used in setting up server (default: '10001')
   */
  port?: string

  /**
   * By default server will be served over HTTP (https: false). It can optionally be served over HTTPS
   */
  https?: {
    key: string | Buffer
    cert: string | Buffer
    ca: string | Buffer
  }

  /**
   * Set headers
   */
  headers?: Headers

  /**
   * Set custom mime types, usage https://github.com/broofa/mime#mimedefinetypemap-force--false
   */
  mimeTypes?: Record<string, string[]>

  /**
   * Execute function after server has begun listening
   */
  onListening?: (server: Server) => void

}

/**
 * A Rollup plugin for including serve in your web app.
 */
export default function serve(
  options?: RollupServeOptions | string
): Plugin
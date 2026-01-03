import buble from '@rollup/plugin-buble'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/index.cjs', format: 'cjs', exports: 'default' },
    { file: 'dist/index.mjs', format: 'esm' }
  ],
  plugins: [
    buble({
      transforms: { forOf: false }
    })
  ],
  external: [
    'fs',
    'https',
    'http',
    'path',
    'mime/lite',
    'mime/types/standard.js',
    'mime/types/other.js',
    'opener',
    'express',
    'killable',
    'compression',
    'serve-index',
    'connect-history-api-fallback',
    'http-proxy-middleware'
  ]
}

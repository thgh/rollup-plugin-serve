# Rollup plugin to serve the bundle

<a href="LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="Software License" />
</a>
<a href="https://github.com/thgh/rollup-plugin-serve/issues">
  <img src="https://img.shields.io/github/issues/thgh/rollup-plugin-serve.svg" alt="Issues" />
</a>
<a href="http://standardjs.com/">
  <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" alt="JavaScript Style Guide" />
</a>
<a href="https://npmjs.org/package/rollup-plugin-serve">
  <img src="https://img.shields.io/npm/v/rollup-plugin-serve.svg?style=flat-squar" alt="NPM" />
</a>
<a href="https://github.com/thgh/rollup-plugin-serve/releases">
  <img src="https://img.shields.io/github/release/thgh/rollup-plugin-serve.svg" alt="Latest Version" />
</a>

## Installation
```
npm install --save-dev rollup-plugin-serve
```

## Usage
```js
// rollup.config.js
import serve from 'rollup-plugin-serve'

export default {
  entry: 'entry.js',
  dest: 'bundle.js',
  plugins: [
    serve('dist')
  ]
}
```

### Options

By default it serves the current project folder. Change it by passing a string:
```js
serve('public')    // will be used as contentBase

// Default options
serve({
  // Launch in browser (default: false)
  open: true,

  // Show server address in console (default: true)
  verbose: false,

  // Folder to serve files from
  contentBase: '',

  // Multiple folders to serve from
  contentBase: ['dist', 'static'],

  // Set to true to return index.html instead of 404
  historyApiFallback: false,

  // Options used in setting up server
  host: 'localhost',
  port: 10001,

  // By default server will be served over HTTP (https: false). It can optionally be served over HTTPS
  https: {
    key: fs.readFileSync("/path/to/server.key"),
    cert: fs.readFileSync("/path/to/server.crt"),
    ca: fs.readFileSync("/path/to/ca.pem")
  },

  //set headers
  headers: {
    foo: 'bar'
  }
})
```

>>>>>>> master
## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Contributing

Contributions and feedback are very welcome.

To get it running:
  1. Clone the project.
  2. `npm install`
  3. `npm run build`

## Credits

- [Thomas Ghysels](https://github.com/thgh)
- [All Contributors][link-contributors]

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

[link-author]: https://github.com/thgh
[link-contributors]: ../../contributors
[rollup-plugin-serve]: https://www.npmjs.com/package/rollup-plugin-serve

# Changelog

All notable changes to `rollup-plugin-serve` will be documented in this file.

## [3.0.1] - 2026-01-01

### Fixed

- Add types condition to package.json exports field #105 @A-floweR-y

## [3.0.0] - 2023-12-01

### Changed

- Upgrade to mime version 4 #101 @Frank3K
- Upgrade to rollup 4
- Upgrade packages

### Fixed

- Fix MIME type for history api fallback
- Add tests for MIME types

## [2.0.3] - 2023-12-01

### Fixed

- Fix mime dependency range

## [2.0.2] - 2022-11-27

### Fixed

- Deduplicate types and only keep index.d.ts
- Fix incorrect paths in package.json
- Use consistent wording in types

## [2.0.1] - 2022-08-11

### Fixed

- Add index.d.ts to npm package

## [2.0.0] - 2022-06-29

### Added

- Add TypeScript type definitions #89 @foretoo

### Changed

- Specify package exports and use .mjs and .cjs file extensions
- Upgrade dependencies
- Remove old rollup version from readme

## [1.1.1] - 2023-12-14

### Fixed

- Fix mime dependency

## [1.1.0] - 2020-11-01

### Added

- Add `onListening` hook #69 @filoxo
- Show error message when port is in use #60 @jaeh

## [1.0.4] - 2020-08-28

### Added

- Add `mimeTypes` option #58 @GerardRodes

### Fixed

- Allow opening the browser even when verbose mode is disabled #64 @Richienb

## [1.0.3] - 2020-07-21

### Fixed

- Fix path.normalize error on Windows

## [1.0.2] - 2020-07-17

### Fixed

- Fix path traversal issue

## [1.0.1] - 2019-01-27

### Added

- Add Intellisense support #34

### Fixed

- Set minimum version for `mime` package

## [1.0.0] - 2019-01-11

### Fixed

- Update `ongenerate` to `generateBundle`

### Removed

- Remove built-in `favicon.ico` #20

## [0.6.1] - 2018-12-23

### Added

- Add support for `rollup --watch` (Release http server on rollup reload)

## [0.5.0] - 2018-09-18

### Added

- Allow to override path for historyApiFallback option
- Option `openPage`

### Fixed

- Fix host option

## [0.4.2] - 2017-08-25

### Added

- Option `https`

## [0.4.1] - 2017-08-16

### Added

- Option `headers`

### Fixed

- Close the server when a termination signal is encountered

## [0.4.0] - 2017-07-02

### Fixed

- Various fixes to contentBase handling

## [0.3.0] - 2017-04-07

### Changed

- Allow to pass array as contentBase

## [0.2.0] - 2017-04-07

### Changed

- Show console message only once

## [0.1.0] - 2016-09-29

### Added

- Option `open` open the project in browser
- Option `historyApiFallback`
- Default green favicon

## Changed

- Option `root` is now `contentBase`

## [0.0.1] - 2016-09-24

### Added

- Initial version

[Unreleased]: https://github.com/thgh/rollup-plugin-serve/compare/v3.0.1...HEAD
[3.0.1]: https://github.com/thgh/rollup-plugin-serve/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/thgh/rollup-plugin-serve/compare/v2.0.3...v3.0.0
[2.0.3]: https://github.com/thgh/rollup-plugin-serve/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/thgh/rollup-plugin-serve/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/thgh/rollup-plugin-serve/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/thgh/rollup-plugin-serve/compare/v1.1.1...v2.0.0
[1.1.1]: https://github.com/thgh/rollup-plugin-serve/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/thgh/rollup-plugin-serve/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/thgh/rollup-plugin-serve/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/thgh/rollup-plugin-serve/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/thgh/rollup-plugin-serve/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/thgh/rollup-plugin-serve/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/thgh/rollup-plugin-serve/compare/v0.6.1...v1.0.0
[0.6.1]: https://github.com/thgh/rollup-plugin-serve/compare/v0.5.0...v0.6.1
[0.5.0]: https://github.com/thgh/rollup-plugin-serve/compare/v0.4.2...v0.5.0
[0.4.2]: https://github.com/thgh/rollup-plugin-serve/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/thgh/rollup-plugin-serve/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/thgh/rollup-plugin-serve/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/thgh/rollup-plugin-serve/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/thgh/rollup-plugin-serve/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/thgh/rollup-plugin-serve/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/thgh/rollup-plugin-serve/releases

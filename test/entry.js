import lib from './lib.js'
// prettier-ignore
window.onload = () =>
  (document.body.innerHTML +=
    '<br>Path: ' + window.location.pathname +
    '<br>' + lib)

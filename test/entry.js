import lib from './lib.js'

window.onload = () =>
  (document.body.innerHTML +=
    '<br>Path: ' + window.location.pathname +
    '<br>' + lib)

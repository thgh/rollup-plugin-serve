"use strict";

async function getMimeType(path) {
  const response = await fetch(path);
  return response.headers.get("Content-Type");
}

async function checkMimes() {
  const paths = [
    "fixtures/demo.json",
    "fixtures/demo.abc",
    "fixtures/demo.fgh",
  ];
  for (const path of paths) {
    const mimeType = await getMimeType(path);
    document.body.innerHTML += '<br>"' + path + '": ' + mimeType;
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", checkMimes);
} else {
  checkMimes();
}

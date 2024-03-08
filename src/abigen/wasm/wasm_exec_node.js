"use strict";

const crypto = require("crypto");

globalThis.require = require;
globalThis.fs = require("fs");
globalThis.TextEncoder = require("util").TextEncoder;
globalThis.TextDecoder = require("util").TextDecoder;

globalThis.performance = {
  now() {
    const [sec, nsec] = process.hrtime();
    return sec * 1000 + nsec / 1000000;
  },
};

Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues(b) {
      crypto.randomFillSync(b);
    },
  },
  configurable: true,
  writable: true,
});

require("./wasm_exec");

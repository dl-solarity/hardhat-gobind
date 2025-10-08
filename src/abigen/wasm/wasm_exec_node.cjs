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
  // Preserve any existing webcrypto implementation (including subtle) and
  // ensure getRandomValues is available. Prefer Node's built-in webcrypto.
  value: (() => {
    const existing = globalThis.crypto;
    const nodeWebCrypto = crypto.webcrypto;

    // Start from the most capable available source
    const base = nodeWebCrypto || existing || {};

    // Ensure getRandomValues exists (needed by Go WASM runtime)
    if (typeof base.getRandomValues !== "function") {
      base.getRandomValues = (b) => crypto.randomFillSync(b);
    }

    return base;
  })(),
  configurable: true,
  writable: true,
});

require("./wasm_exec.cjs");

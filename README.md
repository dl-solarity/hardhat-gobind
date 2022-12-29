[![npm](https://img.shields.io/npm/v/@dlsl/hardhat-gobind.svg)](https://www.npmjs.com/package/@dlsl/hardhat-gobind) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat GoBind

[Hardhat](https://hardhat.org) plugin to simplify generation of smart contract bindings for Golang.

## What

This plugin helps you generate `.go` files with bindings to call smart contracts from Go code. It uses `abigen`, a `wasm` binary, build from [go-ethereum/cmd/abigen](https://github.com/ethereum/go-ethereum/tree/master/cmd/abigen) Go module.

## Installation

```bash
npm install --save-dev @dlsl/hardhat-gobind
```

And add the following statement to your `hardhat.config.js`:

```js
require("@dlsl/hardhat-gobind")
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```ts
import "@dlsl/hardhat-gobind"
```

## Tasks

The bindings generation can be run either with built-in `compile` or the provided `gobind` task.

To view the available options, run these help commands:

```bash
npx hardhat help compile
npx hardhat help gobind
```

## Environment extensions

This plugin does not extend the environment.

## Usage

You may add the following config to your *hardhat config* file:

```js
module.exports = {
  gobind: {
    outdir: "./generated-types/gobindings",
    deployable: false,
    runOnCompile: false,
  },
}
```

### Parameter explanation

- `outdir` : The directory where the generated bindings will be places
- `deployable` : The flag to generate the bindings with the bytecode (makes them deployable within Go)
- `runOnCompile` : Whether to run bindings generation on compilation

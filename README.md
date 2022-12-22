# Hardhat GoBind

[Hardhat](https://hardhat.org) plugin to simplify generation of smart-contract bindings for Golang.

## What

This plugin helps you generate `.go` file with bindings to call a smart-contract from Go code. It takes contract ABI from Hardhat Runtime Environment and calls `abigen` command, which is Go binary build from [go-ethereum/cmd/abigen](https://github.com/ethereum/go-ethereum/tree/master/cmd/abigen) Go module.

## Installation

```bash
npm install --save-dev @dlsl/hardhat-gobind
```

And add the following statement to your `hardhat.config.js`:

```js
require("@dlsl/hardhat-gobind");
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```ts
import "@dlsl/hardhat-gobind";
```

## Tasks

The generation can be run either with built-in `compile` or the provided `gobind` task.

To view the available options, run these help commands:
```bash
npx hardhat help compile
npx hardhat help gobind
```

## Environment extensions

This plugin does not extend the environment.

## Usage

You need to add the following config to your `hardhat.config.js` file:

```js
module.exports = {
  migrate: {
    outDir: "./artifacts/gobind",
    runOnCompile: false,
  },
};
```

### Parameter explanation

- `outDir` : Directory to generate bindings into
- `runOnCompile` : Whether to run binding generation on compile, may be disabled for increasing performance purposes


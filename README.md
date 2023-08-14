[![npm](https://img.shields.io/npm/v/@solarity/hardhat-gobind.svg)](https://www.npmjs.com/package/@solarity/hardhat-gobind) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat GoBind

[Hardhat](https://hardhat.org) plugin to simplify generation of smart contract bindings for Golang.

## What

This plugin helps you generate `.go` files with bindings to call smart contracts from Go code. To produce them, the plugin uses `abigen` in a `wasm` binary form that is built from [go-ethereum/cmd/abigen](https://github.com/ethereum/go-ethereum/tree/master/cmd/abigen) Go module.

## Installation

```bash
npm install --save-dev @solarity/hardhat-gobind
```

Add the following statement to your `hardhat.config.js`:

```js
require("@solarity/hardhat-gobind")
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```ts
import "@solarity/hardhat-gobind"
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

The plugin works out of the box: `npx hardhat gobind` will compile and generate bindings for all the contracts used in the project into the default folder.

To generate the most recent bindings, clean old artifacts with `npx hardhat clean` beforehand.

### Configuration

The default configuration looks as follows. You may customize all fields in your *hardhat config* file.

```js
module.exports = {
  gobind: {
    outdir: "./generated-types/bindings",
    deployable: false,
    runOnCompile: false,
    verbose: false,
    onlyFiles: [],
    skipFiles: [],
  },
}
```

- `outdir` : The directory where the generated bindings will be placed
- `deployable` : Generates the bindings with the bytecode (makes them deployable within Go)
- `runOnCompile` : Whether to run bindings generation on compilation
- `verbose`: Detailed logging on generation (e.g. count of included and skipped contracts, source paths, names)
- `onlyFiles`: If specified, bindings will be generated **only for matching** sources, other will be ignored
- `skipFiles`: Bindings will not be generated for **any matching** sources, also if those match `onlyFiles`

Some of the parameters are only available in CLI and they override the ones defined in your *hardhat config* (e.g. `--deployable` will generate deploy method regardless of `config.gobind.deployable` value). Run `npx hardhat help gobind` to get available options.

### Including/excluding files

- Path stands for relative path from project root to either `.sol` file or directory.
- If path is a directory, all its files and sub-directories are considered matching.
- If source is a node module, `node_modules` must not be present in the path.

## How it works

The plugin runs `compile` task (if `--no-compile` is not given), gets the artifacts from *Hardhat Runtime Environment* (HRE), filters them according to `onlyFiles` and `skipFiles`, and performs the following actions:

1. Writes contract's ABI (and bytecode, if necessary) into a temporary file `ContractName.abi` (and `ContractName.bin` with bytecode).
2. Derives destination folder from the original file location: if the file is in `./contracts`, the folder will be `./your_outdir/contracts`.
3. Derives Go package name from the parent folder: for `./your_outdir/nested/My_Contracts` it will be `mycontracts`.
4. Calls `abigen` via WebAssembly: `abigen --abi /path/to/file.abi --pkg packagename --type ContractName --lang go --out /path/to/your_project/your_outdir` (and `--bin /path/to/file.bin`, if necessary).
5. Removes temporary files.

Bindings are generated for contracts, not files. Having 3 contracts in a single file, you get 3 `.go` files named after contracts. If you skip the file, all 3 contracts are ignored.

Consider we have Hardhat project with the following structure (excluding some files for brevity):

```
.
├── contracts
│   ├── Example.sol
│   ├── Sample.sol
│   └── interfaces
│       ├── IExample.sol
│       └── ISample.sol
├── hardhat.config.ts
└── node_modules
    └── @openzeppelin
        └── contracts
            └── access
                ├── Ownable.sol
                └── Ownable2Step.sol
```

`npx hardhat gobind` with the default configuration will create the following directory structure. Note there are no `node_modules` parent directory for `@openzeppelin` dependency.

```
generated-types
└── bindings
    ├── @openzeppelin
    │   └── contracts
    │       └── access
    │           ├── Ownable.go
    │           └── Ownable2Step.go
    └── contracts
        ├── Example.go
        ├── Sample.go
        └── interfaces
            ├── IExample.go
            └── ISample.go
```

In most cases, you want bindings only for your `contracts/` directory, excluding `contracts/interfaces` and all the dependencies from `node_modules`.

It is achieved by adding the following into your *hardhat config*:

```js
onlyFiles: ["contracts"],
skipFiles: ["contracts/interfaces", "@openzeppelin", "@solarity"],
```

## Known limitations

- `--verbose` is not available in CLI because of names clash with Hardhat. [Learn more](https://hardhat.org/hardhat-runner/docs/errors#HH202).
- `node_modules` must not be present in the path.

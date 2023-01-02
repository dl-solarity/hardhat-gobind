[![npm](https://img.shields.io/npm/v/@dlsl/hardhat-gobind.svg)](https://www.npmjs.com/package/@dlsl/hardhat-gobind) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat GoBind

[Hardhat](https://hardhat.org) plugin to simplify generation of smart contract bindings for Golang.

## What

This plugin helps you generate `.go` files with bindings to call smart contracts from Go code. To generate them, the plugin uses `abigen` in a `wasm` binary form, that is built from [go-ethereum/cmd/abigen](https://github.com/ethereum/go-ethereum/tree/master/cmd/abigen) Go module.

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

You may use the plugin without custom configuration. After installation simply run `npx hardhat gobind` to generate bindings into the default folder (see the default config below).

**Note.** The plugin generates bindings using existing compilation artifacts, so you may have a message: *Generated bindings for 0 contracts*. To compile your contracts before generation, set `runOnCompile: true` and run `compile` task, or run any of the following:
```bash
npx hardhat compile --generate-bindings
npx hardhat gobind --compile
```

### Configuration

The default configuration looks as follows. You may customize all these fields in your *hardhat config* file.

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
- `verbose`: Detailed logging on generation (e.g. count of included and skipped contracts, source paths and contract name for each binding)
- `onlyFiles`: If specified, bindings will be generated **only for matching** sources, other will be ignored
- `skipFiles`: Bindings will not be generated for **any matching** sources, also if those match `onlyFiles`

Some of the parameters are available in CLI, so they can override the ones defined in your *hardhat config* (e.g. `--deployable` will generate deploy method regardless of `config.gobind.deployable` value). Run `npx hardhat help gobind` to get available options.

### Including/excluding files

- Path stands for relative path from project root to either `.sol` file or directory. Example: `Sample.sol` will be considered as `/your/project/root/Sample.sol`.
- If path is a file, only a single file can match it. Example: `contracts/sample/Sample.sol`, `sample/Sample.sol` and `Sample.sol` are considered different paths.
- If path is a directory, all its files and sub-directories are considered matching.
- If source is a node module, `node_modules` must not be present in path. Example: `sample/Contract.sol` will match `/your/project/root/sample/Contract.sol`, and `node_modules/sample/Contract.sol` will not.

#### Tips and tricks

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

1. Generate bindings only for our contracts (this is basically what you want to do)
```js
onlyFiles: ["contracts/Example.sol", "contracts/Sample.sol"],
```
or
```js
onlyFiles: ["contracts"],
skipFiles: ["contracts/interfaces"],
```
or
```js
skipFiles: ["contracts/interfaces", "@openzeppelin"],
```

2. Generate only for specific contracts (Sample and Ownable)
```js
onlyFiles: ["contracts/Sample.sol", "@openzeppelin/contracts/access/Ownable.sol"],
```

3. Skip specific contracts (Example and its interface) and dependencies
```js
onlyFiles: ["contracts"],
skipFiles: ["contracts/Example.sol", "contracts/interfaces/IExample.sol"],
```
or
```js
skipFiles: ["contracts/Example.sol", "contracts/interfaces/IExample.sol", "@openzeppelin"],
```

## How it works

The plugin gets artifacts from *Hardhat Runtime Environment* (HRE), filters them according to `onlyFiles` and `skipFiles`, and performs the following actions:
1. Write contract's ABI (and bytecode, if necessary) into a temporary file `ContractName.abi` (and `ContractName.bin` with bytecode).
2. Derive destination folder from the original file location: if the file is in `./contracts`, the folder will be `./your_outdir/contracts`.
3. Derive Go package name from the parent folder: for `./your_outdir/nested/My_Contracts` it will be `mycontracts`.
4. Call `abigen` via WebAssembly: `abigen --abi /path/to/file.abi --pkg packagename --type ContractName --lang go --out /path/to/your_project/your_outdir` (and `--bin /path/to/file.bin`, if necessary).
5. Remove temporary files.

Bindings are generated for contracts, not files. Having 3 contracts in a single file, you get 3 `.go` files named after contracts. If you skip this file, all 3 contracts will be ignored as well.

Having the project structure from [Tips and tricks](#tips-and-tricks) and artifacts, after running `npx hardhat gobind` with the default config we'll have the following generated files:
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

Note that there are no `node_modules` parent directory for `@openzeppelin` dependency.

## Known limitations

- `onlyFiles` and `skipFiles` might not work on Windows because of path separator. It was not tested and depends on Hardhat path formatting.
- `--verbose` is not available in CLI because of names clash with Hardhat. [Learn more](https://hardhat.org/hardhat-runner/docs/errors#HH202).
- `node_modules` must not be present in path, because *HRE* drops it from the source path, although specifying `node_modules` can be implemented.

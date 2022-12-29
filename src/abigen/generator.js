require("./wasm/wasm_exec_node");

const camelCase = require("lodash/camelCase");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

module.exports = class Generator {
  constructor(hre) {
    this.abigenPath = path.resolve(
      "./node_modules/@dlsl/hardhat-gobind/bin/abigen.wasm"
    );
    this.lang = "go";
    this.artifacts = hre.artifacts;
    this.outDir = path.resolve(hre.config.gobind.outdir);
    this.deployable = hre.config.gobind.deployable;
  }

  async generateAll() {
    console.log("\nGenerating bindings...");

    const names = await this.artifacts.getAllFullyQualifiedNames();

    await this.generate(names);
  }

  async generate(artifactNames) {
    for (const name of artifactNames) {
      const artifact = await this.artifacts.readArtifact(name);
      const contract = artifact.contractName;
      const source = artifact.sourceName;

      const abiPath = `${this.outDir}/${contract}.abi`;
      const genDir = `${this.outDir}/${path.dirname(source)}`;
      const packageName = path
        .basename(path.dirname(source))
        .replaceAll("-", "")
        .replaceAll("_", "")
        .toLowerCase();
      const genPath = `${genDir}/${contract}.${this.lang}`;

      const argv = `abigen --abi ${abiPath} --pkg ${packageName} --type ${contract} --lang ${this.lang} --out ${genPath}`;

      await fsp.mkdir(genDir, { recursive: true });
      await fsp.writeFile(abiPath, JSON.stringify(artifact.abi));

      if (this.deployable) {
        const binPath = `${this.outDir}/${contract}.bin`;
        const argvBin = `${argv} --bin ${binPath}`;

        await fsp.writeFile(binPath, artifact.bytecode);
        await this.abigen(this.abigenPath, argvBin.split(" "));
        await fsp.rm(binPath);
      } else {
        await this.abigen(this.abigenPath, argv.split(" "));
      }

      await fsp.rm(abiPath);
    }
  }

  async clean() {
    if (!fs.existsSync(this.outDir)) {
      return;
    }

    const dirStats = await fsp.stat(this.outDir);

    if (!dirStats.isDirectory()) {
      throw new Error(`outdir is not a directory: ${this.outDir}`);
    }

    await fsp.rm(this.outDir, { recursive: true });
  }

  async abigen(path, argv) {
    const go = new Go();

    go.argv = argv;
    go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);

    try {
      const abigenObj = await WebAssembly.instantiate(
        await fsp.readFile(path),
        go.importObject
      );

      go.run(abigenObj.instance);
      go._pendingEvent = { id: 0 };
    } catch (e) {
      throw new Error(e.message);
    }
  }
};

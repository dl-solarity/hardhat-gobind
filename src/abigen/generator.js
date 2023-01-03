require("./wasm/wasm_exec_node");

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
    this.onlyFiles = hre.config.gobind.onlyFiles.map((p) => path.normalize(p));
    this.skipFiles = hre.config.gobind.skipFiles.map((p) => path.normalize(p));
  }

  async generate() {
    const names = await this.artifacts.getAllFullyQualifiedNames();

    const filterer = (n) => {
      const src = this.artifacts.readArtifactSync(n).sourceName;
      return (
        (this.onlyFiles.length == 0 || this._contains(this.onlyFiles, src)) &&
        !this._contains(this.skipFiles, src)
      );
    };

    const filtered = names.filter(filterer);
    this._verboseLog(
      `${names.length} compiled contracts found, skipping ${
        names.length - filtered.length
      } of them\n`
    );
    await this._generate(filtered);
    return filtered;
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

  async _generate(artifactNames) {
    const word = this.deployable ? "with" : "without";
    this._verboseLog(
      `Generating bindings into ${this.outDir} ${word} deployment method\n`
    );

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

      this._verboseLog(`${contract}: ${source}`);
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

  _contains(pathList, source) {
    const isSubPath = (parent, child) => {
      const parentTokens = parent.split(path.sep).filter((i) => i.length);
      const childTokens = child.split(path.sep).filter((i) => i.length);
      return parentTokens.every((t, i) => childTokens[i] === t);
    };

    return pathList === undefined
      ? false
      : pathList.some((p) => isSubPath(p, source));
  }

  _verboseLog(msg) {
    if (hre.config.gobind.verbose) console.log(`[GOBIND] ${msg}`);
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

      await go.run(abigenObj.instance);
      go._pendingEvent = { id: 0 };
    } catch (e) {
      throw new Error(e.message);
    }
  }
};

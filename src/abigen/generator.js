require("./wasm/wasm_exec_node");

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

module.exports = class Generator {
  constructor(hre, abigenPath = "./node_modules/@solarity/hardhat-gobind/bin/abigen.wasm") {
    this.abigenVersion = hre.config.gobind.abigenVersion;

    if (this.abigenVersion != "v1" && this.abigenVersion != "v2") {
      throw new Error(`Unsupported abigen version: ${this.abigenVersion}`);
    }

    this.abigenPath = path.resolve(abigenPath);
    this.lang = "go";
    this.artifacts = hre.artifacts;
    this.outDir = path.resolve(hre.config.gobind.outdir);
    this.deployable = hre.config.gobind.deployable;
    this.onlyFiles = hre.config.gobind.onlyFiles.map((p) => this._toUnixPath(path.normalize(p)));
    this.skipFiles = hre.config.gobind.skipFiles.map((p) => this._toUnixPath(path.normalize(p)));
  }

  async generate() {
    const names = await this.artifacts.getAllFullyQualifiedNames();

    const filterer = (n) => {
      const src = this.artifacts.readArtifactSync(n).sourceName;
      return (
        (this.onlyFiles.length == 0 || this._contains(this.onlyFiles, src)) && !this._contains(this.skipFiles, src)
      );
    };

    const filtered = names.filter(filterer);

    this._verboseLog(`${names.length} compiled contracts found, skipping ${names.length - filtered.length} of them\n`);

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
    this._verboseLog(
      `Generating bindings into ${this.outDir} ${this.deployable ? "with" : "without"} deployment method\n`,
    );

    for (const name of artifactNames) {
      const artifact = await this.artifacts.readArtifact(name);
      const contract = artifact.contractName;
      const source = artifact.sourceName;

      const abiPath = `${this.outDir}/${contract}.abi`;

      const packageName = contract.replaceAll("-", "").replaceAll("_", "").toLowerCase();

      const genDir = `${this.outDir}/${path.dirname(source)}/${packageName}`;
      const genPath = `${genDir}/${contract}.${this.lang}`;

      const v2Flag = this.abigenVersion == "v1" ? `` : ` --v2`;
      const argv = `abigen${v2Flag} --abi ${abiPath} --pkg ${packageName} --type ${contract} --out ${genPath}`;

      this._verboseLog(`Generating bindings: ${argv}`);

      this._verboseLog(`${contract}: ${source}`);

      if (!fs.existsSync(this.outDir)) {
        await fsp.mkdir(this.outDir, { recursive: true });
      }

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

  _toUnixPath(userPath) {
    return userPath.split(path.sep).join(path.posix.sep);
  }

  _contains(pathList, source) {
    const isSubPath = (parent, child) => {
      const parentTokens = parent.split(path.posix.sep).filter((i) => i.length);
      const childTokens = child.split(path.posix.sep).filter((i) => i.length);
      return parentTokens.every((t, i) => childTokens[i] === t);
    };

    return pathList === undefined ? false : pathList.some((p) => isSubPath(p, source));
  }

  _verboseLog(msg) {
    if (hre.config.gobind.verbose) {
      console.log(msg);
    }
  }

  async abigen(path, argv) {
    const go = new Go();

    go.argv = argv;
    go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);

    try {
      const abigenObj = await WebAssembly.instantiate(await fsp.readFile(path), go.importObject);

      await go.run(abigenObj.instance);
      go._pendingEvent = { id: 0 };
    } catch (e) {
      throw new Error(e.message);
    }
  }
};

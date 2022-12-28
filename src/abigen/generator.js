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
    this.artifacts = hre.artifacts;
    this.deployable = hre.config.gobind.deployable;
    this.lang = hre.config.gobind.useJava ? "java" : "go";
    this.outDir = path.resolve(hre.config.gobind.outDir);
    this.dirExists = fs.existsSync(this.outDir);
    this.pkgName = camelCase(path.basename(this.outDir));
  }

  async generateAll() {
    const names = await this.artifacts.getAllFullyQualifiedNames();

    await this.generate(names);
  }

  async generate(artifactNames) {
    if (!this.dirExists) {
      await fsp.mkdir(this.outDir);

      this.dirExists = true;
    }

    for (const name of artifactNames) {
      const artifact = await this.artifacts.readArtifact(name);
      const contract = artifact.contractName;

      const abiPath = `${this.outDir}/${contract}.abi`;

      const argv = `abigen --abi ${abiPath} --pkg ${this.pkgName} --type ${contract} --lang ${this.lang} --out ${this.outDir}/${contract}.${this.lang}`;

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
    if (!this.dirExists) return;

    const dirStats = await fsp.stat(this.outDir);

    if (!dirStats.isDirectory()) {
      throw new Error(`outDir path is not a directory: ${this.outDir}`);
    }

    const contents = await fsp.readdir(this.outDir, { withFileTypes: true });

    contents.forEach((f) => {
      if (!f.isFile())
        throw new Error(`artifact '${this.outDir}/${f.name}' is not a file`);
    });

    await fsp.rm(this.outDir, { recursive: true, force: true });
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
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
};

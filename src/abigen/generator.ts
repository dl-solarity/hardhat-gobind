import { exec as execCallback } from "child_process"
import { Artifact, Artifacts, HardhatRuntimeEnvironment } from "hardhat/types"
import _ from "lodash"
import { basename, resolve } from "path"
import { existsSync } from "fs"
import { mkdir, stat, readdir, rm, writeFile } from "fs/promises"
import { promisify } from "util"

// For some reason, callback in exec() is not called while running on HRE, although it is called outside HRE or with timeout
const exec = promisify(execCallback)

export class Generator {
    private abigenPath: string
    private artifacts: Artifacts
    private deployable: boolean
    private dirExists: boolean
    private lang: string
    private outDir: string
    private pkgName: string

    constructor(hre: HardhatRuntimeEnvironment) {
        this.abigenPath = resolve(hre.config.gobind.abigenPath)
        this.artifacts = hre.artifacts
        this.deployable = hre.config.gobind.deployable
        this.lang = hre.config.gobind.useJava ? "go" : "java"
        this.outDir = resolve(hre.config.gobind.outDir)
        this.dirExists = existsSync(this.outDir)
        this.pkgName = _.camelCase(basename(this.outDir))
    }

    async generateAll() {
        const names = await this.artifacts.getAllFullyQualifiedNames()
        await this.generate(names)
    }

    async generate(artifactNames: string[]) {
        for (const name of artifactNames) {
            if (!this.dirExists) {
                await mkdir(this.outDir)
                this.dirExists = true
            }

            const artifact = await this.artifacts.readArtifact(name)
            const abi = JSON.stringify(artifact.abi)
            const contract = artifact.contractName

            const cmdBase = `echo '${abi}' | ${this.abigenPath} --pkg ${this.pkgName} --type ${contract} --lang ${this.lang} --out ${this.outDir}/${contract}.${this.lang} --abi -`
            if (this.deployable) {
                await this.generateWithBytecode(artifact, cmdBase)
                continue
            }

            await exec(cmdBase)
        }
    }

    async clean() {
        if (!this.dirExists) return

        const dirStats = await stat(this.outDir)
        if (!dirStats.isDirectory()) {
            throw new Error(`outDir path is not a directory: ${this.outDir}`)
        }

        const contents = await readdir(this.outDir, { withFileTypes: true })
        contents.forEach(f => {
            if (!f.isFile())
                throw new Error(`artifact '${this.outDir}/${f.name}' is not a file`)
        })

        await rm(this.outDir, { recursive: true, force: true })
    }

    private async generateWithBytecode(artifact: Artifact, cmdBase: string) {
        const binPath = `${this.outDir}/${artifact.contractName}.bin`
        await writeFile(binPath, artifact.bytecode)
        const cmd = `${cmdBase} --bin ${binPath}`
        await exec(cmd)
        await rm(binPath)
    }
}

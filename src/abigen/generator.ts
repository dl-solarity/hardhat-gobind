import { exec, execSync } from "child_process"
import { Artifact, Artifacts, HardhatRuntimeEnvironment } from "hardhat/types"
import _ from "lodash"
import { basename, resolve } from "path"
import { existsSync } from "fs"
import { mkdir, stat, readdir, rm, writeFile } from "fs/promises"

export class Generator {
    private abigenPath: string
    private artifacts: Artifacts
    private deployable: boolean
    private dirExists: boolean
    private outDir: string
    private pkgName: string

    constructor(hre: HardhatRuntimeEnvironment) {
        this.abigenPath = resolve(hre.config.gobind.abigenPath)
        this.artifacts = hre.artifacts
        this.deployable = hre.config.gobind.deployable
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

            const cmdBase = `echo '${abi}' | ${this.abigenPath} --pkg ${this.pkgName} --type ${contract} --out ${this.outDir}/${contract}.go --abi -`
            if (this.deployable) {
                await this.generateWithBytecode(artifact, cmdBase)
                continue
            }

            // todo: try to make exec more beautiful with args, also handle error in callback
            exec(cmdBase, (err, _stdout, _stderr) => {
                if (err)
                    throw new Error(`failed to generate bindings: ${err}`)
            })
            // execSync(cmdBase)
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
        // Callback for exec is not executed. It works outside of hardhat, and doesn't inside.
        const binPath = `${this.outDir}/${artifact.contractName}.bin`
        await writeFile(binPath, artifact.bytecode)
        const cmd = `${cmdBase} --bin ${binPath}`
        exec(cmd, async (err, _stdout, _stderr) => {
            if (err)
                throw new Error(`failed to generate bindings: ${err}`)
            await rm(binPath)
        })
        // execSync(cmd)
    }
}

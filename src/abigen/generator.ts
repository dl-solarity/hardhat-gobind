import { exec } from "child_process"
import { Artifacts, HardhatRuntimeEnvironment } from "hardhat/types"
import _ from "lodash"
import { basename, resolve } from "path"
import { existsSync } from "fs"
import { mkdir, stat, readdir, rm } from "fs/promises"

export class Generator {
    private abigenPath: string
    private artifacts: Artifacts
    private dirExists: boolean
    private outDir: string
    private pkgName: string

    constructor(hre: HardhatRuntimeEnvironment) {
        this.abigenPath = resolve(hre.config.gobind.abigenPath)
        this.artifacts = hre.artifacts
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
            exec(`echo '${abi}' | ${this.abigenPath} --pkg ${this.pkgName} --type ${contract} --out ${this.outDir}/${contract}.go --abi -`)
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
}

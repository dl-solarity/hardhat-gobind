import { TASK_CLEAN, TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'
import { extendConfig, task, types } from 'hardhat/config'

import './type-extensions'
import { getDefaultGoBindConfig } from './config'
import { TASK_GOBIND } from './constants'
import { ActionType } from 'hardhat/types'
import { Generator } from './abigen/generator'

interface BindingArgs {
  output?: string
  compile: boolean
  deployable: boolean
  java: boolean
}

extendConfig(getDefaultGoBindConfig)

const gobind: ActionType<BindingArgs> = async ({ output, compile, deployable, java }, hre) => {
  if (output !== undefined)
    hre.config.gobind.outDir = output
  if (deployable)
    hre.config.gobind.deployable = true
  if (java)
    hre.config.gobind.useJava = true

  if (compile)
    await hre.run(TASK_COMPILE, { generateBind: false })

  try {
    await new Generator(hre).generateAll()
  } catch (err) {
    console.log(`[GOBIND:ERROR] Failed to generate bindings: ${(err as Error).message}`)
    return
  }

  const art = await hre.artifacts.getAllFullyQualifiedNames()
  console.log(`[GOBIND:INFO] Generated bindings for ${art.length} contracts`)
}

task(TASK_GOBIND, 'Generate Go bindings for compiled contracts')
  .addOptionalParam('output', 'Output directory for generated bindings (Go package name is derived from it)', undefined, types.string)
  .addFlag('compile', 'Run compile task before the generation')
  .addFlag('deployable', 'Generate contract bytecode for ability to deploy it from Go code')
  .addFlag('java', 'Generate Java bindings instead of Go')
  .setAction(gobind)

task(TASK_COMPILE)
  .addFlag('generateBind', 'Generate Go bindings after compilation')
  .setAction(async ({ generateBind }: { generateBind: boolean }, { config, run }, runSuper) => {
    await runSuper()

    if (config.gobind.runOnCompile || generateBind)
      await run(TASK_GOBIND, { compile: false })
  })

task(TASK_CLEAN, 'Clears the cache and deletes all artifacts')
  .setAction(async ({ global }: { global: boolean }, hre, runSuper) => {
    if (!global)
      try {
        await new Generator(hre).clean()
      } catch (err) {
        console.log(`[GOBIND:ERROR] Generated resources are not cleaned: ${(err as Error).message}`)
      }

    await runSuper()
  },
  )
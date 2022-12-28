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
}

extendConfig(getDefaultGoBindConfig)

const gobind: ActionType<BindingArgs> = async ({ output, compile }, hre) => {
  if (output !== undefined)
    hre.config.gobind.outDir = output
  if (compile)
    return hre.run(TASK_COMPILE, { generateBind: true })
  await new Generator(hre).generateAll()
  const art = await hre.artifacts.getAllFullyQualifiedNames()
  console.log(`Generating bindings for ${art.length} contracts`)
};

task(TASK_GOBIND, 'Generate Go bindings for compiled contracts')
  .addOptionalParam('output', 'Output directory for generated bindings (Go package name is derived from it)', undefined, types.string)
  .addFlag('compile', 'Run compile task before the generation')
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
      await new Generator(hre).clean()
    await runSuper()
  },
  )
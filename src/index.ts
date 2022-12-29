const Generator = require("./abigen/generator");

import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task, types } from "hardhat/config";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import "./type-extensions";
import { getDefaultGoBindConfig } from "./config";
import { TASK_GOBIND, pluginName } from "./constants";
import { ActionType } from "hardhat/types";

interface BindingArgs {
  output?: string;
  deployable: boolean;
  compile: boolean;
}

extendConfig(getDefaultGoBindConfig);

const gobind: ActionType<BindingArgs> = async ({ output, deployable, compile }, hre) => {
  hre.config.gobind.outdir = output === undefined ? hre.config.gobind.outdir : output;
  hre.config.gobind.deployable = !deployable ? hre.config.gobind.deployable : deployable;

  if (compile) {
    await hre.run(TASK_COMPILE, { generateBind: false });
  }

  try {
    await new Generator(hre).generate();
  } catch (e: any) {
    throw new NomicLabsHardhatPluginError(pluginName, e.message);
  }

  const artifacts = await hre.artifacts.getAllFullyQualifiedNames();

  console.log(`\nGenerated bindings for ${artifacts.length} contracts`);
};

task(TASK_GOBIND, "Generate Go bindings for compiled contracts")
  .addOptionalParam(
    "outdir",
    "Output directory for generated bindings (Go package name is derived from it as well)",
    undefined,
    types.string
  )
  .addFlag("deployable", "Generate bindings with the bytecode in order to deploy the contracts within Go")
  .addFlag("compile", "Compile smart contracts before the generation")
  .setAction(gobind);

task(TASK_COMPILE)
  .addFlag("generateBindings", "Generate bindings after compilation")
  .setAction(async ({ generateBindings }: { generateBindings: boolean; }, { config, run }, runSuper) => {
    await runSuper();

    if (config.gobind.runOnCompile || generateBindings) {
      await run(TASK_GOBIND, { compile: false });
    }
  });

task(TASK_CLEAN, "Clears the cache and deletes all artifacts").setAction(
  async ({ global }: { global: boolean; }, hre, runSuper) => {
    if (!global)
      try {
        await new Generator(hre).clean();
      } catch (e: any) {
        throw new NomicLabsHardhatPluginError(pluginName, e.message);
      }

    await runSuper();
  }
);

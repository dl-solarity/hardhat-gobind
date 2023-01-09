const Generator = require("./abigen/generator");

import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task, types } from "hardhat/config";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import "./type-extensions";
import { getDefaultGoBindConfig } from "./config";
import { TASK_GOBIND, pluginName } from "./constants";
import { ActionType } from "hardhat/types";

interface BindingArgs {
  outdir?: string;
  deployable: boolean;
  noCompile: boolean;
  _abigenPath?: string;
}

extendConfig(getDefaultGoBindConfig);

const gobind: ActionType<BindingArgs> = async ({ outdir, deployable, noCompile, _abigenPath }, hre) => {
  hre.config.gobind.outdir = outdir === undefined ? hre.config.gobind.outdir : outdir;
  hre.config.gobind.deployable = !deployable ? hre.config.gobind.deployable : deployable;

  if (!noCompile) {
    await hre.run(TASK_COMPILE, { generateBind: false, _abigenPath: _abigenPath });
  }

  try {
    const contracts = await new Generator(hre, _abigenPath).generate();
    console.log(`\nGenerated bindings for ${contracts.length} contracts`);
  } catch (e: any) {
    throw new NomicLabsHardhatPluginError(pluginName, e.message);
  }
};

task(TASK_GOBIND, "Generate Go bindings for compiled contracts")
  .addOptionalParam(
    "outdir",
    "Output directory for generated bindings (Go package name is derived from it as well)",
    undefined,
    types.string
  )
  .addFlag("deployable", "Generate bindings with the bytecode in order to deploy the contracts within Go")
  .addFlag("noCompile", "Do not compile smart contracts before the generation")
  .setAction(gobind);

task(TASK_COMPILE)
  .addFlag("generateBindings", "Generate bindings after compilation")
  .setAction(
    async (
      { generateBindings, _abigenPath }: { generateBindings: boolean; _abigenPath?: string },
      { config, run },
      runSuper
    ) => {
      await runSuper();

      if (config.gobind.runOnCompile || generateBindings) {
        await run(TASK_GOBIND, { noCompile: true, _abigenPath: _abigenPath });
      }
    }
  );

task(TASK_CLEAN, "Clears the cache and deletes all artifacts").setAction(
  async ({ global }: { global: boolean }, hre, runSuper) => {
    if (!global)
      try {
        await new Generator(hre).clean();
      } catch (e: any) {
        throw new NomicLabsHardhatPluginError(pluginName, e.message);
      }

    await runSuper();
  }
);

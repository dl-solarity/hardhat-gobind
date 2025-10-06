import type { NewTaskActionFunction } from "hardhat/types/tasks";

import { HardhatPluginError } from "@nomicfoundation/hardhat-errors";

import { PLUGIN_ID } from "../../../constants.js";
// Type import for CJS generator declarations
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Generator from "../../../abigen/generator.cjs";

export interface DlGoBindArgs {
  outdir?: string;
  deployable?: boolean;
  noCompile?: boolean;
  v2?: boolean;
  abigenPath?: string;
}

const gobindAction: NewTaskActionFunction<DlGoBindArgs> = async (
  { outdir, deployable, noCompile, v2, abigenPath },
  hre,
) => {
  if (outdir !== undefined) {
    hre.config.gobind.outdir = outdir;
  }
  if (deployable !== undefined) {
    hre.config.gobind.deployable = deployable;
  }
  if (v2) {
    hre.config.gobind.abigenVersion = "v2";
  }
  if (abigenPath !== undefined && abigenPath !== "") {
    hre.config.gobind.abigenPath = abigenPath;
  }

  if (!noCompile) {
    await hre.tasks.getTask("compile").run({
      quiet: true,
      defaultBuildProfile: "production",
    });
  }

  try {
    const effectiveAbigenPath = abigenPath && abigenPath !== "" ? abigenPath : hre.config.gobind.abigenPath;
    const contracts = await new (Generator as any)(hre, effectiveAbigenPath).generate();

    console.log(`\nGenerated bindings for ${contracts.length} contracts`);
  } catch (e: any) {
    throw new HardhatPluginError(PLUGIN_ID, `Failed to generate bindings: ${e.message}`, e);
  }
};

export default gobindAction;

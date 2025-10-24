import type { NewTaskActionFunction } from "hardhat/types/tasks";

import { HardhatPluginError } from "@nomicfoundation/hardhat-errors";

import { PLUGIN_ID } from "../../../constants.js";

import { getArtifacts } from "../../../hre-integration.js";

import { createRequire } from "module";
const Generator = createRequire(import.meta.url)("abigenjs/generator.cjs");

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
  if (abigenPath !== undefined) {
    hre.config.gobind.abigenPath = abigenPath;
  }

  if (!noCompile) {
    await hre.tasks.getTask("compile").run({
      quiet: true,
      defaultBuildProfile: "production",
    });
  }

  try {
    const onlyFiles = hre.config.gobind.onlyFiles || [];
    const skipFiles = hre.config.gobind.skipFiles || [];

    const artifacts = await getArtifacts(hre, onlyFiles, skipFiles);

    const outDir = hre.config.gobind.outdir || "./generated-types/bindings";

    const abigenVersion = hre.config.gobind.abigenVersion || "v2";
    const effectiveAbigenPath = abigenPath && abigenPath !== "" ? abigenPath : hre.config.gobind.abigenPath;

    const deployable = hre.config.gobind.deployable || false;
    const verbose = hre.config.gobind.verbose || false;

    await new Generator(outDir, abigenVersion, effectiveAbigenPath).generate(artifacts, deployable, verbose);

    console.log(`\nGenerated bindings for ${artifacts.length} contracts`);
  } catch (e: any) {
    throw new HardhatPluginError(PLUGIN_ID, `Failed to generate bindings: ${e.message}`, e);
  }
};

export default gobindAction;

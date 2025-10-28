import "./type-extensions.js";

import type { HardhatPlugin } from "hardhat/types/plugins";
import { overrideTask } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";

import { Generator } from "abigenjs/generator";

import gobindTask from "./internal/tasks/gobind/index.js";

import { GOBIND_NPM_PACKAGE, PLUGIN_ID } from "./constants.js";

export { getArtifacts } from "./hre-integration.js";

const hardhatPlugin: HardhatPlugin = {
  id: PLUGIN_ID,
  hookHandlers: {
    config: () => import("./config.js"),
  },
  tasks: [
    gobindTask,
    overrideTask("compile")
      .setAction(async () => ({
        default: async (args, hre, runSuper) => {
          const result = await runSuper(args);

          if (hre.config.gobind.runOnCompile) {
            const abigenPath = hre.config.gobind.abigenPath || undefined;
            await hre.tasks.getTask("gobind").run({ noCompile: true, abigenPath });
          }

          return result;
        },
      }))
      .build(),
    overrideTask("clean")
      .setAction(async () => ({
        default: async (args, hre, runSuper) => {
          if (!args.global)
            try {
              const abigenPath = hre.config.gobind.abigenPath || undefined;
              const abigenVersion = hre.config.gobind.abigenVersion || "v2";
              const outDir = hre.config.gobind.outdir || "./generated-types/bindings";

              await new Generator(outDir, abigenVersion, abigenPath).clean();
            } catch (e: any) {
              throw new HardhatPluginError(
                PLUGIN_ID,
                `Failed to remove gobind artifacts at ${hre.config.gobind.outdir}`,
                e,
              );
            }

          await runSuper(args);
        },
      }))
      .build(),
  ],
  npmPackage: GOBIND_NPM_PACKAGE,
} satisfies HardhatPlugin;

export default hardhatPlugin;

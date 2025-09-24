import { isAbsolute } from "path";

import type { ConfigurationVariableResolver, HardhatConfig, HardhatUserConfig } from "hardhat/types/config";
import type { ConfigHooks, HardhatUserConfigValidationError } from "hardhat/types/hooks";

import { HardhatPluginError } from "hardhat/plugins";
import { validateUserConfigZodType } from "@nomicfoundation/hardhat-zod-utils";

import { z } from "zod";

import { PLUGIN_ID } from "./constants.js";
import type { DlGoBindConfig, DlGoBindUserConfig } from "./types.js";

export default async (): Promise<Partial<ConfigHooks>> => ({
  validateUserConfig,
  resolveUserConfig,
});

const userConfigType = z.object({
  gobind: z
    .object({
      outdir: z.string().optional(),
      deployable: z.boolean().optional(),
      runOnCompile: z.boolean().optional(),
      abigenVersion: z.enum(["v1", "v2"]).optional(),
      verbose: z.boolean().optional(),
      onlyFiles: z.array(z.string().refine((p) => !isAbsolute(p), "Expected a relative path")).optional(),
      skipFiles: z.array(z.string().refine((p) => !isAbsolute(p), "Expected a relative path")).optional(),
    })
    .optional(),
});

export async function validateUserConfig(userConfig: HardhatUserConfig): Promise<HardhatUserConfigValidationError[]> {
  return validateUserConfigZodType(userConfig, userConfigType);
}

export async function resolveUserConfig(
  userConfig: HardhatUserConfig,
  resolveConfigurationVariable: ConfigurationVariableResolver,
  next: (
    nextUserConfig: HardhatUserConfig,
    nextResolveConfigurationVariable: ConfigurationVariableResolver,
  ) => Promise<HardhatConfig>,
): Promise<HardhatConfig> {
  const resolvedConfig = await next(userConfig, resolveConfigurationVariable);

  return {
    ...resolvedConfig,
    gobind: {
      ...resolvedConfig.gobind,
      ...omitUndefined(await resolveGobindConfig(userConfig.gobind, resolveConfigurationVariable)),
    },
  };
}

async function resolveGobindConfig(
  gobindConfig: DlGoBindUserConfig | undefined,
  resolveConfigurationVariable: ConfigurationVariableResolver,
): Promise<Partial<DlGoBindConfig>> {
  const defaultConfig: DlGoBindConfig = {
    outdir: "./generated-types/bindings",
    deployable: false,
    runOnCompile: false,
    abigenVersion: "v1",
    verbose: false,
    onlyFiles: [],
    skipFiles: [],
  };

  if (gobindConfig === undefined) {
    return defaultConfig;
  }

  const resolved: DlGoBindConfig = { ...defaultConfig };

  if (typeof gobindConfig.outdir === "string") {
    resolved.outdir = await resolveConfigurationVariable(gobindConfig.outdir).get();
  }

  if (typeof gobindConfig.deployable === "boolean") {
    resolved.deployable = gobindConfig.deployable;
  }

  if (typeof gobindConfig.runOnCompile === "boolean") {
    resolved.runOnCompile = gobindConfig.runOnCompile;
  }

  if (typeof gobindConfig.abigenVersion === "string") {
    resolved.abigenVersion = gobindConfig.abigenVersion as DlGoBindConfig["abigenVersion"];
  }

  if (typeof gobindConfig.verbose === "boolean") {
    resolved.verbose = gobindConfig.verbose;
  }

  if (Array.isArray(gobindConfig.onlyFiles)) {
    resolved.onlyFiles = await Promise.all(
      gobindConfig.onlyFiles.map((p: string) => resolveConfigurationVariable(p).get()),
    );
  }

  if (Array.isArray(gobindConfig.skipFiles)) {
    resolved.skipFiles = await Promise.all(
      gobindConfig.skipFiles.map((p: string) => resolveConfigurationVariable(p).get()),
    );
  }

  return resolved;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (out as any)[key] = value;
    }
  }
  return out;
}

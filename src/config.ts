import { isAbsolute } from "path";

import { ConfigExtender } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import { pluginName } from "./constants";
import { DlGoBindConfig } from "./types";

export const getDefaultGoBindConfig: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig: DlGoBindConfig = {
    outdir: "./generated-types/bindings",
    deployable: false,
    runOnCompile: false,
    abigenVersion: "v1",
    verbose: false,
    onlyFiles: [],
    skipFiles: [],
  };

  if (config.gobind === undefined) {
    resolvedConfig.gobind = defaultConfig;
    return;
  }

  if (!areRelativePaths(config.gobind.onlyFiles)) {
    throw new NomicLabsHardhatPluginError(pluginName, "config.gobind.onlyFiles must only include relative paths");
  }

  if (!areRelativePaths(config.gobind.skipFiles)) {
    throw new NomicLabsHardhatPluginError(pluginName, "config.gobind.skipFiles must only include relative paths");
  }

  const { cloneDeep } = require("lodash");
  const customConfig = cloneDeep(config.gobind);
  resolvedConfig.gobind = { ...defaultConfig, ...customConfig };
};

const areRelativePaths = (array?: string[]): boolean => array === undefined || array.every((p) => !isAbsolute(p));

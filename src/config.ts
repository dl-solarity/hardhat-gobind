import { ConfigExtender } from "hardhat/types";

export const getDefaultGoBindConfig: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig = {
    outdir: "./generated-types/bindings",
    deployable: false,
    runOnCompile: false,
    onlyFiles: [],
    skipFiles: [],
  };

  if (config.gobind === undefined) {
    resolvedConfig.gobind = defaultConfig;
    return;
  }

  const { cloneDeep } = require("lodash");
  const customConfig = cloneDeep(config.gobind);
  resolvedConfig.gobind = { ...defaultConfig, ...customConfig };
};

import { ConfigExtender } from "hardhat/types";

export const getDefaultGoBindConfig: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig = {
    outDir: "./generated-types/gobind",
    deployable: false,
    runOnCompile: false,
    useJava: false,
  };

  if (config.gobind === undefined) {
    resolvedConfig.gobind = defaultConfig;
    return;
  }

  const { cloneDeep } = require("lodash");
  const customConfig = cloneDeep(config.gobind);
  resolvedConfig.gobind = { ...defaultConfig, ...customConfig };
};

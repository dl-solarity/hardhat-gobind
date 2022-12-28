import { getOpcodeLength } from "hardhat/internal/hardhat-network/stack-traces/opcodes"
import { ConfigExtender } from "hardhat/types"

export const getDefaultGoBindConfig: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig = {
    outDir: './artifacts/gobind',
    deployable: false,
    runOnCompile: false,
    language: 'go',
    abigenPath: './node_modules/hardhat-gobind/bin/abigen'
  }

  if (config.gobind === undefined) {
    resolvedConfig.gobind = defaultConfig
    return
  }

  const { cloneDeep } = require("lodash")
  const customConfig = cloneDeep(config.gobind)
  resolvedConfig.gobind = { ...defaultConfig, ...customConfig }
}

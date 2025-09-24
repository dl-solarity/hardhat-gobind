import gobind from "../../../src/index.js";

import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  plugins: [gobind],
  gobind: {
    outdir: "go",
    deployable: true,
    runOnCompile: true,
    abigenVersion: "v2",
    verbose: true,
    onlyFiles: ["./contracts", "local/MyContract.sol"],
    skipFiles: ["@openzeppelin", "./contracts/interfaces"],
  },
};

export default config;

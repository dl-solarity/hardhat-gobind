import "../../../src/index";

import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  defaultNetwork: "hardhat",
  gobind: {
    outdir: "go",
    deployable: true,
    runOnCompile: true,
    abigenVersion: 1,
    verbose: true,
    onlyFiles: ["./contracts", "local/MyContract.sol"],
    skipFiles: ["@openzeppelin", "./contracts/interfaces"],
  },
};

export default config;

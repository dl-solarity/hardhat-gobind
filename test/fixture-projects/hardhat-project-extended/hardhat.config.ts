import gobind from "../../../src/index.js";

import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    npmFilesToBuild: ["@openzeppelin/contracts/access/Ownable.sol", "@openzeppelin/contracts/utils/Context.sol"],
  },
  plugins: [gobind],
};

export default config;

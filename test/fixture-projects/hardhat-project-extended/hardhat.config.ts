import gobind from "../../../src/index.js";

import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  plugins: [gobind],
};

export default config;

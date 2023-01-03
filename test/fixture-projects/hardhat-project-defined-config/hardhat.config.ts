import "../../../src/index"; // plugin self-load
import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  defaultNetwork: "hardhat",
  gobind: {
    outdir: "go",
    deployable: true,
    runOnCompile: true,
    verbose: true,
    onlyFiles: ["./contracts", "local/MyContract.sol"],
    skipFiles: ["@openzeppelin", "./contracts/interfaces"],
  },
};

export default config;

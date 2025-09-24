import "hardhat/types/config";

import { DlGoBindConfig, DlGoBindUserConfig } from "./types.js";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    gobind?: DlGoBindUserConfig;
  }

  interface HardhatConfig {
    gobind: DlGoBindConfig;
  }
}

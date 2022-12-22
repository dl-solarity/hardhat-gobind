import "hardhat/types/config";

import { DlGoBindConfig, DlGoBindUserConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    gobind: DlGoBindConfig;
  }

  interface HardhatUserConfig {
    gobind?: DlGoBindUserConfig;
  }
}

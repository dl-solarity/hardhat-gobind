import type { HardhatRuntimeEnvironment } from "hardhat/types";

declare class Generator {
  constructor(hre: HardhatRuntimeEnvironment, abigenPath?: string);
  generate(): Promise<string[]>;
  clean(): Promise<void>;
}

export = Generator;

import { TASK_CLEAN } from "hardhat/builtin-tasks/task-names";
import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import path from "path";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
  }
}

export function useEnvironment(fixtureProjectName: string, networkName = "hardhat") {
  beforeEach("Loading hardhat environment", function () {
    process.chdir(path.join(__dirname, "fixture-projects", fixtureProjectName));
    process.env.HARDHAT_NETWORK = networkName;

    this.env = require("hardhat");
    this.outdir = this.env.config.gobind.outdir;
  });

  afterEach("Resetting hardhat", function () {
    resetHardhatContext();
  });

  after("Performing cleanup of all the redundant files", async function () {
    await this.env.run(TASK_CLEAN);
  });
}

export function cleanAfterEach() {
  // Manual removing of generated files should be faster than full cleanup because of the frequent re-compilations
  // Another way is to use the different outdir for each case
  // Surprisingly, full cleanup after each case is faster than manual rm of outir
  afterEach(async function () {
    await this.env.run(TASK_CLEAN);
    // rmSync(this.outdir, { recursive: true, force: true });
  });
}

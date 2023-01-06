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
    await this.env.run(TASK_CLEAN); // this is faster
    // rm(this.outdir, { recursive: true, force: true });
    // rmSync(this.outdir, { recursive: true, force: true });
  });
}

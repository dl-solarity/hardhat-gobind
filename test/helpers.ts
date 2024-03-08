import path from "path";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { resetHardhatContext } from "hardhat/plugins-testing";
import { TASK_CLEAN } from "hardhat/builtin-tasks/task-names";

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

  afterEach("Resetting hardhat", async function () {
    resetHardhatContext();

    await this.env.run(TASK_CLEAN);
  });
}

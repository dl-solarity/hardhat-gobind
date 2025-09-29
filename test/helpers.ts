import path from "path";

import { fileURLToPath } from "url";

import "../src/type-extensions.js";

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { createHardhatRuntimeEnvironment } from "hardhat/hre";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
    outdir: string;
    _cwd?: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function useEnvironment(fixtureProjectName: string, networkName = "hardhat") {
  beforeEach("Loading hardhat environment", async function () {
    this._cwd = process.cwd();

    const projectPath = path.join(__dirname, "fixture-projects", fixtureProjectName);
    const configPath = path.join(__dirname, "fixture-projects", fixtureProjectName, "hardhat.config.ts");

    process.chdir(projectPath);
    process.env.HARDHAT_NETWORK = networkName;

    this.env = await createHardhatRuntimeEnvironment(
      (await import(configPath)).default,
      { config: configPath },
      projectPath,
    );
    this.outdir = path.join(projectPath, this.env.config.gobind.outdir);
  });

  afterEach("Resetting hardhat", async function () {
    await this.env.tasks.getTask("clean").run({});
  });
}

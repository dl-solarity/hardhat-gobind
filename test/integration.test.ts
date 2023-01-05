import { assert } from "chai";
import { existsSync } from "fs";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { TASK_GOBIND } from "../src/constants";
import { useEnvironment } from "./helpers";

describe("GoBind x Hardhat", function () {
  useEnvironment("hardhat-project-undefined-config");

  const abigenPath = { _abigenPath: "../../../bin/abigen.wasm" };

  const assertExists = (path: string) => assert.isTrue(existsSync(path), `path ${path} should exist`);
  const assertNotExists = (path: string) => assert.isFalse(existsSync(path), `path ${path} should not exist`);
  const assertContractsGenerated = (outdir: string) => {
    assertExists(outdir);
    assertExists(`${outdir}/contracts`);
    assertExists(`${outdir}/contracts/Lock.go`);
  };

  this.afterAll("Performing cleanup of all the redundant files", async function () {
    await this.env.run(TASK_CLEAN);
  });

  it("does not generate bindings with --no-compile and no artifacts", async function () {
    await this.env.run(TASK_GOBIND, { noCompile: true, ...abigenPath });
    assertNotExists(this.outdir);
  });

  it("compiles and generates bindings", async function () {
    assertNotExists(this.outdir);

    await this.env.run(TASK_GOBIND, abigenPath);
    assertContractsGenerated(this.outdir);
  });

  it("cleans up generated bindings", async function () {
    assertExists(this.outdir);

    await this.env.run(TASK_CLEAN);
    assertNotExists(this.outdir);
  });

  it("generates bindings on compilation with --generate-bindings", async function () {
    assertNotExists(this.outdir);

    await this.env.run(TASK_COMPILE, { generateBindings: true, ...abigenPath });
    assertContractsGenerated(this.outdir);
  });
});

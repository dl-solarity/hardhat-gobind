import { assert } from "chai";

import { useEnvironment } from "./helpers.js";

describe("hardhat-gobind configuration extension", function () {
  useEnvironment("hardhat-project-defined-config", "hardhat");

  it("the gobind field should be present", async function () {
    assert.isDefined(this.env.config.gobind);
  });

  it("the gobind object should have values from hardhat.env.config.js", async function () {
    const { gobind } = this.env.config;

    assert.equal(gobind.outdir, "go");
    assert.equal(gobind.deployable, true);
    assert.equal(gobind.runOnCompile, true);
    assert.equal(gobind.abigenVersion, "v2");
    assert.equal(gobind.verbose, true);
    assert.deepEqual(gobind.onlyFiles, ["./contracts", "local/MyContract.sol"]);
    assert.deepEqual(gobind.skipFiles, ["@openzeppelin", "./contracts/interfaces"]);
  });
});

describe("hardhat-gobind configuration defaults in an empty project", function () {
  useEnvironment("hardhat-project-undefined-config", "hardhat");

  it("the gobind field should be present", async function () {
    assert.isDefined(this.env.config.gobind);
  });

  it("fields of the gobind object should be set to default", async function () {
    const { gobind } = this.env.config;

    assert.equal(gobind.outdir, "./generated-types/bindings");
    assert.equal(gobind.deployable, false);
    assert.equal(gobind.runOnCompile, false);
    assert.equal(gobind.verbose, false);
    assert.equal(gobind.abigenVersion, "v1");
    assert.deepEqual(gobind.onlyFiles, []);
    assert.deepEqual(gobind.skipFiles, []);
  });
});

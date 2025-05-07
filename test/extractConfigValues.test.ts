import path from "path";

import { assert } from "chai";

import { useEnvironment } from "./helpers";

import Generator from "../src/abigen/generator";

describe("hardhat-gobind configuration extension", function () {
  useEnvironment("hardhat-project-defined-config", "hardhat");

  it("the gobind field should be present", function () {
    assert.isDefined(this.env.config.gobind);
  });

  it("the gobind object should have values from hardhat.env.config.js", function () {
    const { gobind } = this.env.config;

    assert.equal(gobind.outdir, "go");
    assert.equal(gobind.deployable, true);
    assert.equal(gobind.runOnCompile, true);
    assert.equal(gobind.abigenVersion, 1);
    assert.equal(gobind.verbose, true);
    assert.deepEqual(gobind.onlyFiles, ["./contracts", "local/MyContract.sol"]);
    assert.deepEqual(gobind.skipFiles, ["@openzeppelin", "./contracts/interfaces"]);
  });

  it("should correctly get params from defined config", function () {
    const instance = new Generator(this.env);

    assert.equal(instance.outDir, path.resolve("go"));
    assert.equal(instance.deployable, true);
    assert.equal(instance.abigenVersion, 1);
    assert.deepEqual(instance.onlyFiles, ["contracts", "local/MyContract.sol"]);
    assert.deepEqual(instance.skipFiles, ["@openzeppelin", "contracts/interfaces"]);
  });
});

describe("hardhat-gobind configuration defaults in an empty project", function () {
  useEnvironment("hardhat-project-undefined-config", "hardhat");

  it("the gobind field should be present", function () {
    assert.isDefined(this.env.config.gobind);
  });

  it("fields of the gobind object should be set to default", function () {
    const { gobind } = this.env.config;

    assert.equal(gobind.outdir, "./generated-types/bindings");
    assert.equal(gobind.deployable, false);
    assert.equal(gobind.runOnCompile, false);
    assert.equal(gobind.verbose, false);
    assert.equal(gobind.abigenVersion, 1);
    assert.deepEqual(gobind.onlyFiles, []);
    assert.deepEqual(gobind.skipFiles, []);
  });

  it("should correctly get params from undefined config", function () {
    const instance = new Generator(this.env);

    assert.equal(instance.outDir, path.resolve("generated-types/bindings"));
    assert.equal(instance.deployable, false);
    assert.equal(instance.abigenVersion, 1);
    assert.deepEqual(instance.onlyFiles, []);
    assert.deepEqual(instance.skipFiles, []);
  });
});
